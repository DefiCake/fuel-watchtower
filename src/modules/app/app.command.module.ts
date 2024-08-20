import { Module } from '@nestjs/common';

import { WatchtowerCommand } from '@/commands/watchtower.command';
import { baseImports, baseControllers } from './app.base.module';

const providers = [WatchtowerCommand];

@Module({
  providers,
  imports: [...baseImports],
  controllers: [...baseControllers],
})
export class AppModule {}
