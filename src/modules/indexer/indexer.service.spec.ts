import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { Connection, connect } from 'mongoose';
import { FuelService } from '../fuel/fuel.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EthService } from '../eth/eth.service';
import { ERROR_DB_CORRUPTION, IndexerService } from './indexer.service';
import { Anvil } from '@viem/anvil';
import { ethTestWallets, forwardETHChain, setupAnvil } from 'test/utils';
import {
  ContractTransactionReceipt,
  JsonRpcProvider,
  Wallet,
  zeroPadValue,
} from 'ethers';
import {
  FuelMessagePortal,
  FuelMessagePortal__factory,
} from '@/types/solidity';
import {
  EthL1L2Messages,
  EthL1L2MessagesSchema,
} from './schemas/eth.l1l2.messages.schema';
import EthL1L2MessagesRepository from './eth.l1l2.messages.repository';

const get = jest.fn();
const getOrThrow = jest.fn();

describe('IndexerService', () => {
  let service: IndexerService;
  let ethl1l2: EthL1L2MessagesRepository;

  let replSet: MongoMemoryReplSet;
  let mongoConnection: Connection;
  let anvil: Anvil;
  let rpcUrl: string;
  let provider: JsonRpcProvider;
  let wallets: Wallet[];

  let portal: FuelMessagePortal;

  let DA_DEPLOY_HEIGHT: number;

  beforeAll(async () => {
    ({ anvil, rpcUrl } = await setupAnvil());

    provider = new JsonRpcProvider(rpcUrl);
    wallets = ethTestWallets({ provider });

    portal = await new FuelMessagePortal__factory(wallets[0])
      .deploy()
      .then((deployment) => deployment.waitForDeployment());

    const tx = await portal.deploymentTransaction()?.wait();
    DA_DEPLOY_HEIGHT = tx?.blockNumber as any;
  });

  afterAll(async () => {
    await anvil.stop();
  });

  beforeEach(async () => {
    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1 }, // Single-node replica set
    });
    const uri = replSet.getUri();
    mongoConnection = (await connect(uri)).connection;

    // Ensure collections are created before any transaction
    await mongoConnection.db?.createCollection(EthL1L2Messages.name);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: EthL1L2Messages.name, schema: EthL1L2MessagesSchema },
        ]),
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvVars: true,
          ignoreEnvFile: true,
          load: [],
        }),
      ],
      providers: [
        FuelService,
        EthService,
        IndexerService,
        EthL1L2MessagesRepository,
        {
          provide: ConfigService,
          useValue: {
            get,
            getOrThrow,
          },
        },
      ],
    }).compile();

    service = module.get<IndexerService>(IndexerService);
    ethl1l2 = module.get<EthL1L2MessagesRepository>(EthL1L2MessagesRepository);
  });

  afterEach(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await replSet.stop();
  });

  it('instantiates the service', async () => {
    expect(service).toBeDefined();
  });

  describe('indexL1toL2Messages()', () => {
    describe('get messages', () => {
      it('fetches the same information using envio and RPC', async () => {
        // These values come from sepolia 's deployment
        const envs = (key: string) => {
          const values = {
            // TODO: maybe we should move this to an e2e test...
            ETH_RPC_URL: 'https://gateway.tenderly.co/public/sepolia',
            ETH_PORTAL_ADDRESS: '0x01855B78C1f8868DE70e84507ec735983bf262dA',
            ENVIO_URL: 'https://sepolia.hypersync.xyz',
            ENVIO_API_KEY: 'ENVIO_API_KEY',
          };

          return values[key];
        };

        get.mockImplementation(envs);
        getOrThrow.mockImplementation(envs);

        // There is a deposit in this block:
        // https://sepolia.etherscan.io/tx/0x911a19a854d5412bb6bc0120a823e60353b11704231e71e160bc30c929593b70
        const from = 6595735;
        const to = 6595735;

        const envio_events = await service.getL1toL2MessagesWithEnvio(from, to);
        const rpc_events = await service.getL1toL2MessagesWithRpc(from, to);

        envio_events.forEach((envio_event, index) => {
          const rpc_event = rpc_events[index];

          expect(envio_event.sender).toBe(rpc_event.sender);
          expect(envio_event.recipient).toBe(rpc_event.recipient);
          expect(envio_event.nonce).toBe(rpc_event.nonce);
          expect(envio_event.amount).toBe(rpc_event.amount);
          expect(envio_event.data).toBe(rpc_event.data);
        });
      });
    });

    describe('index messages', () => {
      beforeAll(async () => {
        // These values come from sepolia 's deployment

        const ETH_PORTAL_ADDRESS = await portal.getAddress();
        const envs = (key: string) => {
          const values = {
            // TODO: maybe we should move this to an e2e test...
            ETH_RPC_URL: rpcUrl,
            ETH_PORTAL_ADDRESS,
            DA_DEPLOY_HEIGHT,
          };

          return values[key];
        };

        get.mockImplementation(envs);
        getOrThrow.mockImplementation(envs);
      });

      it('retrieves portal messages and stores them in the database', async () => {
        const receipts: ContractTransactionReceipt[] = (await Promise.all(
          wallets.map(async (wallet) => {
            return portal
              .connect(wallet)
              .sendMessageMock(zeroPadValue(wallet.address, 32), '0x')
              .then((tx) => tx.wait());
          }),
        )) as any;

        await forwardETHChain(rpcUrl, 128); // 128 blocks: enough to move the last finalized block

        const newEntries = await service.indexL1toL2Messages();
        expect(newEntries).toHaveLength(receipts.length);

        newEntries.forEach((entry, index) => {
          expect(entry.blockNumber).toBe(receipts[index].blockNumber);
          expect(entry.sender).toBe(zeroPadValue(receipts[index].from, 32));
          expect(entry.recipient).toBe(zeroPadValue(receipts[index].from, 32));
          expect(entry.data).toBe('0x');
        });

        const entry = await ethl1l2.findOne(newEntries[0].nonce);
        expect(entry).not.toBeNull();
      });

      it('can continue from the last indexed block', async () => {
        await service.indexL1toL2Messages(); // reindex current blockchain messages

        const receipts: ContractTransactionReceipt[] = (await Promise.all(
          wallets.map(async (wallet) => {
            return portal
              .connect(wallet)
              .sendMessageMock(zeroPadValue(wallet.address, 32), '0x')
              .then((tx) => tx.wait());
          }),
        )) as any;

        await forwardETHChain(rpcUrl, 128); // 128 blocks: enough to move the last finalized block

        const lastIndexedBlock = (await ethl1l2.findLastIndexedBlock())!;

        const newEntries = await service.indexL1toL2Messages();
        expect(newEntries).toHaveLength(receipts.length);

        newEntries.forEach((entry, index) => {
          expect(entry.blockNumber).toBe(receipts[index].blockNumber);
          expect(entry.blockNumber).toBeGreaterThan(lastIndexedBlock);
          expect(entry.sender).toBe(zeroPadValue(receipts[index].from, 32));
          expect(entry.recipient).toBe(zeroPadValue(receipts[index].from, 32));
          expect(entry.data).toBe('0x');
        });
      });

      it('throws if the database has somehow got ahead of Ethereum', async () => {
        const blockNumber = await provider.getBlockNumber();
        await ethl1l2.create({
          blockNumber: blockNumber + 1,
          sender: 'sender',
          recipient: 'recipient',
          nonce: 'nonce',
          amount: 'amount',
          data: 'data',
        });

        await expect(() => service.indexL1toL2Messages()).rejects.toThrow(
          ERROR_DB_CORRUPTION,
        );
      });
    });
  });
});
