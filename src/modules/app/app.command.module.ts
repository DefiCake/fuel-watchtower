import { Module } from '@nestjs/common';

import { WatchtowerCommand } from '@/commands/watchtower.command';
import { IndexEthCommand } from '@/commands/index.eth.command';
import { baseImports, baseControllers } from './app.base.module';

const providers = [WatchtowerCommand, IndexEthCommand];

@Module({
  providers,
  imports: [...baseImports],
  controllers: [...baseControllers],
})
export class AppModule {}
