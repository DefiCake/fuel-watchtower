import { FuelService } from '@/modules/fuel/fuel.service';
import { Injectable } from '@nestjs/common';
import { IndexerService } from '../indexer/indexer.service';
import CheckpointRepository from './checkpoint.repository';
import { ConfigService } from '@nestjs/config';
import { Checkpoint } from './schemas/checkpoints.schema';
import { CheckpointType } from '@/types';

@Injectable()
export class CheckpointService {
  constructor(
    private readonly configService: ConfigService,
    private readonly fuelService: FuelService,
    private readonly checkpointRepository: CheckpointRepository,
  ) {}

  async getLastCheckpoint(): Promise<CheckpointType> {
    const lastCheckpoint = this.checkpointRepository.getLastCheckpoint();

    if (lastCheckpoint === null) {
      // Bootstrap
      return {
        eth_block: {
          hash: '',
          number: 0,
          timestamp: 0,
        },
        fuel_block: {
          id: '',
          height: 0,
          time: 0,
          ethBlockSync: 0,
        },
      };
    }

    return lastCheckpoint;
  }
}
