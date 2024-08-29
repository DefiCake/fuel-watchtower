import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { Connection, connect } from 'mongoose';
import { FuelService } from '../fuel/fuel.service';
import { ConfigModule } from '@nestjs/config';
import { EthService } from '../eth/eth.service';
import { UtxoService } from './utxo.service';
import {
  FuelBlockWithUtxos,
  FuelBlockWithUtxosSchema,
} from './schemas/utxo.schema';
import UtxoRepository from './utxo.repository';
import { FuelBlockWithUtxosType } from '@/types';

describe('UtxoService', () => {
  let service: UtxoService;

  let replSet: MongoMemoryReplSet;
  let mongoConnection: Connection;

  beforeEach(async () => {
    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1 }, // Single-node replica set
    });
    const uri = replSet.getUri();
    mongoConnection = (await connect(uri)).connection;

    // Ensure collections are created before any transaction
    await mongoConnection.db?.createCollection('checkpoints');

    // Explicitly create the collection and ensure indexes are created before transactions
    const utxosModel = mongoConnection.model(
      'FuelBlockWithUtxos',
      FuelBlockWithUtxosSchema,
    );
    await utxosModel.createCollection(); // Ensure collection is created
    await utxosModel.ensureIndexes(); // Ensure indexes are created

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: FuelBlockWithUtxos.name, schema: FuelBlockWithUtxosSchema },
        ]),
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvVars: true,
          ignoreEnvFile: true,
          load: [],
        }),
      ],
      providers: [
        UtxoRepository,
        FuelService,
        EthService,
        {
          provide: UtxoService,
          useFactory: (repository, connection) => {
            return new UtxoService(repository, connection);
          },
          inject: [UtxoRepository, getConnectionToken()],
        },
      ],
    }).compile();

    service = module.get<UtxoService>(UtxoService);
  });

  afterEach(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await replSet.stop();
  });

  it('instantiates the service', async () => {
    expect(service).toBeDefined();
  });

  describe('getUtxos()', () => {
    it('returns an empty set if height === 0', async () => {
      const result = await service.getUtxos(0);

      expect(result?.height).toBe(0);
      expect(result?.utxos).toHaveLength(0);
    });
  });

  describe('insertUtxos', () => {
    it('inserts an UTXO block', async () => {
      const utxoBlock: FuelBlockWithUtxosType = {
        height: 1,
        utxos: ['1', '2', '3'],
      };

      await service.insertUtxos(utxoBlock);

      const inserted = await service.getUtxos(utxoBlock.height);

      expect(inserted?.height).toBe(utxoBlock.height);
      expect(inserted?.utxos).toHaveLength(utxoBlock.utxos.length);

      inserted?.utxos.forEach((utxo, index) => {
        expect(utxo).toBe(utxoBlock.utxos[index]);
      });
    });

    describe('with session', () => {
      it('defers creation until the session is committed', async () => {
        const session = await service.startSession();
        session.startTransaction();

        const utxoBlock: FuelBlockWithUtxosType = {
          height: 1,
          utxos: ['1', '2', '3'],
        };

        await service.insertUtxos(utxoBlock, session);

        {
          const result = await service.getUtxos(1);
          expect(result).toBeNull();
        }

        await session.commitTransaction();
        {
          const result = await service.getUtxos(1);
          expect(result).not.toBeNull();
        }

        await session.endSession();
      });
    });
  });
});
