import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import FuelModule from '@/modules/fuel/fuel.module';
import WatchtowerModule from '../watchtower/watchtower.module';
import IndexerModule from '../indexer/indexer.module';
import CheckpointModule from '../checkpoint/checkpoint.module';
import EthModule from '../eth/eth.module';

export const baseImports = [
  ConfigModule.forRoot({
    isGlobal: true,
  }),
  MongooseModule.forRoot(process.env.MONGODB_URL as string),
  FuelModule,
  EthModule,
  WatchtowerModule,
  IndexerModule,
  CheckpointModule,
];
export const baseControllers = [];
