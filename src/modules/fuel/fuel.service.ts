import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Block as FuelBlock, Provider } from 'fuels';
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

  numberifyBlock(block: Omit<FuelBlock, 'transactionIds'>) {
    return {
      ...block,
      time: Number(block.time),
      height: Number(block.height.toString()),
    };
  }
}
