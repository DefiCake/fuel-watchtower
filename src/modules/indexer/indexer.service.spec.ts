import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { Connection, connect } from 'mongoose';
import { FuelService } from '../fuel/fuel.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EthService } from '../eth/eth.service';
import { IndexerService } from './indexer.service';

const get = jest.fn();
const getOrThrow = jest.fn();

describe('IndexerService', () => {
  let service: IndexerService;
  let config: ConfigService;

  let replSet: MongoMemoryReplSet;
  let mongoConnection: Connection;

  beforeEach(async () => {
    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1 }, // Single-node replica set
    });
    const uri = replSet.getUri();
    mongoConnection = (await connect(uri)).connection;

    // Ensure collections are created before any transaction
    // await mongoConnection.db?.createCollection('checkpoints');

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        // MongooseModule.forFeature([
        //   { name: FuelBlockWithUtxos.name, schema: FuelBlockWithUtxosSchema },
        // ]),
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
    config = module.get<ConfigService>(ConfigService);
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

    it('retrieves messages and stores them in the database', async () => {});
  });
});
