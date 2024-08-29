import { WalletUnlocked } from 'fuels';

const MNEMONIC = 'test test test test test test test test test test test junk';
const PATH = "m/44'/1179993420'/0'/0/";

export function fuelTestWallets(nAccounts = 10) {
  let range = Array.from(Array(nAccounts).keys());

  const wallets = range
    .map((n) => PATH + `${n}`)
    .map((path) => WalletUnlocked.fromMnemonic(MNEMONIC, path));

  return wallets;
}
