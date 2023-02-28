import {Address, toNano} from 'ton-core';
import { Deal } from '../wrappers/deal';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const deal = Deal.createFromConfig({
        id: 123,
        owner_address: Address.parse("f"),
        history_keeper: Address.parse("f"),
        deal_code: await compile('Deal')
    }, await compile('Deal'));

    await provider.deploy(deal, toNano('0.05'));

    const openedContract = provider.open(deal);

    // run methods on `openedContract`
}
