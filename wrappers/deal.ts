import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type Location = {
    latitude: number,
    longitude: number
}

export type DealConfig = {
    id: number,
    owner_address: Address,
    history_keeper: Address,
    location: Location,
};

export function dealConfigToCell(config: DealConfig): Cell {
    return beginCell()
        .storeUint(config.id, 64)
        .storeAddress(config.owner_address)
        .storeAddress(config.history_keeper)
        .storeUint(config.location.latitude, 32)
        .storeUint(config.location.longitude, 32)
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

    async getLocation(provider: ContractProvider) {
        const { stack } = await provider.get("get_location", []);
        return stack.readTuple();
    }
}
