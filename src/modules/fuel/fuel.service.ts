import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Provider } from 'fuels';
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

    const { chain } = await provider.fetchChainAndNodeInfo();

    return {
      ...chain.latestBlock,
      ethBlockSync: BigInt(chain.baseChainHeight.toString()),
    };
  }
}
