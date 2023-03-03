import { Blockchain, OpenedContract, TreasuryContract} from '@ton-community/sandbox';
import {Cell, contractAddress, toNano} from 'ton-core';
import {HistoryKeeper} from '../wrappers/history-keeper';
import '@ton-community/test-utils';
import {compile} from '@ton-community/blueprint';
import {Deal, dealConfigToCell} from "../wrappers/deal";

describe('HistoryKeeper', () => {
    let code: Cell;

    let historyKeeper: OpenedContract<HistoryKeeper>, user: OpenedContract<TreasuryContract>, blockchain: Blockchain;
    beforeAll(async () => {
        code = await compile('history-keeper');

        blockchain = await Blockchain.create();

        user = await blockchain.treasury('user');

        historyKeeper = blockchain.openContract(await HistoryKeeper.createFromConfig({
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
    });

    it('should deploy', async () => {

        const deal_code: Cell = await compile('Deal')
        const deal_init_state = await dealConfigToCell({
            id: 1,
            owner_address: user.address,
            history_keeper: historyKeeper.address,
            location: {latitude: 32, longitude: 34}
        })
        const init = { code: deal_code, data: deal_init_state };
        const deal = new Deal(contractAddress(0, init), init)

        console.log("deal address - ", deal.address)
        // const balanceOfDeal =

        const openDeal = blockchain.openContract(deal);
        // @ts-ignore
        // const location = await deal.getLocation();
        // console.log("Location " + location)
        // await openDeal.sendCancel(user.getSender())
        const balanceOfDeal = (await blockchain.getContract(deal.address)).balance

        console.log(balanceOfDeal)
    });
});
