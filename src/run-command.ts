import { AppModule } from '@modules/app/app.command.module';
import { CommandFactory } from 'nest-commander';

async function bootstrap() {
  await CommandFactory.run(AppModule, ['error', 'warn']).catch((e) => {
    console.log('error');
    console.error(e);
  });
}
bootstrap();
