import { FuelService } from '@/modules/fuel/fuel.service';
import { Injectable } from '@nestjs/common';
import { IndexerService } from '@/modules/indexer/indexer.service';
import { CheckpointService } from '@/modules/checkpoint/checkpoint.service';
import { UtxoService } from '@/modules/utxo/utxo.service';

import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { FuelBlockWithTransactionsType, FuelBlockWithUtxosType } from '@/types';
import { FuelBlockWithUtxos } from '../utxo/schemas/utxo.schema';

@Injectable()
export class WatchtowerService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly checkpointService: CheckpointService,
    private readonly fuelService: FuelService,
    private readonly indexerService: IndexerService,
    private readonly utxoService: UtxoService,
  ) {}

  async runChecks() {
    console.log('Watching');

    const lastCheckpoint = await this.checkpointService.getLastCheckpoint();

    const session = await this.connection.startSession();

    try {
      session.startTransaction();
      const nextCheckpoint =
        await this.checkpointService.createCheckpoint(session);

      // TODO: Handle situations where one chain has advanced but the other has not
      if (lastCheckpoint.eth_block.number >= nextCheckpoint.eth_block.number) {
        await session.abortTransaction();
        return;
      }

      const fuel_blocks = await this.fuelService.getBlocksWithTxs(
        lastCheckpoint.fuel_block.height + 1,
        nextCheckpoint.fuel_block.height,
      );

      await this.runUtxoChecks(fuel_blocks);

      await session.commitTransaction();
    } catch (e) {
      // TODO: Log error
      await session.abortTransaction();
    } finally {
      await session.endSession();
    }

    // console.log('Getting deposits');
    // await this.indexerService.getEthDeposits();
  }

  /**
   * @description
   */
  async runUtxoChecks(fuel_blocks: FuelBlockWithTransactionsType[]) {
    let utxos: FuelBlockWithUtxosType;
    let previousBlock: FuelBlockWithTransactionsType;
    let currentBlock: FuelBlockWithTransactionsType = fuel_blocks[0];

    const provider = await this.fuelService.getClient();

    for (const [index, block] of fuel_blocks.entries()) {
      if (index === 0) {
        utxos = await this.utxoService
          .getUtxos(block.height.toNumber() - 1)
          .then((_utxos) => {
            if (!_utxos) {
              throw new Error(ERROR_NO_UTXOS_FOUND(block.height.toNumber()));
            }

            return _utxos;
          });

        const fetchedPreviousBlock = await provider.getBlockWithTransactions(0);

        if (fetchedPreviousBlock === null) {
          return;
        }
        previousBlock = fetchedPreviousBlock;
      } else {
        previousBlock = currentBlock;
        currentBlock = block;
      }

      currentBlock.transactions[0].outputs;
    }
  }
}

export const ERROR_NO_UTXOS_FOUND = (n: number) =>
  `No UTXOS found for block ${n}`;
