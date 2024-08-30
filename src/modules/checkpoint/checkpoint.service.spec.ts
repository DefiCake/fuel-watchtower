import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { Connection, connect } from 'mongoose';
import { Checkpoint, CheckpointSchema } from './schemas/checkpoints.schema';
import CheckpointRepository from './checkpoint.repository';
import { CheckpointService } from './checkpoint.service';
import { launchTestNode, LaunchTestNodeReturn } from 'fuels/test-utils';
import { FuelService } from '../fuel/fuel.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EthService } from '../eth/eth.service';
import { Anvil } from '@viem/anvil';
import { forwardETHChain, setupAnvil, waitForNewFuelBlock } from 'test/utils';

describe('CheckpointService', () => {
  let anvil: Anvil;
  let rpcUrl: string;

  let service: CheckpointService;
  let fuel: LaunchTestNodeReturn<any>;

  let replSet: MongoMemoryReplSet;
  let mongoConnection: Connection;

  beforeAll(async () => {
    ({ anvil, rpcUrl } = await setupAnvil());

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
    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1 }, // Single-node replica set
    });
    const uri = replSet.getUri();
    mongoConnection = (await connect(uri)).connection;

    // Ensure collections are created before any transaction
    await mongoConnection.db?.createCollection('checkpoints');

    // Explicitly create the collection and ensure indexes are created before transactions
    const checkpointModel = mongoConnection.model(
      'Checkpoint',
      CheckpointSchema,
    );
    await checkpointModel.createCollection(); // Ensure collection is created
    await checkpointModel.ensureIndexes(); // Ensure indexes are created

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
        EthService,
        {
          provide: CheckpointService,
          useFactory: (config, fuel, eth, repository, connection) => {
            return new CheckpointService(
              config,
              fuel,
              eth,
              repository,
              connection,
            );
          },
          inject: [
            ConfigService,
            FuelService,
            EthService,
            CheckpointRepository,
            getConnectionToken(),
          ],
        },
      ],
    }).compile();

    service = module.get<CheckpointService>(CheckpointService);
  });

  afterEach(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await replSet.stop();
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
        await waitForNewFuelBlock(fuel.provider);

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

  describe('createCheckpoint', () => {
    describe('with session', () => {
      it('defers creation until the session is committed', async () => {
        const session = await service.startSession();
        session.startTransaction();

        const createdCheckpoint = await service.createCheckpoint(session);

        {
          const checkpoint = await service.getLastCheckpoint();
          expect(checkpoint.eth_block.number).toBe(0);
          expect(checkpoint.fuel_block.height).toBe(0);
        }

        await session.commitTransaction();
        {
          const checkpoint = await service.getLastCheckpoint();
          expect(checkpoint.eth_block.hash).toBe(
            createdCheckpoint.eth_block.hash,
          );
        }

        await session.endSession();
      });
    });
  });
});
