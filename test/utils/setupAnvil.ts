import { createAnvil } from '@viem/anvil';

export async function setupAnvil() {
  const port = 49152 + Math.floor(5000 * Math.random());
  let anvil = createAnvil({ port, accounts: 20 });

  const rpcUrl = `http://localhost:${anvil.port}`;

  await anvil.start();

  return { anvil, rpcUrl, port };
}
