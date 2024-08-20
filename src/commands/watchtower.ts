import { Injectable } from '@nestjs/common';

import { Command, CommandRunner } from 'nest-commander';
@Command({
  name: 'watchtower',
  description: 'Checks blockchain health',
})
@Injectable()
export class WatchtowerCommand extends CommandRunner {
  constructor() {
    super();
  }

  async run(): Promise<void> {
    console.log('Watching');
  }
}
