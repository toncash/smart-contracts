import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from 'ton-core';

export type EscrowConfig = {};

export function escrowConfigToCell(config: EscrowConfig): Cell {
    return beginCell().endCell();
}

export class Escrow implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Escrow(address);
    }

    static createFromConfig(config: EscrowConfig, code: Cell, workchain = 0) {
        const data = escrowConfigToCell(config);
        const init = { code, data };
        return new Escrow(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATLY,
            body: beginCell().endCell(),
        });
    }
}
