import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, connect, Model } from 'mongoose';
import {
  ERROR_BAD_RANGE,
  ERROR_FAILED_BLOCK,
  ERROR_NULL_BLOCK,
  FuelService,
} from './fuel.service';
import { ConfigModule } from '@nestjs/config';

import { launchTestNode, LaunchTestNodeReturn } from 'fuels/test-utils';

const env_vars = {};

describe.only('FuelService', () => {
  let fuelService: FuelService;
  let fuel: LaunchTestNodeReturn<any>;

  beforeAll(async () => {
    fuel = await launchTestNode({});
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

  describe('getBlocksWithTxs', () => {
    it('fails if a bad range is given', async () => {
      await expect(() => fuelService.getBlocksWithTxs(1, 0)).rejects.toThrow(
        ERROR_BAD_RANGE,
      );
    });

    it('allows to fetch a single block', async () => {
      const blocks = await fuelService.getBlocksWithTxs(0, 0);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].height.toNumber()).toBe(0);
    });

    it('allows to fetch a range of blocks', async () => {
      const blocks = await fuelService.getBlocksWithTxs(0, 1);

      expect(blocks).toHaveLength(2);
      expect(blocks[0].height.toNumber()).toBe(0);
      expect(blocks[1].height.toNumber()).toBe(1);
    });

    it('fails when a block is null', async () => {
      const lastBlock = await fuelService.getLastBlock();

      const from = lastBlock.height + 1000;

      await expect(() =>
        fuelService.getBlocksWithTxs(from, from),
      ).rejects.toThrow(ERROR_NULL_BLOCK(from));
    });

    it('fails when a block cannot be fetched', async () => {
      const from = -1;
      const expectedErrorString =
        'FuelError: Failed to parse "U32": invalid digit found in string';

      await expect(() =>
        fuelService.getBlocksWithTxs(from, from),
      ).rejects.toThrow(ERROR_FAILED_BLOCK(from, expectedErrorString));
    });

    it('contains transactions', async () => {
      const [sender, recipient] = fuel.wallets;

      const txResponse = await sender
        .transfer(recipient.address, 1)
        .then((tx) => tx.waitForResult());

      const txHeight = await fuel.provider
        .getBlock(txResponse!.blockId!)
        .then((block) => block!.height.toNumber());
      const from = txHeight;

      const [block] = await fuelService.getBlocksWithTxs(from, from);

      expect(block.transactions).toHaveLength(2); // The sent tx + mint tx
      expect(block.transactionIds[0]).toBe(txResponse.id);
    });
  });
});
