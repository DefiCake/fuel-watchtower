import { Injectable } from '@nestjs/common';
import CheckpointRepository from './checkpoint.repository';
import { ConfigService } from '@nestjs/config';
import { CheckpointType } from '@/types';
import { FuelService } from '@/modules/fuel/fuel.service';
import { EthService } from '@/modules/eth/eth.service';
import { ClientSession, Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { isEthBlock } from '@/utils';

@Injectable()
export class CheckpointService {
  constructor(
    private readonly configService: ConfigService,
    private readonly fuelService: FuelService,
    private readonly ethService: EthService,
    private readonly checkpointRepository: CheckpointRepository,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async getLastCheckpoint(): Promise<CheckpointType> {
    const lastCheckpoint = await this.checkpointRepository.getLastCheckpoint();

    if (lastCheckpoint === null) {
      const eth_provider = await this.ethService.getClient();
      const ethBlockSync = Number(
        this.configService.getOrThrow<string>('DA_DEPLOY_HEIGHT'),
      );

      const eth_block = await eth_provider.getBlock(ethBlockSync);

      if (!isEthBlock(eth_block)) {
        throw new Error(
          'getLastCheckpoint(): could not fetch DA_DEPLOY_HEIGHT block',
        );
      }

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

  async createCheckpoint(session?: ClientSession) {
    const eth_provider = await this.ethService.getClient();

    const eth_block = await eth_provider.getBlock('finalized');

    if (!isEthBlock(eth_block)) {
      throw new Error('Could not get a finalized ETH block');
    }

    const fuel_block = await this.fuelService.getLastBlock();

    const checkpoint = await this.checkpointRepository.create(
      {
        eth_block,
        fuel_block,
      },
      session,
    );

    return checkpoint;
  }

  async startSession(): Promise<ClientSession> {
    const session = await this.connection.startSession();
    return session;
  }
}
