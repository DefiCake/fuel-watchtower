import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FuelService } from '../fuel/fuel.service';
import { CheckpointService } from './checkpoint.service';
import { EthService } from '../eth/eth.service';

@Module({
  providers: [ConfigService, FuelService, EthService, CheckpointService],
  exports: [CheckpointService],
})
export default class CheckpointModule {}
