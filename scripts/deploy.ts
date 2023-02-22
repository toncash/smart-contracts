import * as fs from "fs";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "ton-crypto";
import { TonClient, Cell, WalletContractV4 } from "ton";
import MainContract from "./deployEscrow";
import {cellPath, mnemonic} from "../Key/key";

async function deploy() {
    // initialize ton rpc client on testnet
    const endpoint = await getHttpEndpoint({ network: "testnet" });
    const client = new TonClient({ endpoint });

    const cell = Cell.fromBoc(fs.readFileSync(cellPath))[0]; // compilation output from step 6
    const sin1 = 120930283910;
    const sin2 = 123108237917;
    const contract = MainContract.createForDeploy(cell, sin1, sin2);

    // exit if contract is already deployed
    console.log("contract address:", contract.address.toString());
    if (await client.isContractDeployed(contract.address)) {
        return console.log("Counter already deployed");
    }

    // open wallet v4 (notice the correct wallet version here)

    const key = await mnemonicToWalletKey(mnemonic.split(" "));
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });

    if (!await client.isContractDeployed(wallet.address)) {
        return console.log("wallet is not deployed");
    }

    // open wallet and read the current seqno of the wallet
    const walletContract = client.open(wallet);
    const walletSender = walletContract.sender(key.secretKey);
    const seqno = await walletContract.getSeqno();

    // send the deploy transaction
    const counterContract = client.open(contract);
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