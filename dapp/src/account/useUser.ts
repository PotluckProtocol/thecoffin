import { ethers } from "ethers";
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
        web3: new ethers.providers.JsonRpcProvider('https://rpc.ftm.tools/')
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

    const [user, setUser] = useState<User>({
        account: null,
        isInitialized,
        getSignerOrProvider
    });

    const walletAddress = account?.walletAddress;
    const networkId = account?.network.networkId;

    useEffect(() => {
        setUser({ account, getSignerOrProvider, isInitialized });
    }, [walletAddress, networkId, isInitialized]);

    return user;
}

export default useUser;