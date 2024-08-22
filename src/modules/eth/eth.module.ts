import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EthService } from './eth.service';

@Module({
  providers: [ConfigService, EthService],
  exports: [EthService],
})
export default class EthModule {}
