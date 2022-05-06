import { ComponentPropsWithoutRef, ReactNode, useContext, useEffect, useState } from "react";
import styled from "styled-components";
import moment from 'moment';
import useUser from "../account/useUser";
import { NFTContractContext } from "../nft-contract/NFTContractContext";
import { PoolContractContext } from "../pools/pool-contract/PoolContractContext";
import { PoolBaseInfo } from "../pools/PoolBaseInfo"
import { PoolPopup } from "./PoolPopup";
import { RoundedButton, RoundedButtonProps } from "./RoundedButton";
import { SimpleItemPair } from "./SimpleItemPair";
import { TextFit } from "./TextFit";
import { Loading } from "./Loading";
import { toast } from "react-toastify";
import { NetworkIcon } from "./NetworkIcon";
import classNames from "classnames";
import { useDaysRemaining } from "../hooks/useDaysRemaining";

export type PoolItemProps = {
    className?: string;
    baseInfo: PoolBaseInfo;
    mode: 'basic' | 'harvest';
}

type ContainerProps = ComponentPropsWithoutRef<'div'> & {
    active: boolean;
}

const Container = styled.div<ContainerProps>`
    width: 250px;
    background-image: url('/images/Coffinbg.png');
    background-size: 100%;
    background-repeat: no-repeat;
    height: 420px;
    margin: 0 auto;

    text-align: center;

    padding-top: 0.7rem;
    padding-left: 0.7rem;
    padding-right: 2.1rem;
    padding-bottom: 2rem;

    position: relative;

    ${props => !props.active && `
    filter: blur(6px);
    opacity: .5;

    &:before {
        content: ' ';
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 999;
    }
    `}
`;

const PoolNotStartedText = styled.div`
    text-align: center;
    font-size: 1rem;
    color: #c9b0da;
    font-weight: 600;
    line-height: 1.25rem;
    padding: 0 1.75rem;
`;

const PoolName = styled(TextFit)`
    text-align: center;
    font-family: Backbones;
    padding: .5rem 2.25rem;
    color: white;
`;

const CoverImageContainer = styled.div`
    position: relative;
    padding: 0 1.5rem;
`;

const CoverImage = styled.img`
    border-radius: 1rem;
    box-shadow: rgb(111, 4, 180) 1px 1px 18px 1px
`;

const InfoContainer = styled.div`
    padding: 0 1.75rem;
    color: white;
    font-size: .9rem;
`;

const HarvestContainer = styled.div`
    color: white;
    font-size: .9rem;
`;

const Button = styled<any>(RoundedButton)`
    background: #d5b9e6;
    background: ${props => props.harvestMode ? 'linear-gradient(180deg,#ffaf8e 0%,#ff7b44 100%)' : 'linear-gradient(180deg, #d5b9e6 0%, #600f89 100%)'};
    font-size: 1rem;
    padding: .25rem 1rem;
    box-shadow: rgba(111, 4, 180, .5) 1px 1px 10px 1px;
    transition: color 350ms ease-in-out, background 350ms ease-in-out;
    &:hover {
        color: white;
    }
    position: absolute;
    bottom: 2.75rem;
    right: calc(50% + .7rem);
    transform: translateX(50%);

    &:disabled {
        background: gray;
        color: black;
        cursor: not-allowed;
    }
`;

const EarnedLabel = styled.div`
    font-size: .8rem;
    line-height: .9rem;
    color: white;
`;

const EarnedAmount = styled.div`
    font-size: 1.3rem;
    line-height: 100%;
    color: white;
    font-weight: 600;
`;

const EarnedSymbol = styled.div`
    font-size: .8rem;
    color: white;
`;

const PositionedNetworkIcon = styled(NetworkIcon)`
    position: absolute;
    top: -0.25rem;
    right: 1.25rem;
`;

const countDailyBlockReward = (blockReward: number, nftCount: number): number => {
    const blockRewardsInDay = (blockReward * 60 * 60 * 24);
    const perStakedNft = blockRewardsInDay;
    return perStakedNft * nftCount;
}

const amountToString = (amount: number): string => {
    let decimals = 4;
    if (amount >= 100) {
        decimals = 0;
    } else if (amount >= 10) {
        decimals = 1;
    } else if (amount >= 1) {
        decimals = 2;
    } else if (amount >= 0.1) {
        decimals = 3;
    }

    return amount.toFixed(decimals);
}

export const PoolItem: React.FC<PoolItemProps> = ({
    className,
    baseInfo,
    mode: rawMode
}) => {
    const user = useUser();
    const nftContractContext = useContext(NFTContractContext);
    const poolContractContext = useContext(PoolContractContext);
    const daysRemaining = useDaysRemaining({
        toBlock: poolContractContext.blockRewardsEndsInBlock,
        networkId: baseInfo.networkId
    })
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const isConnected = !!user.account;

    useEffect(() => {
        const init = async () => {
            poolContractContext.init(baseInfo);
            try {
                await nftContractContext.init({
                    contractAddress: baseInfo.nftContractAddress,
                    networkId: baseInfo.networkId,
                    poolContractAddress: baseInfo.poolContractAddress
                });
            } catch (e) {
                console.log('Init failed', e);
            }
        }

        init();
    }, []);

    useEffect(() => {
        if (poolContractContext.isInitialized && isConnected) {
            poolContractContext.retrieveTokenIds();
            poolContractContext.retrieveTotalEarned();
        }
    }, [poolContractContext.isInitialized, isConnected]);

    if (!nftContractContext.isInitialized) {
        return null;
    }

    let earned: string | undefined;
    if (poolContractContext.totalEarned !== null) {
        earned = amountToString(poolContractContext.totalEarned);
    }

    const hasStake = poolContractContext.walletTokenIds.length > 0;

    let dailyReward = 'TBA';
    if (poolContractContext.totalStaked > 0) {
        dailyReward = '~' + amountToString(
            countDailyBlockReward(poolContractContext.blockRewardPerStakedNft, poolContractContext.walletTokenIds.length || 1)
        );
    }

    const active = rawMode === 'basic' || poolContractContext.walletTokenIds.length > 0;
    const mode = active ? rawMode : 'basic';

    const handleButtonClick = async () => {
        if (mode === 'basic') {
            setIsPopupOpen(true)
        } else {
            try {
                await poolContractContext.harvest();
                toast(`Successfully raided the ${baseInfo.name} grave`, { type: 'success', theme: 'colored' });
            } catch (e) {
                console.log('Harvesting failed', e);
                toast('Harvesting failed', { type: 'error', theme: 'colored' });
            }
        }
    }

    const isInitialized = poolContractContext.isInitialized && nftContractContext.isInitialized;
    let content: ReactNode;
    if (!isInitialized) {
        content = (
            <div className="mt-4">
                <Loading width={80} size={8} />\
            </div>
        );
    } else if (poolContractContext.poolState === 'NotStarted') {
        content = (
            <PoolNotStartedText className="mt-4">
                Waiting the coffin to be filled and closed...
                <br /><br />
                Patience...
            </PoolNotStartedText>
        )
    } else if (mode === 'basic') {
        content = (
            <InfoContainer className="mt-2">
                {hasStake ? (
                    <>
                        <SimpleItemPair
                            className="mb-1"
                            label='Your est. daily reward'
                            value={dailyReward}
                            subValue={baseInfo.rewardTokenSymbol}
                        />
                        <SimpleItemPair
                            className="mb-1"
                            label='Your stake'
                            value={`${poolContractContext.walletTokenIds.length}/${poolContractContext.totalStaked}`}
                        />
                        <SimpleItemPair
                            className="mb-1"
                            label='Days remaining est.'
                            value={daysRemaining?.toString() || ''}
                            subValue={'Days'}
                        />
                    </>
                ) : (
                    <>
                        <SimpleItemPair
                            className="mb-1"
                            label='Estimated daily reward'
                            value={dailyReward}
                            subValue={baseInfo.rewardTokenSymbol}
                        />
                        <SimpleItemPair
                            className="mb-1"
                            label='Total staked'
                            value={`${poolContractContext.totalStaked}`}
                        />
                        <SimpleItemPair
                            className="mb-1"
                            label='Days remaining est.'
                            value={daysRemaining?.toString() || ''}
                            subValue={'Days'}
                        />
                    </>
                )}
            </InfoContainer>
        );
    } else if (mode === 'harvest') {
        content = (
            <HarvestContainer className="mt-4">
                <EarnedLabel >Total earned</EarnedLabel>
                <EarnedAmount>{earned || 0}</EarnedAmount>
                <EarnedSymbol>{baseInfo.rewardTokenSymbol}</EarnedSymbol>
                <SimpleItemPair
                    className="mt-2"
                    label='Days remaining est.'
                    value={daysRemaining?.toString() || ''}
                    subValue={'Days'}
                />
            </HarvestContainer>
        );
    }

    let buttonVisible: boolean = true;
    let buttonDisabled: boolean = false;
    let buttonText: string = 'Open';
    if (!user.account || poolContractContext.poolState === 'NotStarted') {
        buttonVisible = false;
    } else if (mode === 'harvest') {
        buttonText = poolContractContext.isHarvesting ? 'RAIDING...' : 'RAID';
        buttonDisabled = poolContractContext.isHarvesting;
    }

    const buttonClasses = classNames('mt-2', { 'invisible': !buttonVisible });

    return (
        <>
            <Container active={active} className={className}>
                <PoolName className="flex items-center justify-center" height={45}>{baseInfo.name}</PoolName>
                <CoverImageContainer>
                    <PositionedNetworkIcon size={30} networkId={baseInfo.networkId} />
                    <CoverImage src={baseInfo.coverImage} />
                </CoverImageContainer>

                {content}

                {isInitialized && (
                    <Button disabled={buttonDisabled} harvestMode={mode === 'harvest'} className={buttonClasses} onClick={handleButtonClick}>
                        {buttonText}
                    </Button>
                )}
            </Container>

            {isPopupOpen && (
                <PoolPopup
                    poolBaseInfo={baseInfo}
                    onClose={() => setIsPopupOpen(false)}
                />
            )}
        </>
    );
}