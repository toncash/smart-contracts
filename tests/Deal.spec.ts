import { Blockchain } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Deal } from '../wrappers/Deal';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Deal', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Deal');
    });

    it('should deploy', async () => {
        // const blockchain = await Blockchain.create();
        //
        // const deal = blockchain.openContract(Deal.createFromConfig({}, code));
        //
        // const deployer = await blockchain.treasury('deployer');
        //
        // const deployResult = await deal.sendDeploy(deployer.getSender(), toNano('0.05'));
        //
        // expect(deployResult.transactions).toHaveTransaction({
        //     from: deployer.address,
        //     to: deal.address,
        //     deploy: true,
        // });
    });
});
