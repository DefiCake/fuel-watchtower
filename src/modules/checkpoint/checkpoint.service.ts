import { Injectable } from '@nestjs/common';
import CheckpointRepository from './checkpoint.repository';
import { ConfigService } from '@nestjs/config';
import { CheckpointType } from '@/types';
import { FuelService } from '@/modules/fuel/fuel.service';
import { EthService } from '@/modules/eth/eth.service';

@Injectable()
export class CheckpointService {
  constructor(
    private readonly configService: ConfigService,
    private readonly fuelService: FuelService,
    private readonly ethService: EthService,
    private readonly checkpointRepository: CheckpointRepository,
  ) {}

  async getLastCheckpoint(): Promise<CheckpointType> {
    const lastCheckpoint = await this.checkpointRepository.getLastCheckpoint();

    if (lastCheckpoint === null) {
      const eth_provider = await this.ethService.getClient();
      const ethBlockSync = Number(
        this.configService.getOrThrow<string>('DA_DEPLOY_HEIGHT'),
      );

      const eth_block = await eth_provider.getBlock(ethBlockSync);

      const fuel_block = {
        ...(await this.fuelService.getBlock(0)),
        ethBlockSync,
      };

      // Bootstrap
      return {
        eth_block,
        fuel_block,
      };
    }

    return lastCheckpoint;
  }
}
