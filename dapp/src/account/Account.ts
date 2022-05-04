import Web3 from "web3";
import { Network } from "../network/Networks";

export type Account = {
    walletAddress: string;
    network: Network;
    web3: Web3;
}