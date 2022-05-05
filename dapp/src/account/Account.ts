import { ethers } from 'ethers';
import { Network } from "../network/Networks";

export type Account = {
    walletAddress: string;
    network: Network;
    web3: ethers.providers.Provider;
    signer: ethers.Signer;
}