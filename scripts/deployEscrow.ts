import { toNano } from 'ton-core';
import { Escrow } from '../wrappers/Escrow';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const escrow = Escrow.createFromConfig({}, await compile('Escrow'));

    await provider.deploy(escrow, toNano('0.05'));

    const openedContract = provider.open(escrow);

    // run methods on `openedContract`
}
