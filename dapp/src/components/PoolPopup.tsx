import { MouseEventHandler, ReactNode, useContext, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import styled, { CSSProperties } from "styled-components";
import { PoolBaseInfo } from "../pools/PoolBaseInfo";
import { ButtonGroup, GroupButton } from "./ButtonGroup";
import { RoundedButton } from "./RoundedButton";
import { SelectTokens } from "./SelectTokens";
import { TextFit } from "./TextFit";
import { FiXCircle } from 'react-icons/fi';
import { NFTContractContext } from "../nft-contract/NFTContractContext";
import { PoolContractContext } from "../pools/pool-contract/PoolContractContext";
import { Loading } from "./Loading";
import { toast } from "react-toastify";

export type PoolPopupProps = {
    poolBaseInfo: PoolBaseInfo;
    isFinishedPool?: boolean;
    onClose: () => void;
}

const Backdrop = styled.div`
    max-height: 100%;
    overflow-y: auto;
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 8998;
    background-color: rgba(0,0,0,0.90);
`;

const Container = styled.div`
    position: relative;
    text-align: center;
    max-width: 428px;
    width: 95%;
    border: .4rem solid #8e5eb0;
    background-color: #210034;
    border-radius: 2rem;
    box-shadow: rgb(111,4,180) 1px 1px 18px 1px;
`;

const PoolName = styled(TextFit)`
    font-family: Backbones;
    padding: 0 2rem;
    color: white;
`;

const Paragraph = styled.p`
    text-align: center;
    color: white;
    font-size: .8rem;
`;

const StakingContainer = styled.div`
    padding: 1rem 2rem;
`;

const UnstakingContainer = styled.div`
    padding: 1rem 2rem;
`;

const ActionButton = styled(RoundedButton)`
    background: linear-gradient(180deg, #d5b9e6 0%, #600f89 100%);
    padding: .5rem 1rem;
    font-size: 1rem;
    font-weight: 600;

    :disabled {
        opacity: .6;
        color: #bbb;
        cursor: not-allowed;
    }
`;

const CloseButton = styled.button`
    border: none;
    background: none;
    position: absolute;
    width: 30px;
    height: 30px;
    top: .5rem;
    right: .5rem;
    color: white;
`;

const LoadingText = styled.div`
    color: #fff;
    font-size: 1.1rem;
`;

const buttonStyle: CSSProperties = {
    border: '2px solid #600f89',
    padding: '.2rem 1rem',
    fontWeight: 600,
    fontSize: '1rem',
    color: '#d5b9e6'
}

const activeButtonStyle: CSSProperties = {
    background: 'linear-gradient(180deg, #d5b9e6 0%, #600f89 100%)',
    color: "black"
}

const RewardsEndedInfo = styled.p`
    color: white;
    font-size: .9rem;
`;

export const PoolPopup: React.FC<PoolPopupProps> = ({
    poolBaseInfo,
    onClose,
    isFinishedPool
}) => {
    const backdropRef = useRef(null);
    const nftContractContext = useContext(NFTContractContext);
    const poolContractContext = useContext(PoolContractContext);

    const [isLoadingWalletTokens, setIsLoadingWalletTokens] = useState(false);

    const [selectedView, setSelectedView] = useState<string>(isFinishedPool ? 'unstake' : 'stake');
    const [selectedTokens, setSelectedTokens] = useState<number[]>([]);

    useEffect(() => {
        if (nftContractContext.isInitialized && !nftContractContext.walletTokenIdsInited) {
            const load = async () => {
                setIsLoadingWalletTokens(true);
                try {
                    await nftContractContext.refreshTokenIds();
                } finally {
                    setIsLoadingWalletTokens(false);
                }
            }

            load();
        }
    }, []);

    useEffect(() => {
        if (poolContractContext.isInitialized) {
            const load = async () => {
                await poolContractContext.retrieveTokenIds();
            }
            load();
        }
    }, [poolContractContext.isInitialized]);

    const buttonGroupButtons: GroupButton[] = [{
        text: 'Bury them',
        value: 'stake',
        active: selectedView === 'stake'
    }, {
        text: 'Dig them out',
        value: 'unstake',
        active: selectedView === 'unstake'
    }];

    const handleBackdropClick: MouseEventHandler<HTMLDivElement> = (event) => {
        if (event.target === backdropRef.current) {
            onClose();
        }
    }

    const handleSelectView = (btn: GroupButton) => {
        setSelectedTokens([]);
        setSelectedView(btn.value);
    }

    let viewContent: ReactNode;
    if (selectedView === 'stake') {
        const handleStakeButtonClick = async () => {
            if (nftContractContext.walletIsApproved) {
                try {
                    await poolContractContext.stakeNfts(selectedTokens);
                    nftContractContext.removeTokenIdsFromSession(selectedTokens);
                    toast(`Successfully buried (staked) ${selectedTokens.length} tokens.`, { type: 'success', theme: 'colored' });
                } catch (e) {
                    console.log('Error on staking', e);
                    toast('Staking failed', { type: 'error', theme: 'colored' });
                }
                setSelectedTokens([]);
            } else {
                await nftContractContext.approve();
            }
        }

        let buttonDisabled: boolean = selectedTokens.length === 0;
        let buttonText: string = 'Bury';
        if (nftContractContext.isApproving) {
            buttonText = 'Approving...';
            buttonDisabled = true;
        } else if (!nftContractContext.walletIsApproved) {
            buttonText = 'Approve';
        } else if (poolContractContext.isStaking) {
            buttonText = 'Burying...';
            buttonDisabled = true;
        }

        viewContent = (
            <StakingContainer className='mt-4'>
                {isLoadingWalletTokens ? (
                    <>
                        <LoadingText>Loading tokens from your wallet...</LoadingText>
                        <Loading width={85} />
                    </>
                ) : (
                    <>
                        <Paragraph className='mb-2'>You have <b>{nftContractContext.walletBalance}</b> tokens to be buried. Which ones to bury?</Paragraph>

                        <SelectTokens
                            tokens={nftContractContext.walletTokenIds}
                            selectedTokens={selectedTokens}
                            onChange={tokens => setSelectedTokens(tokens)}
                            maxSelected={10}
                        />

                        <Paragraph className='mt-2 mb-4'>You have selected <b>{selectedTokens.length}</b> tokens...</Paragraph>

                        <ActionButton disabled={buttonDisabled} onClick={handleStakeButtonClick}>
                            {buttonText}
                        </ActionButton>
                    </>
                )}
            </StakingContainer>
        )
    } else {
        const buttonDisabled = selectedTokens.length === 0 || poolContractContext.isUnstaking;
        let buttonText = 'Dig';
        if (poolContractContext.isUnstaking) {
            buttonText = 'Shoveling...';
        }

        const handleUnstakeButtonClick = async () => {
            try {
                await poolContractContext.unstakeNfts(selectedTokens);
                nftContractContext.addTokenIdsOnSession(selectedTokens);
                toast(`Successfully dug (unstaked) ${selectedTokens.length} tokens.`, { type: 'success', theme: 'colored' });
            } catch (e) {
                console.log('Error on unstaking', e);
                toast('Unstaking failed', { type: 'error', theme: 'colored' });
            }

            setSelectedTokens([]);
        }

        viewContent = (
            <UnstakingContainer className='mt-4'>
                <Paragraph className='mb-2'>You have buried <b>{poolContractContext.walletTokenIds.length}</b> tokens, select tokens to be dug out...</Paragraph>

                <SelectTokens
                    tokens={poolContractContext.walletTokenIds}
                    selectedTokens={selectedTokens}
                    onChange={tokens => setSelectedTokens(tokens)}
                    maxSelected={10}
                />

                <Paragraph className='mt-2 mb-4'>You have selected <b>{selectedTokens.length}</b> tokens...</Paragraph>

                <ActionButton disabled={buttonDisabled} onClick={handleUnstakeButtonClick}>
                    {buttonText}
                </ActionButton>
            </UnstakingContainer>
        );
    }

    const content: ReactNode = (
        <Backdrop ref={backdropRef} onClick={handleBackdropClick}>
            <Container className="mt-4 sm:mt-12 lg:mt-24 mx-auto p-4">
                <CloseButton onClick={onClose}>
                    <FiXCircle size={30} />
                </CloseButton>
                <PoolName className="flex items-center justify-center mb-4" height={45}>{poolBaseInfo.name}</PoolName>
                {isFinishedPool ? (
                    <RewardsEndedInfo>Pool rewards has been ended. Unharvested rewards are paid on unstake.</RewardsEndedInfo>
                ) : (
                    <>
                        <Paragraph className="mb-2">Your intent?</Paragraph>

                        <ButtonGroup
                            buttons={buttonGroupButtons}
                            buttonStyle={buttonStyle}
                            activeButtonStyle={activeButtonStyle}
                            onSelect={handleSelectView}
                        />
                    </>
                )}

                {viewContent}
            </Container>
        </Backdrop>
    );

    return content;
}