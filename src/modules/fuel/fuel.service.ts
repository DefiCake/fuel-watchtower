import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Block as FuelBlock, InputType, Provider } from 'fuels';
@Injectable()
export class FuelService {
  constructor(private readonly configService: ConfigService) {}

  public async getClient() {
    const url = this.configService.getOrThrow('FUEL_GRAPHQL');

    const provider = await Provider.create(url);

    return provider;
  }

  public async getLastBlock() {
    const provider = await this.getClient();

    const {
      chain: { latestBlock, baseChainHeight },
    } = await provider.fetchChainAndNodeInfo();

    return {
      ...this.numberifyBlock(latestBlock),
      ethBlockSync: Number(baseChainHeight.toString()),
    };
  }

  public async getBlock(n: number) {
    const provider = await this.getClient();

    const block = await provider.getBlock(n);

    if (!block) {
      throw new Error('FuelService.getBlock(): could not fetch block');
    }

    return this.numberifyBlock(block);
  }

  /**
   * @description gets block in a range, end inclusive
   */
  public async getBlocksWithTxs(from: number, to: number) {
    if (from > to) {
      throw new Error(ERROR_BAD_RANGE);
    }

    const provider = await this.getClient();

    const range: number[] = [];
    while (from <= to) {
      range.push(from);
      from++;
    }

    const blockResponses = await Promise.allSettled(
      range.map((n) => provider.getBlockWithTransactions(n)),
    );

    const blocks = blockResponses.map((response, index) => {
      if (response.status === 'rejected') {
        throw new Error(ERROR_FAILED_BLOCK(range[index], response.reason));
      }

      if (response.value === null) {
        throw new Error(ERROR_NULL_BLOCK(range[index]));
      }

      return response.value;
    });

    return blocks;
  }

  numberifyBlock(block: Omit<FuelBlock, 'transactionIds'>) {
    return {
      ...block,
      time: Number(block.time),
      height: Number(block.height.toString()),
    };
  }
}

export const ERROR_BAD_RANGE = 'FuelService.getBlocksWithTxs(): bad range';
export const ERROR_NULL_BLOCK = (n: number) =>
  'FuelService.getBlockWithTxs():' + `Block number ${n} is null`;
export const ERROR_FAILED_BLOCK = (n: number, reason: any) =>
  'FuelService.getBlockWithTxs():' +
  `Block number ${n} failed with reason: ${reason}`;
