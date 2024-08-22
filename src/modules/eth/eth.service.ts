import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsonRpcProvider, Provider } from 'ethers';

@Injectable()
export class EthService {
  constructor(private readonly configService: ConfigService) {}

  public async getClient(): Promise<Provider> {
    const url = this.configService.getOrThrow('ETH_RPC_URL');

    const provider = new JsonRpcProvider(url);

    return provider;
  }
}
