import { createContext, PropsWithChildren, useState } from "react";
import Web3 from 'web3';

export type Web3ContextType = {
    getWeb3(networkId: number): Web3Item;
    setWeb3(networkId: number, web3: Web3): void;
    clearWeb3(networkId: number): void;
    clearAllWeb3(): void;
}

export const Web3Context = createContext<Web3ContextType>(null as any);

export type Web3Item = {
    isPublic: boolean;
    web3: Web3;
}

const PUBLIC_WEB3_MAP = {
    137: {
        isPublic: true,
        web3: new Web3('https://rpc-mainnet.matic.network'),
    },
    250: {
        isPublic: true,
        web3: new Web3('https://rpc.ftm.tools/')
    },
    4002: {
        isPublic: true,
        web3: new Web3('https://rpc.testnet.fantom.network/')
    },
    43114: {
        isPublic: true,
        web3: new Web3('https://api.avax.network/ext/bc/C/rpc')
    }
}

export const Web3Provider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
    const [web3InstanceMap, setWeb3InstanceMap] = useState<typeof PUBLIC_WEB3_MAP>(PUBLIC_WEB3_MAP);

    const getWeb3 = (networkId: number): Web3Item => {
        const web3 = web3InstanceMap[networkId as keyof typeof PUBLIC_WEB3_MAP];
        if (!web3) {
            throw new Error(`Could not resolve web3 instance for network ${networkId}`);
        }
        return web3;
    }

    const setWeb3 = (networkId: number, web3: Web3): void => {
        setWeb3InstanceMap({
            ...web3InstanceMap,
            [networkId]: {
                isPublic: false,
                web3
            }
        });
    }

    const clearWeb3 = (networkId: number) => {
        setWeb3InstanceMap({
            ...web3InstanceMap,
            [networkId]: PUBLIC_WEB3_MAP[networkId as keyof typeof PUBLIC_WEB3_MAP]
        });
    }

    const clearAllWeb3 = () => {
        setWeb3InstanceMap({
            ...PUBLIC_WEB3_MAP
        });
    }

    const contextValue: Web3ContextType = {
        getWeb3,
        setWeb3,
        clearWeb3,
        clearAllWeb3
    }

    return (
        <Web3Context.Provider value={contextValue}>
            {children}
        </Web3Context.Provider>
    );
}