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

export type DealConfig = {
    owner_address: Address,
    history_keeper: Address,
    buyer_address: Address
};

export function dealConfigToCell(config: DealConfig): Cell {
    return beginCell()
        .storeAddress(config.owner_address)
        .storeAddress(config.history_keeper)
        .storeAddress(config.buyer_address)
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
                .storeUint(3, 32)
                .storeUint(123, 64)
                .endCell()
        })
    }

    async sendCancelWithFee(provider: ContractProvider, via: Sender){
        await provider.internal(via, {
            value: toNano("0.02"),
            body: beginCell()
                .storeUint(4, 32)
                .storeUint(444, 64)
                .endCell()
        })
    }

    async sendConfirmation(provider: ContractProvider, via: Sender, buyer: Address){
        await provider.internal(via, {
            value: toNano("0.02"),
            body: beginCell()
                .storeUint(2, 32)
                .storeUint(222, 64)
                .storeAddress(buyer)
                .endCell()
        })
    }

    async get_deal_data(provider: ContractProvider) {
        const {stack} = await provider.get("get_deal_data", [])
        return stack
    }

}
