import { Blockchain, OpenedContract, TreasuryContract} from '@ton-community/sandbox';
import {Cell, contractAddress, fromNano, toNano} from 'ton-core';
import {HistoryKeeper} from '../wrappers/history-keeper';
import '@ton-community/test-utils';
import {compile} from '@ton-community/blueprint';
import {Deal, dealConfigToCell} from "../wrappers/deal";
import * as fs from "fs";
import {btoa} from "buffer";

describe('HistoryKeeper', () => {
    let code: Cell
    let blockchain: Blockchain
    let seller: OpenedContract<TreasuryContract>
    let buyer: OpenedContract<TreasuryContract>
    let historyKeeper: OpenedContract<HistoryKeeper>

    beforeAll(async () => {
        let code = await compile('history-keeper')

        const codestring: string = code.toBoc().toString("base64")
        console.log(codestring)
        const hisrotyKeeperCode = "te6cckECBwEAARkAART/APSkE/S88sgLAQIBIAMCAATyMAIBSAUEABugJ/vaiaH0gaZ/pn+oYQHU0CDHAJPyw+fe7UTQ+kDTP9M/1DAF0NMDMfpAMATTH9M/IsAB4wJbNjYkwAKOGTRmxwXy4GUCpEAzyFAEzxYSyz/LP8zJ7VTgBMADjhdmxwXy4GYDpAHIUATPFhLLP8s/zMntVOBfBfLD5wYA/mwS+kAwUVTHBfLgZfgoVEQWJ1pwBMhQA88WAc8WAc8WySLIywES9AD0AMsAySD5AHB0yMsCygfL/8nQUYehgggPQkC8mIIImJaAF6EG33HIyx8Vyz/Jd4AYyMsFUAnPFlAH+gIXy2sTzBTMyXD7AEAzyFAEzxYSyz/LP8zJ7VQ/648w"
        code = Cell.fromBase64(hisrotyKeeperCode)
        // fs.writeFileSync("code-deal", codestring)

        blockchain = await Blockchain.create();

        seller = await blockchain.treasury('seller');
        buyer = await blockchain.treasury('buyer');

        historyKeeper = blockchain.openContract(await HistoryKeeper.createFromConfig({
            owner_address: seller.address
        }, code));

        const deployResult = await historyKeeper.sendDeploy(
            seller.getSender(),
            toNano('100'),
            buyer.address
        );

        console.log("historyKeeperAddress - ", historyKeeper.address)

        expect(deployResult.transactions).toHaveTransaction({
            from: seller.address,
            to: historyKeeper.address,
            deploy: true,
        });

    });

    it('should create a deal with balance', async () => {

        const deal_code: Cell = await compile('Deal')
        const deal_init_state = await dealConfigToCell({
            owner_address: seller.address,
            history_keeper: historyKeeper.address,
            buyer_address: buyer.address
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
            owner_address: seller.address,
            history_keeper: historyKeeper.address,
            buyer_address: buyer.address
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
            history_keeper: historyKeeper.address,
            buyer_address: buyer.address
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
