import { useContext, useState } from "react"
import Web3 from "web3";
import useAccount from "../account/useAccount";
import { Web3Context } from "./Web3Context"

export const useWeb3 = (networkId: number | undefined): Web3 | null => {
    const [web3, setWeb3] = useState<Web3 | null>(null);
    const web3Context = useContext(Web3Context);
    const account = useAccount();

    if (!networkId) {
        return null;
    }

    if (account?.network.networkId === networkId) {
        setWeb3(account.web3);
    } else {
        setWeb3(web3Context.getWeb3(networkId).web3);
    }

    return web3;
}