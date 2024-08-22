import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, connect } from 'mongoose';
import CheckpointRepository from './checkpoint.repository';
import { Checkpoint, CheckpointSchema } from './schemas/checkpoints.schema';
import { CheckpointType, EthBlockType, FuelBlockType } from '@/types';

const ETH_BLOCK_MOCK_1: EthBlockType = {
  number: 12345,
  hash: '0x1234567890abcdef',
  timestamp: 1234567890,
};

const ETH_BLOCK_MOCK_2: EthBlockType = {
  number: 12346,
  hash: '0xabcdef1234567890',
  timestamp: 1234567891,
};

const FUEL_BLOCK_MOCK_1: FuelBlockType = {
  height: 0,
  time: 0,
  ethBlockSync: 12345,
  id: '0xfuel_block_id1',
};

const FUEL_BLOCK_MOCK_2: FuelBlockType = {
  height: 1,
  time: 1,
  ethBlockSync: 12346,
  id: '0xfuel_block_id2',
};

describe('CheckpointRepository', () => {
  let checkpointRepository: CheckpointRepository;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;

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
      ],
      providers: [CheckpointRepository],
    }).compile();

    checkpointRepository =
      module.get<CheckpointRepository>(CheckpointRepository);
  });

  afterEach(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongod.stop({ doCleanup: true });
  });

  describe('create', () => {
    it('should create a new checkpoint', async () => {
      const checkpointData: CheckpointType = {
        eth_block: ETH_BLOCK_MOCK_1,
        fuel_block: FUEL_BLOCK_MOCK_1,
      };

      const createdCheckpoint =
        await checkpointRepository.create(checkpointData);

      expect(createdCheckpoint).toBeDefined();
      expect(createdCheckpoint.eth_block.number).toBe(
        checkpointData.eth_block.number,
      );
      expect(createdCheckpoint.eth_block.hash).toBe(
        checkpointData.eth_block.hash,
      );
      expect(createdCheckpoint.eth_block.timestamp).toBe(
        checkpointData.eth_block.timestamp,
      );
      expect(createdCheckpoint.createdAt).toBeDefined();
    });

    it('weeds out unwanted fields', async () => {
      const checkpointData = {
        eth_block: {
          ...ETH_BLOCK_MOCK_1,
          madeUpField: 'madeUpField',
        },
        fuel_block: FUEL_BLOCK_MOCK_1,
      };

      const createdCheckpoint =
        await checkpointRepository.create(checkpointData);

      expect(createdCheckpoint).toBeDefined();
      expect((createdCheckpoint.eth_block as any).madeUpField).toBeUndefined();
    });
  });

  describe('createMultiple', () => {
    it('should create multiple checkpoints', async () => {
      const checkpointsData: CheckpointType[] = [
        {
          eth_block: ETH_BLOCK_MOCK_1,
          fuel_block: FUEL_BLOCK_MOCK_1,
        },
        {
          eth_block: ETH_BLOCK_MOCK_2,
          fuel_block: FUEL_BLOCK_MOCK_2,
        },
      ];

      const insertedIds =
        await checkpointRepository.createMultiple(checkpointsData);

      expect(insertedIds).toBeDefined();
      expect(Object.keys(insertedIds).length).toBe(2);
    });
  });

  describe('getLastCheckpoint', () => {
    it('should return the last checkpoint', async () => {
      const checkpointsData: CheckpointType[] = [
        {
          eth_block: ETH_BLOCK_MOCK_1,
          fuel_block: FUEL_BLOCK_MOCK_1,
          createdAt: 0,
        },
        {
          eth_block: ETH_BLOCK_MOCK_2,
          fuel_block: FUEL_BLOCK_MOCK_2,
          createdAt: 1,
        },
      ];

      await checkpointRepository.createMultiple(checkpointsData);

      const lastCheckpoint = await checkpointRepository.getLastCheckpoint();

      expect(lastCheckpoint).toBeDefined();
      expect(lastCheckpoint?.eth_block.number).toBe(12346);
    });

    it('should return null if no checkpoints exist', async () => {
      const lastCheckpoint = await checkpointRepository.getLastCheckpoint();

      expect(lastCheckpoint).toBeNull();
    });
  });
});
