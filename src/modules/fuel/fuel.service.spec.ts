import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, connect, Model } from 'mongoose';
import { FuelService } from './fuel.service';
import { ConfigModule } from '@nestjs/config';

import { launchTestNode, LaunchTestNodeReturn } from 'fuels/test-utils';

const env_vars = {};

describe.only('FuelService', () => {
  let fuelService: FuelService;
  let fuel: LaunchTestNodeReturn<any>;

  beforeAll(async () => {
    fuel = await launchTestNode();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvVars: true,
          ignoreEnvFile: true,
          load: [() => ({ ...env_vars, FUEL_GRAPHQL: fuel.provider.url })],
        }),
      ],
      providers: [FuelService],
    }).compile();

    fuelService = module.get<FuelService>(FuelService);
  });

  afterAll(async () => {
    fuel.cleanup();
  });

  describe('getClient()', () => {
    it('works', async () => {
      const client = await fuelService.getClient();
      expect(client.url).toBe(fuel.provider.url);
    });
  });

  describe('getLastBlock()', () => {
    it('gets the last block', async () => {
      const block = await fuelService.getLastBlock();
      expect(block).toBeDefined();

      await fuel.provider.produceBlocks(1);

      const nextBlock = await fuelService.getLastBlock();
      expect(nextBlock).toBeDefined();

      expect(nextBlock.height).toBe(block.height + 1);
    });
  });

  describe('getBlock', () => {
    it('gets a block', async () => {
      const block = await fuelService.getBlock(0);
      expect(block).toBeDefined();
      expect(block.height).toBe(0);
    });
  });
});
