import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { IndexerService } from './indexer.service';
import { FuelService } from '../fuel/fuel.service';
import { EthService } from '../eth/eth.service';
import EthL1L2MessagesRepository from './eth.l1l2.messages.repository';
import {
  EthL1L2Messages,
  EthL1L2MessagesSchema,
} from './schemas/eth.l1l2.messages.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: EthL1L2Messages.name,
        schema: EthL1L2MessagesSchema,
      },
    ]),
  ],
  providers: [
    ConfigService,
    IndexerService,
    FuelService,
    EthService,
    EthL1L2MessagesRepository,
  ],
  exports: [IndexerService, EthL1L2MessagesRepository],
})
export default class IndexerModule {}
