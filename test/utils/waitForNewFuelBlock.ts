import { BN, Provider } from 'fuels';

export async function waitForNewFuelBlock(provider: Provider) {
  const snapshotBlock = await provider.getBlock('latest');

  if (!snapshotBlock) {
    throw new Error('Could not fetch FuelBlock');
  }

  while (true) {
    const newBlock = await provider.getBlock('latest');

    if (snapshotBlock.height.lt(newBlock?.height || new BN('0'))) {
      break;
    }
  }

  return;
}
