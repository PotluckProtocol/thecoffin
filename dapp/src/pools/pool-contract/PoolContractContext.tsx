import { BigNumber, ethers } from "ethers";
import React, { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import useUser from "../../account/useUser";
import { CaveCompounderContext } from "../../components/CaveCompounderToolkit/context/caveCompounderContext";
import useInterval from "../../hooks/useInterval";
import { weiToNumeric } from "../../utils/weiToNumeric";
import { PoolBaseInfo } from "../PoolBaseInfo";
import { abi } from "./abi";
import { PoolContractWrapper } from "./PoolContractWrapper";

export type PoolState = 'NotResolved' | 'NotStarted' | 'Active';

export type PoolContractContextType = {
    isInitialized: boolean;
    walletTokenIds: number[];
    isLoadingTokenIds: boolean;
    isStaking: boolean;
    isUnstaking: boolean;
    totalEarned: number | null;
    poolState: PoolState;
    isCountingEarnedTotal: boolean;
    blockRewardPerStakedNft: number;
    blockRewardsEndsInBlock: number;
    totalStaked: number;
    isHarvesting: boolean;
    harvest(): Promise<void>;
    init(poolBaseInfo: PoolBaseInfo): void;
    retrieveTokenIds(): Promise<void>;
    stakeNfts(tokenIds: number[]): Promise<void>;
    unstakeNfts(tokenIds: number[]): Promise<void>;
    retrieveTotalEarned(): Promise<void>;
}

export const PoolContractContext = createContext<PoolContractContextType>(null as any);

export const PoolContractProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
    const caveCompounderContext = useContext(CaveCompounderContext);
    const [poolBaseInfo, setPoolBaseInfo] = useState<PoolBaseInfo>();
    const [isInitialized, setIsInitialized] = useState(false);
    const [wrapper, setWrapper] = useState<PoolContractWrapper>();
    const [walletTokenIds, setWalletTokenIds] = useState<number[]>([]);
    const [isLoadingTokenIds, setIsLoadingTokenIds] = useState(false);
    const [isStaking, setIsStaking] = useState(false);
    const [isUnstaking, setIsUnstaking] = useState(false);
    const [isHarvesting, setIsHarvesting] = useState(false);
    const [totalStaked, setTotalStaked] = useState(0);
    const [poolState, setPoolState] = useState<PoolState>('NotResolved');
    const [blockRewardPerStakedNft, setBlockRewardPerStakedNft] = useState(0);
    const [blockRewardsEndsInBlock, setBlockRewardsEndsInBlock] = useState(0);
    const [totalEarned, setTotalEarned] = useState<null | number>(null);
    const [isCountingEarnedTotal, setIsCountingEarnedTotal] = useState(false);
    const user = useUser();
    const walletAddress = user.account?.walletAddress;

    useEffect(() => {
        if (isInitialized && poolBaseInfo) {
            const contract = new ethers.Contract(poolBaseInfo.poolContractAddress, abi, user.getSignerOrProvider(poolBaseInfo.networkId));
            const wrapper = new PoolContractWrapper(contract);
            setWrapper(wrapper);
            intervalBeat(wrapper);
        }
    }, [isInitialized, user, poolBaseInfo]);

    const _notifyCaveCompounderToolkit = () => {
        caveCompounderContext.retrieveAndWaitForNewBalance(BigNumber.from(caveCompounderContext.lpBalance));
    }

    async function intervalBeat(wrapper: PoolContractWrapper, walletAddress?: string): Promise<void> {
        const promises: [Promise<string>, Promise<boolean>, Promise<number>, Promise<string>?] = [
            wrapper.getTokensPerBlock(),
            wrapper.isPaused(),
            wrapper.getTotalStakedCount()
        ];

        if (walletAddress) {
            promises.push(wrapper.getEarned(walletAddress))
        }

        const [tokensPerBlock, paused, stakedCount, totalEarned] = await Promise.all(promises);
        setTotalStaked(stakedCount);
        setBlockRewardPerStakedNft(weiToNumeric(tokensPerBlock, 18) / stakedCount);
        setPoolState(paused ? 'NotStarted' : 'Active');
        if (typeof totalEarned !== 'undefined') {
            setTotalEarned(weiToNumeric(totalEarned, 18));
        }
    }

    async function retrieveTotalEarned(): Promise<void> {
        if (wrapper && walletAddress) {
            setIsCountingEarnedTotal(true);
            try {
                const totalEarnedWei = await wrapper.getEarned(walletAddress);
                console.log('Total earned', totalEarnedWei, weiToNumeric(totalEarnedWei, 18));
                setTotalEarned(weiToNumeric(totalEarnedWei, 18));
            } finally {
                setIsCountingEarnedTotal(false);
            }
        }
    }

    useInterval(() => {
        if (wrapper) {
            intervalBeat(wrapper, walletAddress);
        }
    }, 5000);

    async function init(poolBaseInfo: PoolBaseInfo): Promise<void> {
        try {
            const contract = new ethers.Contract(poolBaseInfo.poolContractAddress, abi, user.getSignerOrProvider(poolBaseInfo.networkId));
            const wrapper = new PoolContractWrapper(contract);
            await intervalBeat(wrapper);

            const rewardsEndInBlock = await wrapper.getRewardsEndInBlock();

            setWrapper(wrapper);
            setBlockRewardsEndsInBlock(rewardsEndInBlock);
            setPoolBaseInfo(poolBaseInfo);
            setIsInitialized(true);
        } catch (e) {
            console.log('Failed when contacting contract on pool init', e);
            throw e;
        }
    }

    async function retrieveTokenIds(): Promise<void> {
        if (wrapper && walletAddress) {
            setIsLoadingTokenIds(true);
            try {
                const tokenIds = await wrapper.getTokenIds(walletAddress);
                setWalletTokenIds(tokenIds);
            } finally {
                setIsLoadingTokenIds(false);
            }
        }
    }

    async function stakeNfts(tokenIds: number[]): Promise<void> {
        if (wrapper && walletAddress) {
            setIsStaking(true);
            try {
                await wrapper.stakeNfts(walletAddress, tokenIds);
                setWalletTokenIds([...walletTokenIds, ...tokenIds]);
            } finally {
                setIsStaking(false);
            }
        }
    }

    async function unstakeNfts(tokenIds: number[]): Promise<void> {
        if (wrapper && walletAddress) {
            setIsUnstaking(true);
            try {
                await wrapper.unStakeNfts(walletAddress, tokenIds);
                setWalletTokenIds(walletTokenIds.filter(id => !tokenIds.includes(id)));
                _notifyCaveCompounderToolkit();
            } finally {
                setIsUnstaking(false);
            }
        }
    }

    async function harvest(): Promise<void> {
        if (wrapper && walletAddress) {
            setIsHarvesting(true);
            try {
                const tokenIds = await wrapper.getTokenIds(walletAddress);
                await wrapper.harvest(walletAddress, tokenIds);
                _notifyCaveCompounderToolkit();
            } finally {
                setIsHarvesting(false);
            }
        }
    }

    const contextValue: PoolContractContextType = {
        isInitialized,
        walletTokenIds,
        isLoadingTokenIds,
        isStaking,
        isUnstaking,
        totalEarned,
        blockRewardPerStakedNft,
        blockRewardsEndsInBlock,
        totalStaked,
        isCountingEarnedTotal,
        isHarvesting,
        poolState,
        harvest,
        init,
        retrieveTokenIds,
        stakeNfts,
        unstakeNfts,
        retrieveTotalEarned
    }

    return (
        <PoolContractContext.Provider value={contextValue}>
            {children}
        </PoolContractContext.Provider>
    );
}