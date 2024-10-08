import 'hardhat-jest';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-verify';
import '@nomicfoundation/hardhat-network-helpers';
import '@typechain/hardhat';
import 'hardhat-deploy';
import './scripts/hardhat';
import { NetworkUserConfig, SolcUserConfig } from 'hardhat/types';

const DEFAULT_MNEMONIC =
  'test test test test test test test test test test test junk';

const SOL_CONFIG_V8: SolcUserConfig = {
  version: '0.8.26',
};

const config: HardhatUserConfig = {
  solidity: { compilers: [SOL_CONFIG_V8] },
  networks: {
    hardhat: {
      mining: {
        auto: true,
        interval: process.env.BLOCK_TIME_MS
          ? Number(process.env.BLOCK_TIME_MS)
          : undefined,
      },
    },
    localhost: {
      url: process.env.RPC_URL || 'http://127.0.0.1:8545',
    },
  },
  paths: {
    deployments: 'networks',
    sources: 'contracts/solidity',
    tests: 'test/unit',
  },
  typechain: {
    outDir: 'src/types/solidity',
  },
};

export default config;
