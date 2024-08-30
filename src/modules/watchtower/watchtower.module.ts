import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FuelService } from '../fuel/fuel.service';
import { WatchtowerService } from './watchtower.service';
import { IndexerService } from '../indexer/indexer.service';
import { CheckpointService } from '../checkpoint/checkpoint.service';
import { EthService } from '../eth/eth.service';
import CheckpointRepository from '../checkpoint/checkpoint.repository';
import CheckpointModule from '../checkpoint/checkpoint.module';

@Module({
  imports: [CheckpointModule],
  providers: [
    ConfigService,
    EthService,
    FuelService,
    WatchtowerService,
    IndexerService,
  ],
  exports: [WatchtowerService],
})
export default class WatchtowerModule {}
