import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';
import {compile} from "@ton-community/blueprint";

export type AccountConfig = {
    owner_address: Address,
    master_address: Address,
    deal_code: Cell
};

export async function accountConfigToCell(config: AccountConfig): Promise<Cell> {
    // const deal_code: Cell = await compile('Deal')
    return beginCell()
        .storeAddress(config.owner_address)
        .storeUint(0, 64)
        .storeUint(0, 64)
        .storeAddress(config.master_address)
        .storeRef(config.deal_code)
        .endCell();
}

function getMsgBody(buyer_address: Address): Cell {
    return beginCell()
        .storeUint(1, 32)
        .storeUint(12345, 64)
        .storeAddress(buyer_address)
        .endCell()
}
export class Account implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Account(address);
    }

    static async createFromConfig(config: AccountConfig, code: Cell, workchain = 0) {
        const data = await accountConfigToCell(config);
        const init = { code, data };
        return new Account(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint, buyer_address: Address) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATLY,
            body: getMsgBody(buyer_address),
        });
    }

    async sendNewDeal(provider: ContractProvider, via: Sender, value: bigint, buyer_address: Address) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATLY,
            body: getMsgBody(buyer_address),
        });
    }

    async get_account_data(provider: ContractProvider) {
        const {stack} = await provider.get("get_account_data", [])
        return stack
    }
}
