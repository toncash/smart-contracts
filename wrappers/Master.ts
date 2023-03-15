import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';
import {compile} from "@ton-community/blueprint";
import {create_account} from "./opcodes";

export type MasterConfig = {
    admin_address: Address,
    account_code: Cell,
    deal_code: Cell
};

export async function masterConfigToCell(config: MasterConfig): Promise<Cell> {
    // const deal_code: Cell = await compile('Deal')
    // const history_keeper_code: Cell = await compile('HistoryKeeper')
    return beginCell()
        .storeAddress(config.admin_address)
        .storeRef(config.account_code)
        .storeRef(config.deal_code)
        .endCell();
}

function msg_create_account(buyer_address: Address): Cell {
    return beginCell()
        .storeUint(create_account, 32)
        .storeUint(12345, 64)
        .storeAddress(buyer_address)
        .endCell()
}
export class Master implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Master(address);
    }

    static async createFromConfig(config: MasterConfig, code: Cell, workchain = 0) {
        const data = await masterConfigToCell(config);
        const init = { code, data };
        return new Master(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATLY,
            body: beginCell().endCell(),
        });
    }

    async sendNewAccount(provider: ContractProvider, via: Sender, value: bigint, buyer_address: Address) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATLY,
            body: msg_create_account(buyer_address),
        });
    }

    async get_master_data(provider: ContractProvider) {
        const {stack} = await provider.get("get_master_data", [])
        return stack
    }
}
