import { Blockchain, OpenedContract, TreasuryContract} from '@ton-community/sandbox';
import {Cell, contractAddress, fromNano, toNano} from 'ton-core';
import {Account, accountConfigToCell} from '../wrappers/Account';
import '@ton-community/test-utils';
import {compile} from '@ton-community/blueprint';
import {Deal, dealConfigToCell} from "../wrappers/Deal";
import {btoa} from "buffer";
import {Master} from "../wrappers/Master";

describe('TonCash', () => {
    let code: Cell
    let blockchain: Blockchain
    let seller: OpenedContract<TreasuryContract>
    let buyer: OpenedContract<TreasuryContract>
    let admin: OpenedContract<TreasuryContract>
    let account: OpenedContract<Account>
    let master: OpenedContract<Master>
    const dealCode = "te6cckEBBwEA8wABFP8A9KQT9LzyyAsBAgFiAwIBCaCn+bZ5BgP40DIhxwCSXwPg2zwD0NMDMfpAMFMCxwVTEscFsfLj6ATTH9M/MSHAAZJfB+AhwAKOQzE1UTHHBVITxwUSsPLj6AL6QDBUIiDIUAPPFgHPFgHPFsntVIECK3LIyx/LP8lwgBDIywVQA88WIvoCEstqzMlx+wDgMDEgwAPjAgYFBABWNCPABJ1TIMcFUxLHBbOw8uPp3gPABZxREscFWccFs7Dy4+2SXwPihA/y8AA6MDFmxwXy4+gBcIAYyMsFUAPPFgH6AstqyYMG+wAAFO1E0PpA+kD6QDDCg9SA"
    const hisrotyKeeperCode = "te6cckECCAEAAR4AART/APSkE/S88sgLAQIBIAMCAATyMAIBSAUEABugJ/vaiaH0gaZ/pn+oYQHU0CDHAJPyw+fe7UTQ+kDTP9M/1DAF0NMDMfpAMATTH9M/IsAB4wJbNjYkwAKOGTRmxwXy4GUCpEAzyFAEzxYSyz/LP8zJ7VTgBMADjhdmxwXy4GYDpAHIUATPFhLLP8s/zMntVOBfBfLD5wYB5mwS+kAwUVTHBfLgZfgoVEQWJ1pwBMhQA88WAc8WAc8WySLIywES9AD0AMsAySD5AHB0yMsCygfL/8nQUYehghAF9eEAvJmCEAX14QAXoQbfccjLHxXLP8l3gBjIywVQCc8WUAf6AhfLaxPMFMzJcPsAQDMHABzIUATPFhLLP8s/zMntVET16ws="

    let codeMaster: Cell
    let codeDeal: Cell
    let codeAccount: Cell
    jest.setTimeout(30000)
    beforeAll(async () => {
         codeMaster = await compile('Master')
         codeDeal = await compile('Deal')
         codeAccount = await compile('Account')
        // const codestring: string = code.toBoc().toString("base64")
        // code = Cell.fromBase64(codestring)

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

    });

    it('should create a deal with balance', async () => {
        await master.sendNewAccount(seller.getSender(), toNano("100"), buyer.address)

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
            master_address: master.address
        }

        const deal = await Deal.createFromConfig(deal_init_state, codeDeal)



        // const init_deal = { code: codeDeal, data: deal_init_state };
        // const deal = new Deal(contractAddress(0, init_deal), init_deal)
        //
        // let balanceOfDeal = (await blockchain.getContract(deal.address)).balance
        // console.log(balanceOfDeal)
        // expect(balanceOfDeal).toBeGreaterThan(Number(toNano("99")))
        // expect(balanceOfDeal).toBeLessThan(Number(toNano("100")))
    });

    it.skip('should cancel a deal without fee', async () => {

        const deal_code: Cell = await compile('Deal')
        const deal_init_state = await dealConfigToCell({
            owner_address: seller.address,
            account_address: account.address,
            buyer_address: buyer.address,
            master_address: master.address
        })
        const init = { code: deal_code, data: deal_init_state };
        const deal = new Deal(contractAddress(0, init), init)
        const openDeal = blockchain.openContract(deal)


        const balanceOfDealBefore = (await blockchain.getContract(deal.address)).balance
        const balanceOfUserBefore = (await blockchain.getContract(seller.address)).balance
        console.log("balanceOfDealBefore - ", fromNano(balanceOfDealBefore))
        console.log("balanceOfUserBefore - ", fromNano(balanceOfUserBefore))
        await openDeal.sendCancel(seller.getSender())
        const balanceOfDealAfter = (await blockchain.getContract(deal.address)).balance
        const balanceOfUserAfter = (await blockchain.getContract(seller.address)).balance
        console.log("balanceOfDealAfter - ", fromNano(balanceOfDealAfter))
        console.log("balanceOfUserAfter - ", fromNano(balanceOfUserAfter))
        expect(balanceOfDealAfter).toBe(0n)
        expect(Number(fromNano(balanceOfUserAfter))).toBeCloseTo(Number(fromNano(balanceOfUserBefore)) + Number(fromNano(balanceOfDealBefore)) - 0.01)
    });

    it.skip("should add buyer to contract deal", async ()=>{
        const deal_code: Cell = await compile('Deal')
        const deal_init_state = await dealConfigToCell({
            owner_address: seller.address,
            account_address: account.address,
            buyer_address: buyer.address,
            master_address: master.address
        })
        const init = { code: deal_code, data: deal_init_state };
        const deal = new Deal(contractAddress(0, init), init)
        const openDeal = blockchain.openContract(deal)

        await openDeal.sendConfirmation(seller.getSender(), buyer.address)

        const cell = await openDeal.get_deal_data()
        const [owner_address, history_keeper_address, buyer_address] = [cell.readAddress(), cell.readAddress(), cell.readAddress()]

        expect(owner_address).not.toEqual(buyer_address)

        const cancelTrx = await openDeal.sendCancel(seller.getSender())

        expect(cancelTrx.transactions).toHaveTransaction({
            from: seller.address,
            to: openDeal.address,
            exitCode: 1000
        });
    })
});
