import { Module } from '@nestjs/common';

import { WatchtowerCommand } from '@commands/watchtower';
import { baseImports, baseControllers } from './app.base.module';

const providers = [WatchtowerCommand];

@Module({
  providers,
  imports: [...baseImports],
  controllers: [...baseControllers],
})
export class AppModule {}
