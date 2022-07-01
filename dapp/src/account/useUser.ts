import { ethers, providers } from "ethers";
import { useContext, useEffect, useState } from "react";
import { Account } from "./Account";
import { AccountContext } from "./AccountContext";

export type ProviderOrSigner = ethers.providers.Provider | ethers.Signer;

const PUBLIC_PROVIDER_MAP: any = {
    137: {
        isPublic: true,
        web3: new ethers.providers.JsonRpcProvider('https://rpc-mainnet.matic.network'),
    },
    250: {
        isPublic: true,
        web3: new ethers.providers.JsonRpcProvider('https://rpc.ankr.com/fantom/')
    },
    4002: {
        isPublic: true,
        web3: new ethers.providers.JsonRpcProvider('https://rpc.testnet.fantom.network/')
    },
    43114: {
        isPublic: true,
        web3: new ethers.providers.JsonRpcProvider('https://api.avax.network/ext/bc/C/rpc')
    }
}

export type User = {
    account: Account | null;
    isInitialized: boolean;
    getSignerOrProvider(networkId: number): ProviderOrSigner;
    getProvider(networkId: number): providers.Provider;
    getCurrentBlock(networkId: number): Promise<number>;
}

const useUser = (): User => {

    const accountContext = useContext(AccountContext);
    const { account, isInitialized } = accountContext;

    const getSignerOrProvider = (networkId: number) => {
        if (account && account.network.networkId === networkId) {
            console.log('Found account, using account.signer');
            return account.signer;
        } else {
            console.log('No account found, using public provider');
            return PUBLIC_PROVIDER_MAP[networkId].web3 as ProviderOrSigner;
        }
    }

    const getProvider = (networkId: number): ethers.providers.Provider => {
        console.log('No account found, using public provider');
        return PUBLIC_PROVIDER_MAP[networkId].web3;
    }

    const getCurrentBlock = async (networkId: number): Promise<number> => {
        const provider = getProvider(networkId);
        const number = await provider.getBlockNumber();
        return number;
    }

    const [user, setUser] = useState<User>({
        account: null,
        isInitialized,
        getSignerOrProvider,
        getProvider,
        getCurrentBlock
    });

    const walletAddress = account?.walletAddress;
    const networkId = account?.network.networkId;

    useEffect(() => {
        setUser({ account, getSignerOrProvider, getProvider, getCurrentBlock, isInitialized });
    }, [walletAddress, networkId, isInitialized]);

    return user;
}

export default useUser;