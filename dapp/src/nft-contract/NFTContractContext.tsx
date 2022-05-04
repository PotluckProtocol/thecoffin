import { uniq } from "lodash";
import React, { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import Web3 from "web3";
import useAccount from "../account/useAccount";
import { PoolBaseInfo } from "../pools/PoolBaseInfo";
import { Web3Context } from "../web3/Web3Context";
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

    const account = useAccount();
    const web3Context = useContext(Web3Context);
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

    const walletAddress = account?.walletAddress;

    useEffect(() => {


        if (isInitialized && walletAddress && nftContractAddress && networkId) {
            let web3: Web3;


            if (account && account.network.networkId === networkId) {
                console.log('NFT Web3: Account');
                web3 = account.web3;
            } else {
                console.log('Web3: Public')
                web3 = web3Context.getWeb3(networkId).web3;
            }
            const contract = new web3.eth.Contract(abi, nftContractAddress);
            const wrapper = new NFTContractWrapper(contract);
            setWrapper(wrapper);
        }
    }, [isInitialized, walletAddress]);


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

        let web3: Web3;
        if (account && account.network.networkId === networkId) {
            console.log('NFT Web3: Account');
            web3 = account.web3;
        } else {
            console.log('Web3: Public')
            web3 = web3Context.getWeb3(networkId).web3;
        }

        const contract = new web3.eth.Contract(abi, contractAddress);
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