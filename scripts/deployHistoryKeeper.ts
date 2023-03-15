import {Address, toNano} from 'ton-core';
import { Deal } from '../wrappers/deal';
import { compile, NetworkProvider } from '@ton-community/blueprint';
import {HistoryKeeper} from "../wrappers/history-keeper";

export async function run(provider: NetworkProvider) {
    const historyKeeper = await HistoryKeeper.createFromConfig({
        owner_address: Address.parse("kQDrDcVNaFekDXuezGIcpyrFQbp8ekcxsUKHUGkIZFN65P3q")
    }, await compile('history-keeper'));

    await provider.deploy(historyKeeper, toNano('1'));

    const openedContract = provider.open(historyKeeper);

    // run methods on `openedContract`
}
