import { NumberLike } from '@nomicfoundation/hardhat-network-helpers/dist/src/types';

export function toRpcQuantity(x: NumberLike): string {
  let hex: string;
  if (typeof x === 'number' || typeof x === 'bigint') {
    // TODO: check that number is safe
    hex = `0x${x.toString(16)}`;
  } else if (typeof x === 'string') {
    if (!x.startsWith('0x')) {
      throw new Error('Only 0x-prefixed hex-encoded strings are accepted');
    }
    hex = x;
  } else if ('toHexString' in x) {
    hex = x.toHexString();
  } else if ('toString' in x) {
    hex = x.toString(16);
  } else {
    throw new Error(`${x as any} cannot be converted to an RPC quantity`);
  }

  if (hex === '0x0') return hex;

  return hex.startsWith('0x') ? hex.replace(/0x0+/, '0x') : `0x${hex}`;
}
