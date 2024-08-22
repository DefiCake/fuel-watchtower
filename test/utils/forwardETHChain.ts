import { NumberLike } from '@nomicfoundation/hardhat-network-helpers/dist/src/types';
import { JsonRpcProvider } from 'ethers';
import { toRpcQuantity } from './toRpcQuantity';

export async function forwardETHChain(
  provider: JsonRpcProvider | string,
  blocks: NumberLike = 1,
  options: { interval?: NumberLike } = {},
) {
  if (typeof provider === 'string') provider = new JsonRpcProvider(provider);

  const interval = options.interval ?? 1;

  const blocksHex = toRpcQuantity(blocks);
  const intervalHex = toRpcQuantity(interval);

  await provider.send('hardhat_mine', [blocksHex, intervalHex]);
}
