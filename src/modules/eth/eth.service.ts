import { isEthBlock } from '@/utils';
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

  public async getCurrentFinalizedBlock() {
    const url = this.configService.getOrThrow('ETH_RPC_URL');

    const provider = new JsonRpcProvider(url);

    const block = await provider.getBlock('finalized');

    if (!isEthBlock(block)) {
      throw new Error(
        'EthService.isEthBlock(): Could not fetch last finalized block',
      );
    }

    return block;
  }
}
