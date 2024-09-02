import type { HardhatRuntimeEnvironment } from 'hardhat/types';
import type { DeployFunction } from 'hardhat-deploy/dist/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    ethers,
    deployments: { deploy },
  } = hre;
  const [deployer] = await ethers.getSigners();

  await deploy('FuelMessagePortal', { from: deployer.address, log: true });
};

func.tags = ['portal'];
func.id = 'portal';
export default func;
