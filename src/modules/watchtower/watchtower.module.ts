import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FuelService } from '../fuel/fuel.service';
import { WatchtowerService } from './watchtower.service';

@Module({
  providers: [ConfigService, FuelService, WatchtowerService],
  exports: [WatchtowerService],
})
export default class WatchtowerModule {}
