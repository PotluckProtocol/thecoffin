import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import Web3 from 'web3';
import { resolveNetwork } from "../network/resolveNetwork";
import { Web3Context } from "../web3/Web3Context";
import { Account } from "./Account"

export type AccountContextType = {
    account: Account | null;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    isConnecting: boolean;
}

export const AccountContext = createContext<AccountContextType>(null as any);

export const AccountProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {

    const web3Context = useContext(Web3Context);
    const [account, setAccount] = useState<Account | null>(null);
    const [connecting, setConnecting] = useState<boolean>(false);

    useEffect(() => {
        const ethereum = (window as any).ethereum as any;
        if (ethereum && ethereum.isMetaMask) {
            const isConnected = localStorage.getItem('walletState') === 'connected';
            if (isConnected) {
                connect();
            }
        }
    }, []);

    const connect = async () => {

        const isMetaMask = (window as any).ethereum?.isMetaMask;
        if (isMetaMask) {
            setConnecting(true);

            const ethereum = (window as any).ethereum as any;
            const web3Instance = new Web3(ethereum);

            const getNetworkId = async (): Promise<number> => {
                return Number(
                    await ethereum.request({
                        method: "net_version",
                    })
                );
            }

            const updateAccount = async (walletAddress: string, web3: Web3) => {
                const networkId = await getNetworkId();
                setAccount({
                    network: resolveNetwork(networkId),
                    walletAddress,
                    web3
                });
            }

            const [walletAddress] = await ethereum.request({
                method: "eth_requestAccounts",
            }) as string[];

            const networkId = await getNetworkId();

            // Add listeners start
            ethereum.on("accountsChanged", async (walletAddresses: string[]) => {
                if (walletAddresses[0]) {
                    window.location.reload();
                }
            });

            ethereum.on("chainChanged", () => {
                window.location.reload();
            });

            console.log(`Using account: ${walletAddress} (Network: ${networkId})`);

            web3Context.setWeb3(networkId, web3Instance);

            await updateAccount(walletAddress, web3Instance);

            setConnecting(false);

            localStorage.setItem('walletState', 'connected');
        }
    }

    const disconnect = async () => {
        localStorage.removeItem('walletState');
        web3Context.clearAllWeb3();
        setAccount(null);
        window.location.reload();
    }

    const contextValue: AccountContextType = {
        account: account || null,
        isConnecting: connecting,
        connect,
        disconnect
    }

    return (
        <AccountContext.Provider value={contextValue}>
            {children}
        </AccountContext.Provider>
    );
}