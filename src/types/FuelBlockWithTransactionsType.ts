import { Block, Transaction } from 'fuels';

export type FuelBlockWithTransactionsType = Block & {
  transactions: Transaction[];
};
