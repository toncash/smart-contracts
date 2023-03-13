import {Address, toNano} from 'ton-core';
import { Deal } from '../wrappers/deal';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const deal = Deal.createFromConfig({
        owner_address: Address.parse("f"),
        history_keeper: Address.parse("f"),
        buyer_address: Address.parse("f")
    }, await compile('Deal'));

    await provider.deploy(deal, toNano('0.05'));

    const openedContract = provider.open(deal);

    // run methods on `openedContract`
}
