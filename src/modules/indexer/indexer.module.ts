import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IndexerService } from './indexer.service';
import { FuelService } from '../fuel/fuel.service';
import { EthService } from '../eth/eth.service';

@Module({
  providers: [ConfigService, IndexerService, FuelService, EthService],
  exports: [IndexerService],
})
export default class IndexerModule {}
