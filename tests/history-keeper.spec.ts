import { Blockchain, OpenedContract, TreasuryContract} from '@ton-community/sandbox';
import {beginCell, Cell, fromNano, toNano} from 'ton-core';
import {Account} from '../wrappers/Account';
import '@ton-community/test-utils';
import {compile} from '@ton-community/blueprint';
import {Deal} from "../wrappers/Deal";
import {Master} from "../wrappers/Master";

describe('TonCash', () => {
    let blockchain: Blockchain
    let seller: OpenedContract<TreasuryContract>
    let buyer: OpenedContract<TreasuryContract>
    let admin: OpenedContract<TreasuryContract>
    let master: OpenedContract<Master>

    let codeMaster: Cell
    let codeDeal: Cell
    let codeAccount: Cell
    jest.setTimeout(30000)
    beforeAll(async () => {
         codeMaster = await compile('Master')
         codeDeal = await compile('Deal')
         codeAccount = await compile('Account')

        blockchain = await Blockchain.create();

        admin = await blockchain.treasury('admin');
        seller = await blockchain.treasury('seller');
        buyer = await blockchain.treasury('buyer');


        master = blockchain.openContract(await Master.createFromConfig({
            admin_address: admin.address,
            account_code: codeAccount,
            deal_code: codeDeal
        }, codeMaster));

        const deployResult = await master.sendDeploy(
            admin.getSender(),
            toNano('0.3')
        );

        // console.log("accountAddress - ", account.address)

        expect(deployResult.transactions).toHaveTransaction({
            from: admin.address,
            to: master.address,
            deploy: true,
        });
        await master.sendNewAccount(seller.getSender(), toNano("100"), buyer.address)
    });

    it('should create a deal with balance', async () => {

        const account_init_state = {
            owner_address: seller.address,
            master_address: master.address,
            deal_code: codeDeal
        }

        const account = await Account.createFromConfig(account_init_state, codeAccount)

        const deal_init_state = {
            owner_address: seller.address,
            account_address: account.address,
            buyer_address: buyer.address,
            cell_with_master: beginCell().storeAddress(master.address).endCell()
        }

        const deal = await Deal.createFromConfig(deal_init_state, codeDeal)


        let balanceOfDeal = (await blockchain.getContract(deal.address)).balance
        console.log(fromNano(balanceOfDeal))
        expect(balanceOfDeal).toBeGreaterThan(Number(toNano("99")))
        expect(balanceOfDeal).toBeLessThan(Number(toNano("100")))
    });

    it.skip('should cancel a deal without fee', async () => {

        const account_init_state = {
            owner_address: seller.address,
            master_address: master.address,
            deal_code: codeDeal
        }

        const account = await Account.createFromConfig(account_init_state, codeAccount)

        const deal_init_state = {
            owner_address: seller.address,
            account_address: account.address,
            buyer_address: buyer.address,
            cell_with_master: beginCell().storeAddress(master.address).endCell()
        }

        const deal = await Deal.createFromConfig(deal_init_state, codeDeal)
        const openDeal = blockchain.openContract(deal)

        const balanceOfDealBefore = (await blockchain.getContract(deal.address)).balance
        const balanceOfUserBefore = (await blockchain.getContract(seller.address)).balance

        await openDeal.sendCancel(seller.getSender())

        const balanceOfDealAfter = (await blockchain.getContract(deal.address)).balance
        const balanceOfUserAfter = (await blockchain.getContract(seller.address)).balance
        expect(balanceOfDealAfter).toBe(0n)
        expect(Number(fromNano(balanceOfUserAfter))).toBeCloseTo(Number(fromNano(balanceOfUserBefore)) + Number(fromNano(balanceOfDealBefore)) - 0.015)


    });

    it("should complete a deal", async ()=>{
        const account_init_state = {
            owner_address: seller.address,
            master_address: master.address,
            deal_code: codeDeal
        }

        const account = await Account.createFromConfig(account_init_state, codeAccount)

        const deal_init_state = {
            owner_address: seller.address,
            account_address: account.address,
            buyer_address: buyer.address,
            cell_with_master: beginCell().storeAddress(master.address).endCell()
        }

        const deal = await Deal.createFromConfig(deal_init_state, codeDeal)
        const openDeal = blockchain.openContract(deal)

        const balanceOfDealBefore = (await blockchain.getContract(deal.address)).balance
        const balanceOfBuyerBefore = (await blockchain.getContract(buyer.address)).balance
        console.log("balanceOfDealBefore - ", fromNano(balanceOfDealBefore))
        console.log("balanceOfBuyerBefore - ", fromNano(balanceOfBuyerBefore))


        await openDeal.sendComplete(seller.getSender())

        const balanceOfDealAfter = (await blockchain.getContract(deal.address)).balance
        const balanceOfBuyerAfter = (await blockchain.getContract(buyer.address)).balance

        expect(balanceOfDealBefore).toBeGreaterThan(Number(balanceOfDealAfter))
        expect(balanceOfBuyerBefore).toBeLessThan(Number(balanceOfBuyerAfter))

    })
});
