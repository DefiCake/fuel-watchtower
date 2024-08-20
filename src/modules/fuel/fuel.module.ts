import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FuelService } from './fuel.service';

@Module({
  providers: [ConfigService, FuelService],
  exports: [FuelService],
})
export default class FuelModule {}
