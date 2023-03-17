import {compile, NetworkProvider} from "@ton-community/blueprint";
import {Master} from "../wrappers/Master";
import {Address, toNano} from 'ton-core';

export async function run(provider: NetworkProvider) {
    const account_code = await compile('Account')
    const deal_code = await compile('Deal')
    const masterContract = provider.open(
        await Master.createFromConfig(
            {
                admin_address: Address.parse("kQDrDcVNaFekDXuezGIcpyrFQbp8ekcxsUKHUGkIZFN65P3q"),
                account_code,
                deal_code
            },
            await compile('Master')
        )
    );

    await masterContract.sendDeploy(provider.sender(), toNano('0.05'));

}