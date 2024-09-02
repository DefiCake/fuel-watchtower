import { Wallet, parseEther, parseUnits } from 'ethers';
import type { Signer } from 'ethers';
import { getRandomB256, isB256, isBech32, toB256 } from 'fuels';
import { task } from 'hardhat/config';
import { enterPrivateKey } from './utils';
import { randomInt } from 'crypto';

task('depositETH', 'deposits ETH to Fuel')
  .addFlag('env', 'use this flag to send transactions from env var PRIVATE_KEY')
  .addFlag('i', 'use this flag to input a private key')
  .addOptionalParam(
    'recipient',
    'fuel address that will receive the deposit',
    getRandomB256(),
  )
  .setAction(async (taskArgs, hre) => {
    let recipient: string;

    if (isB256(taskArgs.recipient)) {
      recipient = taskArgs.recipient;
    } else if (isBech32(taskArgs.recipient)) {
      recipient = toB256(taskArgs.recipient);
    } else {
      console.log(
        `--recipient ${taskArgs.recipient} is not a valid FuelVM address`,
      );
      return;
    }

    const value = parseUnits(BigInt(randomInt(1, 10)).toString(), 'gwei');
    let signer: Signer;

    if (taskArgs.i) {
      const privateKey = await enterPrivateKey();
      signer = new Wallet(privateKey, hre.ethers.provider);
    } else if (taskArgs.env) {
      signer = new Wallet(process.env.PRIVATE_KEY!, hre.ethers.provider);
    } else {
      const signers = await hre.ethers.getSigners();
      signer = signers[0];
    }

    const contract = await hre.ethers.getContractAt(
      'FuelMessagePortal',
      (await hre.deployments.get('FuelMessagePortal')).address,
      signer,
    );

    const tx = await contract.sendMessageMock(recipient, '0x', { value });

    console.log(`Transaction sent with hash=${tx.hash}`);

    const receipt = await tx.wait();
    console.log(
      `\t> Completed at hash=${receipt!.hash} block=${receipt!.blockNumber}`,
    );
  });
