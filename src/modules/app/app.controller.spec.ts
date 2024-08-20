import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as hre from 'hardhat';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('hardhat', () => {
    it('instantiate hardhat', async () => {
      expect(hre).toBeDefined();
    });

    it('returns a block', async () => {
      const block = await hre.ethers.provider.getBlock('latest');
      expect(block).toBeDefined();
    });
  });
});
