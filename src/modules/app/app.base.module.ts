import FuelModule from '@/modules/fuel/fuel.module';
import { ConfigModule } from '@nestjs/config';
import WatchtowerModule from '../watchtower/watchtower.module';

export const baseImports = [
  ConfigModule.forRoot({
    isGlobal: true,
  }),
  FuelModule,
  WatchtowerModule,
];
export const baseControllers = [];
