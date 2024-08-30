import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IndexerService } from './indexer.service';
import { FuelService } from '../fuel/fuel.service';
import { EthService } from '../eth/eth.service';
import EthL1L2MessagesRepository from './eth.l1l2.messages.repository';

@Module({
  providers: [
    ConfigService,
    IndexerService,
    FuelService,
    EthService,
    EthL1L2MessagesRepository,
  ],
  exports: [IndexerService],
})
export default class IndexerModule {}
