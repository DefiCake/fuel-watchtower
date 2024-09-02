import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WatchtowerService } from './watchtower.service';
import CheckpointModule from '../checkpoint/checkpoint.module';
import IndexerModule from '../indexer/indexer.module';
import UtxoModule from '../utxo/utxo.module';
import FuelModule from '../fuel/fuel.module';

@Module({
  imports: [
    ConfigModule,
    CheckpointModule,
    FuelModule,
    IndexerModule,
    UtxoModule,
  ],
  providers: [WatchtowerService],
  exports: [WatchtowerService],
})
export default class WatchtowerModule {}
