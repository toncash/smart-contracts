import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type DealConfig = {
    id: number,
    owner_address: Address,
    history_keeper: Address,
    deal_code: Cell
};

export function dealConfigToCell(config: DealConfig): Cell {
    return beginCell()
        .storeUint(config.id, 64)
        .storeAddress(config.owner_address)
        .storeAddress(config.history_keeper)
        .storeRef(config.deal_code)
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
}
