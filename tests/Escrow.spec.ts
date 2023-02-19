import { Blockchain } from '@ton-community/sandbox';
import { Cell, toNano } from 'ton-core';
import { Escrow } from '../wrappers/Escrow';
import '@ton-community/test-utils';
import { compile } from '@ton-community/blueprint';

describe('Escrow', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Escrow');
    });

    it('should deploy', async () => {
        const blockchain = await Blockchain.create();

        const escrow = blockchain.openContract(Escrow.createFromConfig({}, code));

        const deployer = await blockchain.treasury('deployer');

        const deployResult = await escrow.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: escrow.address,
            deploy: true,
        });
    });
});
