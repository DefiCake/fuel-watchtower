import { WatchtowerService } from '@/modules/watchtower/watchtower.service';
import { Injectable } from '@nestjs/common';

import { Command, CommandRunner } from 'nest-commander';
@Command({
  name: 'watchtower',
  description: 'Checks blockchain health',
})
@Injectable()
export class WatchtowerCommand extends CommandRunner {
  constructor(private readonly service: WatchtowerService) {
    super();
  }

  async run(): Promise<void> {
    await this.service.runChecks();
  }
}
