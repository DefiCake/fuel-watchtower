import { ConfigModule } from '@nestjs/config';

export const baseImports = [
  ConfigModule.forRoot({
    isGlobal: true,
  }),
];
export const baseControllers = [];
