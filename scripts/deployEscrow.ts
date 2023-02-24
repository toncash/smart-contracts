import {SendMode, toNano} from 'ton-core';
import { Escrow } from '../wrappers/Escrow';
import { compile, NetworkProvider } from '@ton-community/blueprint';

export async function run(provider: NetworkProvider) {
    const escrow = Escrow.createFromConfig({}, await compile('Escrow'));

    await provider.deploy(escrow, toNano('0.05'));

    const openedContract = provider.open(escrow);

    // run methods on `openedContract`
}

import { Contract, ContractProvider, Sender, Address, Cell, contractAddress, beginCell } from "ton-core";

// 1024 max to cell send
export default class MainContract implements Contract {

    static createForDeploy(code: Cell, firstSigna: number, secondSigna: number): MainContract {
        const data = beginCell()
            .storeUint(firstSigna, 32)
            .endCell();
        const workchain = 0;
        const address = contractAddress(workchain, { code, data });
        return new MainContract(address, { code, data });
    }

    constructor(readonly address: Address, readonly init?: { code: Cell, data: Cell }) {}

    async sendDeploy(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: "0.001", // send 0.01 TON to contract for rent
            bounce: false
        });
    }

    async getCounter(provider: ContractProvider) {
        const { stack } = await provider.get("counter", []);
        return stack.readBigNumber();
    }


}
