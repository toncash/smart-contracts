import { getHttpEndpoint } from "@orbs-network/ton-access";
import {TonClient, Address, WalletContractV4, fromNano} from "ton";
import MainContract from "./deployEscrow";
import {wallet} from "../Key/key";
import {mnemonicToWalletKey} from "ton-crypto"; // this is the interface class we just implemented

// async function main() {
//
//     // initialize ton rpc client on testnet
//     const endpoint = await getHttpEndpoint({ network: "testnet" });
//     const client = new TonClient({ endpoint });
//
//     // open Counter instance by address
//     const counterAddress = Address.parse(wallet);
//     const counter = new MainContract(counterAddress);
//     const contract = client.open(counter);
//
//     console.log("Adress contract: ", contract.address)
//     const  counterValue = await contract.getCounter();
//     console.log("value: ", counterValue.toString());
// }
//
// main();

async function main() {
    // open wallet v4 (notice the correct wallet version here)
    const mnemonic = "unfold sugar water ..."; // your 24 secret words (replace ... with the rest of the words)
    const key = await mnemonicToWalletKey(mnemonic.split(" "));
    const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });

    // initialize ton rpc client on testnet
    const endpoint = await getHttpEndpoint({ network: "testnet" });
    const client = new TonClient({ endpoint });

    // query balance from chain
    const balance = await client.getBalance(wallet.address);
    console.log("balance:", fromNano(balance));

    // query seqno from chain
    const walletContract = client.open(wallet);
    const seqno = await walletContract.getSeqno();
    console.log("seqno:", seqno);
}

main();

