import { Provider } from 'fuels';

export async function waitForNewFuelBlock(provider: Provider) {
  const currentBlock = await provider.getBlock('latest');

  if (!currentBlock) {
    throw new Error('Could not fetch FuelBlock');
  }

  while (true) {
    const newBlock = await provider.getBlock('latest');
    if (currentBlock.height < (newBlock?.height || 0)) {
      break;
    }
  }

  return;
}
