import { IndexerService } from '@/modules/indexer/indexer.service';
import { WatchtowerService } from '@/modules/watchtower/watchtower.service';
import { Injectable } from '@nestjs/common';

import { Command, CommandRunner } from 'nest-commander';
@Command({
  name: 'index_eth',
  description: 'Queries and indexes FuelMessagePortal.MessageSent events',
})
@Injectable()
export class IndexEthCommand extends CommandRunner {
  constructor(private readonly service: IndexerService) {
    super();
  }

  async run(): Promise<void> {
    await this.service.indexL1toL2Messages();
  }
}
