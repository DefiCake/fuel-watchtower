import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/modules/app/app.command.module';
import { IndexerService } from '@/modules/indexer/indexer.service';
import { ConfigService } from '@nestjs/config';
import { EthService } from '@/modules/eth/eth.service';
import {
  Provider as EthProvider,
  Wallet as EthWallet,
  hexlify,
  randomBytes,
} from 'ethers';
import {
  FuelMessagePortal,
  FuelMessagePortal__factory,
} from '@/types/solidity';
import { ethTestWallets } from './utils';

/**
 * TODO:
 * In these tests, the following env must be running:
 * - Chains (eth, fuel) with deployments
 * - Activity robots (blue team & red team)
 * - Watchtower robots
 *
 * The goal is to check that notifications are triggered when
 * rogue activity is detected
 */
describe('AppController (e2e)', () => {
  let app: INestApplication;

  let config: ConfigService;
  let indexer: IndexerService;

  let eth: EthService;
  let eth_signers: EthWallet[];
  let eth_provider: EthProvider;

  let portal: FuelMessagePortal;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    indexer = module.get<IndexerService>(IndexerService);
    config = module.get<ConfigService>(ConfigService);
    eth = module.get<EthService>(EthService);
    eth_provider = await eth.getClient();
    eth_signers = ethTestWallets(eth_provider);

    const portal_address = await config.getOrThrow('ETH_PORTAL_ADDRESS');
    portal = FuelMessagePortal__factory.connect(portal_address, eth_provider);
  });

  describe('eth indexing', () => {
    it('reacts to a spoofed deposit', async () => {
      await portal
        .sendMessageMock(hexlify(randomBytes(32)), '0x')
        .then((tx) => tx.wait());
    });

    it('reacts to a stolen deposit');
  });
});
