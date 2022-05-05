import { ethers, providers } from "ethers";
import { uniq } from "lodash";
import React, { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import useUser from "../account/useUser";
import { abi } from "./abi";
import { NFTContractWrapper } from "./NFTContractWrapper";

export type InitProps = {
    contractAddress: string;
    poolContractAddress: string;
    networkId: number;
}

export type NFTContractContextType = {
    approve(): Promise<void>;
    init(props: InitProps): Promise<void>;
    refreshTokenIds(): Promise<void>;
    removeTokenIdsFromSession(tokenIds: number[]): void;
    addTokenIdsOnSession(tokenIds: number[]): void;
    isInitialized: boolean;
    isWalletConnected: boolean;
    maxSupply: number;

    walletBalance: number;
    walletTokenIdsInited: boolean;
    walletTokenIds: number[];
    walletIsApproved: boolean;

    isApproving: boolean;
}

export const NFTContractContext = createContext<NFTContractContextType>(null as any);

export const NFTContractProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
    const [wrapper, setWrapper] = useState<NFTContractWrapper | null>(null)
    const [networkId, setNetworkId] = useState<number>();
    const [poolContractAddress, setPoolContractAddress] = useState<string>('');
    const [nftContractAddress, setNftContractAddress] = useState<string>('');
    const [isInitialized, setIsInitialized] = useState(false);
    const [isWalletConnected, setIsWalletConnected] = useState(false);
    const [walletIsApproved, setWalletIsApproved] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [walletTokenIds, setWalletTokenIds] = useState<number[]>([]);
    const [walletTokenIdsInited, setWalletTokenIdsInited] = useState<boolean>(false);
    const [maxSupply, setMaxSupply] = useState<number>(0);
    const user = useUser();

    const walletAddress = user.account?.walletAddress;

    useEffect(() => {
        if (isInitialized && walletAddress && nftContractAddress && networkId) {
            const contract = new ethers.Contract(nftContractAddress, abi, user.getSignerOrProvider(networkId));
            const wrapper = new NFTContractWrapper(contract);
            setWrapper(wrapper);
        }
    }, [isInitialized, user, nftContractAddress, networkId]);


    useEffect(() => {
        if (walletAddress && wrapper) {
            const initConnectedWallet = async () => {
                if (wrapper && walletAddress) {

                    const [walletIsApproved, walletBalance] = await Promise.all([
                        wrapper.getApprovedStatus(walletAddress, poolContractAddress),
                        wrapper.getBalance(walletAddress)
                    ]);

                    setWalletIsApproved(walletIsApproved);
                    setWalletBalance(walletBalance);
                    setWalletTokenIdsInited(false);
                    setIsWalletConnected(true);

                }
            }

            initConnectedWallet()
        } else {
            setIsWalletConnected(false);
        }
    }, [wrapper, walletAddress])

    const init = async (props: InitProps): Promise<void> => {
        const { contractAddress, networkId, poolContractAddress } = props;

        const contract = new ethers.Contract(contractAddress, abi, user.getSignerOrProvider(networkId));
        const wrapper = new NFTContractWrapper(contract);

        const [maxSupply] = await Promise.all([
            wrapper.getMaxSupply()
        ]);

        setMaxSupply(maxSupply);
        setWrapper(wrapper);
        setPoolContractAddress(poolContractAddress);
        setNftContractAddress(contractAddress);
        setNetworkId(networkId);
        setIsInitialized(true);
    }

    const approve = async (): Promise<void> => {
        if (isInitialized && walletAddress && wrapper) {
            setIsApproving(true);
            try {
                await wrapper.approve(walletAddress, poolContractAddress);
                setWalletIsApproved(true);
            } catch (e) {
                console.log('ERROR on approving', e);
            } finally {
                setIsApproving(false);
            }
        }
    }

    const refreshTokenIds = async (): Promise<void> => {
        if (isInitialized && walletAddress && wrapper) {
            const tokenIds = await wrapper.getTokenIds(walletAddress);
            setWalletTokenIds(tokenIds);
            setWalletTokenIdsInited(true);
        }
    }

    const addTokenIdsOnSession = (tokenIds: number[]) => {
        if (walletTokenIdsInited) {
            const newTokenIds = uniq([...walletTokenIds, ...tokenIds]);
            setWalletTokenIds(newTokenIds);
            setWalletBalance(newTokenIds.length);
        }
    }

    const removeTokenIdsFromSession = (tokenIds: number[]) => {
        if (walletTokenIdsInited) {
            const newTokenIds = walletTokenIds.filter(id => !tokenIds.includes(id));
            setWalletTokenIds(newTokenIds);
            setWalletBalance(newTokenIds.length);
        }
    }

    const contextValue: NFTContractContextType = {
        approve,
        init,
        refreshTokenIds,
        removeTokenIdsFromSession,
        addTokenIdsOnSession,

        isInitialized,
        maxSupply,

        isWalletConnected,
        walletBalance,
        walletIsApproved,
        walletTokenIds,
        walletTokenIdsInited,

        isApproving
    }

    return (
        <NFTContractContext.Provider value={contextValue}>
            {children}
        </NFTContractContext.Provider>
    );
}