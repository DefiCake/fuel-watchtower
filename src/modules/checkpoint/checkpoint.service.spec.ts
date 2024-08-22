import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, connect } from 'mongoose';
import { Checkpoint, CheckpointSchema } from './schemas/checkpoints.schema';
import CheckpointRepository from './checkpoint.repository';
import { CheckpointService } from './checkpoint.service';
import { launchTestNode, LaunchTestNodeReturn } from 'fuels/test-utils';
import { FuelService } from '../fuel/fuel.service';
import { ConfigModule } from '@nestjs/config';
import { EthService } from '../eth/eth.service';
import { Anvil, createAnvil } from '@viem/anvil';
import { JsonRpcProvider } from 'ethers';

describe('CheckpointService', () => {
  let anvil: Anvil;
  let rpcUrl: string;

  beforeAll(async () => {
    anvil = createAnvil({ port: 49152 + Math.floor(5000 * Math.random()) });
    rpcUrl = `http://localhost:${anvil.port}`;
    await anvil.start();
  });

  afterAll(async () => {
    await anvil.stop();
  });

  let service: CheckpointService;
  let fuel: LaunchTestNodeReturn<any>;

  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;

  beforeAll(async () => {
    anvil = createAnvil({ port: 49152 + Math.floor(5000 * Math.random()) });
    await anvil.start();

    // cargo run --bin fuel-core -- \
    //     --ip 0.0.0.0 \
    //     --port 4000 \
    //     --db-type in-memory \
    //     --utxo-validation \
    //     --vm-backtrace \
    //     --enable-relayer \
    //     --relayer http://127.0.0.1:8545 \
    //     --relayer-v2-listening-contracts 0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07 \
    //     --relayer-da-deploy-height 0 \
    //     --poa-interval-period 1sec \
    //     --debug \
    //     --min-gas-price 0

    fuel = await launchTestNode({
      nodeOptions: {
        args: [`--enable-relayer`, `--relayer`, rpcUrl],
      },
    });
  });

  afterAll(async () => {
    fuel.cleanup();
    await anvil.stop();
  });

  beforeEach(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: Checkpoint.name, schema: CheckpointSchema },
        ]),
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvVars: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              DA_DEPLOY_HEIGHT: 0,
              ETH_RPC_URL: rpcUrl,
              FUEL_GRAPHQL: fuel.provider.url,
            }),
          ],
        }),
      ],
      providers: [
        CheckpointRepository,
        FuelService,
        CheckpointService,
        EthService,
      ],
    }).compile();

    service = module.get<CheckpointService>(CheckpointService);
  });

  afterEach(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongod.stop({ doCleanup: true });
  });

  it('instantiates the service', async () => {
    expect(service).toBeDefined();
  });

  describe('getLastCheckpoint()', () => {
    describe('when uninitialized', () => {
      it('initializes to a 0 state', async () => {
        const checkpoint = await service.getLastCheckpoint();

        expect(checkpoint.eth_block.number).toBe(0);
        expect(checkpoint.fuel_block.height).toBe(0);
      });
    });
  });
});
