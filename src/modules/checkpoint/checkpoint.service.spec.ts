import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, connect } from 'mongoose';
import { Checkpoint, CheckpointSchema } from './schemas/checkpoints.schema';
import CheckpointRepository from './checkpoint.repository';
import { CheckpointService } from './checkpoint.service';
import { launchTestNode, LaunchTestNodeReturn } from 'fuels/test-utils';
import { FuelService } from '../fuel/fuel.service';
import { ConfigModule } from '@nestjs/config';
import { EthService } from '../eth/eth.service';
import { Anvil, createAnvil, CreateAnvilOptions } from '@viem/anvil';
import { forwardETHChain } from 'test/utils';

describe('CheckpointService', () => {
  let anvil: Anvil;
  let rpcUrl: string;

  let service: CheckpointService;
  let fuel: LaunchTestNodeReturn<any>;

  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;

  beforeAll(async () => {
    const port = 49152 + Math.floor(5000 * Math.random());
    anvil = createAnvil({ port });

    rpcUrl = `http://localhost:${anvil.port}`;
    await anvil.start();

    fuel = await launchTestNode({
      nodeOptions: {
        args: [
          '--enable-relayer',
          '--relayer',
          `${rpcUrl}`,
          '--relayer-v2-listening-contracts',
          '0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07',
          '--relayer-da-deploy-height',
          '0',
          '--poa-instant',
          'false',
          '--poa-interval-period',
          '1sec',
          '--min-gas-price',
          '0',
        ],
      },
    });
  });

  afterAll(async () => {
    fuel.cleanup();
    await anvil.stop();
  });

  beforeEach(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: Checkpoint.name, schema: CheckpointSchema },
        ]),
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvVars: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              DA_DEPLOY_HEIGHT: 0,
              ETH_RPC_URL: rpcUrl,
              FUEL_GRAPHQL: fuel.provider.url,
            }),
          ],
        }),
      ],
      providers: [
        CheckpointRepository,
        FuelService,
        CheckpointService,
        EthService,
      ],
    }).compile();

    service = module.get<CheckpointService>(CheckpointService);
  });

  afterEach(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongod.stop({ doCleanup: true });
  });

  it('instantiates the service', async () => {
    expect(service).toBeDefined();
  });

  describe('getLastCheckpoint()', () => {
    describe('when uninitialized', () => {
      it('initializes to a 0 state', async () => {
        const checkpoint = await service.getLastCheckpoint();

        expect(checkpoint.eth_block.number).toBe(0);
        expect(checkpoint.fuel_block.height).toBe(0);
      });
    });

    describe('when initialized()', () => {
      it('returns the last checkpoint', async () => {
        {
          const createdCheckpoint = await service.createCheckpoint();
          let lastCheckpoint = await service.getLastCheckpoint();

          expect(createdCheckpoint.eth_block.hash).toBe(
            lastCheckpoint.eth_block.hash,
          );
          expect(createdCheckpoint.fuel_block.id).toBe(
            lastCheckpoint.fuel_block.id,
          );
        }

        await forwardETHChain(rpcUrl, 128); // 128 blocks: enough to move the last finalized block

        {
          const createdCheckpoint = await service.createCheckpoint();
          let lastCheckpoint = await service.getLastCheckpoint();

          expect(createdCheckpoint.eth_block.hash).toBe(
            lastCheckpoint.eth_block.hash,
          );
          expect(createdCheckpoint.fuel_block.id).toBe(
            lastCheckpoint.fuel_block.id,
          );
        }
      });
    });
  });
});
