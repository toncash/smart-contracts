import { Blockchain, OpenedContract, TreasuryContract} from '@ton-community/sandbox';
import {Cell, contractAddress, fromNano, toNano} from 'ton-core';
import {HistoryKeeper} from '../wrappers/history-keeper';
import '@ton-community/test-utils';
import {compile} from '@ton-community/blueprint';
import {Deal, dealConfigToCell} from "../wrappers/deal";

describe('HistoryKeeper', () => {
    let code: Cell
    let blockchain: Blockchain
    let user: OpenedContract<TreasuryContract>
    let historyKeeper: OpenedContract<HistoryKeeper>

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

    it('should create a deal with balance', async () => {

        const deal_code: Cell = await compile('Deal')
        const deal_init_state = await dealConfigToCell({
            id: 1,
            owner_address: user.address,
            history_keeper: historyKeeper.address,
            buyer_address: user.address
        })
        const init = { code: deal_code, data: deal_init_state };
        const deal = new Deal(contractAddress(0, init), init)

        let balanceOfDeal = (await blockchain.getContract(deal.address)).balance

        expect(balanceOfDeal).toBeGreaterThan(Number(toNano("99")))
        expect(balanceOfDeal).toBeLessThan(Number(toNano("100")))
    });

    it('should cancel a deal without fee', async () => {

        const deal_code: Cell = await compile('Deal')
        const deal_init_state = await dealConfigToCell({
            id: 1,
            owner_address: user.address,
            history_keeper: historyKeeper.address,
            buyer_address: user.address
        })
        const init = { code: deal_code, data: deal_init_state };
        const deal = new Deal(contractAddress(0, init), init)
        const openDeal = blockchain.openContract(deal)


        const balanceOfDealBefore = (await blockchain.getContract(deal.address)).balance
        const balanceOfUserBefore = (await blockchain.getContract(user.address)).balance
        await openDeal.sendCancel(user.getSender())
        const balanceOfDealAfter = (await blockchain.getContract(deal.address)).balance
        const balanceOfUserAfter = (await blockchain.getContract(user.address)).balance

        expect(balanceOfDealAfter).toBe(0n)
        expect(Number(fromNano(balanceOfUserAfter))).toBeCloseTo(Number(fromNano(balanceOfUserBefore)) + Number(fromNano(balanceOfDealBefore)) - 0.01)
    });
});
