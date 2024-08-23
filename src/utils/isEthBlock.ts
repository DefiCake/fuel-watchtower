import { EthBlockType } from '@/types';

export function isEthBlock(obj: any): obj is EthBlockType {
  if (!obj) return false;

  return 'hash' in obj && 'number' in obj && 'timestamp' in obj;
}
