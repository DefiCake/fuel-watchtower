import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FuelService } from '../fuel/fuel.service';
import { CheckpointService } from './checkpoint.service';

@Module({
  providers: [ConfigService, FuelService, CheckpointService],
  exports: [CheckpointService],
})
export default class CheckpointModule {}
