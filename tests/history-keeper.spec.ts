import { Blockchain } from '@ton-community/sandbox';
import {Cell, contractAddress, toNano} from 'ton-core';
import { HistoryKeeper } from '../wrappers/history-keeper';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';
import {Deal, dealConfigToCell} from "../wrappers/deal";

describe('HistoryKeeper', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('history-keeper');
    });

    it('should deploy', async () => {
        const blockchain = await Blockchain.create();

        const user = await blockchain.treasury('user');

        const historyKeeper = blockchain.openContract(await HistoryKeeper.createFromConfig({
            owner_address: user.address
        }, code));

        const deployResult = await historyKeeper.sendDeploy(
            user.getSender(),
            toNano('100')
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: user.address,
            to: historyKeeper.address,
            deploy: true,
        });
//0, user.address, historyKeeper.address, deal_code
        const deal_code: Cell = await compile('Deal')
        const deal_init_state = await dealConfigToCell({
            id: 0,
            owner_address: user.address,
            history_keeper: historyKeeper.address,
            deal_code
        })
        const init = { code: deal_code, data: deal_init_state };
        const deal = new Deal(contractAddress(0, init), init)

        console.log("deal address - ", deal.address)
        // const balanceOfDeal =
    });
});
