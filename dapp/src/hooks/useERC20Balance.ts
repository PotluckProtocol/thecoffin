import { ethers } from "ethers";
import { useEffect, useState } from "react";
import useUser from "../account/useUser";
import { abi } from "../common-abis/ERC20";
import useInterval from "./useInterval";

export type UseLabsBalanceResult = {
    contractAddress: string;
    isLoading: boolean;
    balance: number;
}

export const useERC20Balance = (contractAddress: string, intervalMs: number = 5000): number | null => {
    const user = useUser();
    const [balance, setBalance] = useState<number | null>(null);
    const [decimals, setDecimals] = useState<number | null>(null);

    const walletAddress = user.account?.walletAddress;
    const networkId = user.account?.network.networkId;

    const fetchWalletBalance = async () => {
        if (walletAddress && networkId && decimals) {
            const erc20Contract = new ethers.Contract(contractAddress, abi, user.getSignerOrProvider(networkId))
            try {
                const balance = await erc20Contract.balanceOf(walletAddress);
                setBalance(+ethers.utils.formatEther(balance));
            } catch (e) {
                console.log('Error on getting ERC20 balance', e);
            }
        }
    }

    useEffect(() => {
        const fetchDecimals = async () => {
            if (user.account) {
                const erc20Contract = new ethers.Contract(contractAddress, abi, user.getSignerOrProvider(user.account.network.networkId))
                const decimals = Number(await erc20Contract.decimals());
                setDecimals(decimals);
            }
        }

        fetchDecimals();
    }, [user.account]);

    useInterval(() => {
        fetchWalletBalance();
    }, intervalMs);

    useEffect(() => {
        fetchWalletBalance();
    }, [walletAddress, decimals, networkId]);

    if (!decimals) {
        return null;
    }

    return balance;
}