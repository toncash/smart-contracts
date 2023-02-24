import * as fs from "fs";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "ton-crypto";
import {TonClient, Cell, WalletContractV4, WalletContractV1R2} from "ton";
import MainContract from "./deployEscrow";
import {cellPath, mnemonic} from "../Key/key";

async function deploy() {
    // initialize ton rpc client on testnet
    const endpoint = await getHttpEndpoint({ network: "testnet" });
    const tonClient = new TonClient({ endpoint });

    //create and write data
    const cell = Cell.fromBoc(fs.readFileSync(cellPath))[0];
    const sin1 = 1;
    const sin2 = 2;
    const contract = MainContract.createForDeploy(cell, sin1, sin2);

    console.log("contract adress: ", contract.address.toString());
    // exit if contract is already deployed
    if (await tonClient.isContractDeployed(contract.address)) {
        return console.log("Counter already deployed");
    }

    const key = await mnemonicToWalletKey(mnemonic.split(" "));
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
    if (!await tonClient.isContractDeployed(wallet.address)) {
        return console.log("wallet is not deployed");
    }


    // open wallet and read the current seqno of the wallet
    const walletContract = tonClient.open(wallet);
    const walletSender = walletContract.sender(key.secretKey);
    const seqno = await walletContract.getSeqno();

    // send the deploy transaction
    const counterContract = tonClient.open(contract);
    await counterContract.sendDeploy(walletSender);

    // wait until confirmed
    let currentSeqno = seqno;
    while (currentSeqno == seqno) {
        console.log("waiting for deploy transaction to confirm...");
        await sleep(1500);
        currentSeqno = await walletContract.getSeqno();
    }
    console.log("deploy transaction confirmed!");
}

deploy();

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
