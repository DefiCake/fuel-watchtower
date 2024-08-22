import { EthBlockType } from './EthBlockType';
import { FuelBlockType } from './FuelBlockType';

export type CheckpointType = {
  eth_block: EthBlockType;
  fuel_block: FuelBlockType;
  createdAt?: number;
};
