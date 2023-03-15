import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    toNano
} from 'ton-core';
import {cancel_deal, complete_deal} from "./opcodes";

export type DealConfig = {
    owner_address: Address,
    account_address: Address,
    buyer_address: Address,
    cell_with_master: Cell
};

export function dealConfigToCell(config: DealConfig): Cell {
    return beginCell()
        .storeAddress(config.owner_address)
        .storeAddress(config.account_address)
        .storeAddress(config.buyer_address)
        .storeRef(config.cell_with_master)
        .endCell();
}

export class Deal implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Deal(address);
    }

    static createFromConfig(config: DealConfig, code: Cell, workchain = 0) {
        const data = dealConfigToCell(config);
        const init = { code, data };
        return new Deal(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATLY,
            body: beginCell().endCell(),
        });
    }

    async sendCancel(provider: ContractProvider, via: Sender){
        await provider.internal(via, {
            value: toNano("0.02"),
            body: beginCell()
                .storeUint(cancel_deal, 32)
                .storeUint(123, 64)
                .endCell()
        })
    }

    async sendComplete(provider: ContractProvider, via: Sender){
        await provider.internal(via, {
            value: toNano("0.2"),
            body: beginCell()
                .storeUint(complete_deal, 32)
                .storeUint(444, 64)
                .endCell()

        })
    }

    async get_deal_data(provider: ContractProvider) {
        const {stack} = await provider.get("get_deal_data", [])
        return [stack.readAddress(), stack.readAddress(), stack.readAddress(), stack.readCell()]
    }

}
