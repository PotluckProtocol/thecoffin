import { BigNumber, ethers } from "ethers";
import React, { ReactNode, useContext, useEffect, useState } from "react"
import styled from "styled-components";
import { BiChevronUpSquare, BiChevronDownSquare } from 'react-icons/bi';
import useUser from "../../account/useUser";
import { useERC20Balance } from "../../hooks/useERC20Balance";
import { Loading } from "../Loading";
import { RoundedButton } from "../RoundedButton";
import { CaveCompounderContext } from "./context/caveCompounderContext";
import { useFangFtmLpApy } from "./hooks/useFangFtmLpApy";
import useScreenSize, { ScreenSize } from "../../hooks/useScreenSize";
import { toast } from "react-toastify";

export type CaveCompounderToolkitProps = {
    className?: string;
    requestBalanceRefreshHandle?: number;
}

type ContainerProps = {
    expanded: boolean;
    isSmallScreen: boolean;
}

const getBottom = (isSmallScreen: boolean): string => isSmallScreen ? '-193px' : '-82px';

const Container = styled.div<ContainerProps>`
    padding: .5rem;
    position: fixed;
  
    transition: bottom 350ms ease-in-out;
    bottom: 0;
    color: white;

    bottom: ${props => props.expanded ? '0' : getBottom(props.isSmallScreen)};

    width: 100%;
    max-width: ${props => props.isSmallScreen ? '325px' : '700px'};
    background-color: #210034;
    right: 50%;
    transform: translateX(50%);
    z-index: 100;
    border: .3rem solid #8e5eb0;
    border-bottom: 0;
    border-top-right-radius: 1rem;
    border-top-left-radius: 1rem;
`;

const Item = styled.div`
    text-align: center;
`;


const Label = styled.div`
    font-size: .75rem;
    color: white;
`;

const Value = styled.div`
    color: white;
    font-size: 1.2rem;
    white-space: no-wrap;
    font-weight: 600;
`;

const Token = styled.span`
    color: white;
    font-size: .7rem;
    font-weight: 400;
    margin-left: .2rem;
`;

const TableContainer = styled.div`
    border: .1rem solid #8e5eb0;
    border-radius: 1rem;
`;

const Table = styled.table`
    text-align: left;

    td {
        padding: .5rem 1rem;
    }
`;

const Button = styled(RoundedButton)`
    background: #d5b9e6;
    background: linear-gradient(180deg, #d5b9e6 0%, #600f89 100%);
    font-size: 1rem;
    padding: .25rem 1rem;
    box-shadow: rgba(111, 4, 180, .5) 1px 1px 10px 1px;
    transition: color 350ms ease-in-out, background 350ms ease-in-out;
    color: black;

    &:hover {
        color: white;
        background: rgb(199, 22, 22);
    }

    &:disabled {
        background: gray;
        color: black;
        cursor: not-allowed;
    }
`;

const ExpandButton = styled.button`
    width: 100%;
    position: relative;
`

const IconWrapperLeft = styled.div`
    opacity: .6;
    position: absolute;
    left: 0;
    top: 0;
`;

const IconWrapperRight = styled.div`
    opacity: .6;
    position: absolute;
    right: 0;
    top: 0;
`;

const EXPAND_CHEVRON_SIZE = 25;
const SMALL_SCREENS: ScreenSize[] = ['xs', 'sm', 'md'];

export const CaveCompounderToolkit: React.FC<CaveCompounderToolkitProps> = ({
    className
}) => {
    const screenSize = useScreenSize();
    const isSmallScreen = SMALL_SCREENS.includes(screenSize);
    const [expanded, setExpanded] = useState(isSmallScreen ? false : true);

    const ccContext = useContext(CaveCompounderContext);
    const vaultAPY = useFangFtmLpApy();


    if (!ccContext.isInitialized) {
        return null;
    }

    const handleButtonClick = async () => {
        if (hasApprovedNeeded) {
            try {
                await ccContext.depositAll();
                toast('Deposit successful', { type: 'success', theme: 'colored' });
            } catch (e) {
                toast('Deposit failed', { type: 'error', theme: 'colored' });
            }
        } else {
            try {
                await ccContext.approve();
                toast('Approved successfully', { type: 'success', theme: 'colored' });
            } catch (e) {
                toast('Approving failed', { type: 'error', theme: 'colored' });
            }
        }
    }

    const expandButtonClick = () => {
        setExpanded(!expanded);
    }

    const hasApprovedNeeded = ccContext.allowance.gte(ccContext.lpBalance);
    const apyPercentage = (vaultAPY !== null) ? (vaultAPY * 100).toFixed(2) + '%' : '';

    const buttonDisabled: boolean = ccContext.lpBalance.eq(BigNumber.from(0)) || ccContext.isDepositing || ccContext.isApproving || ccContext.isFetchingBalance;
    let buttonText: string = 'Deposit all';
    if (ccContext.isDepositing) {
        buttonText = 'Depositing...';
    } else if (ccContext.isApproving) {
        buttonText = 'Approving...';
    } else if (!hasApprovedNeeded) {
        buttonText = 'Approve all';
    }

    let content: ReactNode;
    if (isSmallScreen) {
        content = (
            <div>
                <a href="https://thecavecompounder.com" className="block mb-2">
                    <img width="330" className="mx-auto" src="/images/CaveCompounder.png" />
                </a>

                <div className="flex justify-around my-6">
                    <div>
                        <Label>Vault APY%</Label>
                        <Value>{apyPercentage}</Value>
                    </div>
                    <div >
                        <Label>Wallet balance</Label>
                        <Value className="flex items-center">
                            {ccContext.isFetchingBalance
                                ? (<Loading width={29} size={3} />)
                                : (<span>{Number(ethers.utils.formatEther(ccContext.lpBalance)).toFixed(3)}</span>)}
                            <Token>FANG-FTM LP</Token>
                        </Value>
                    </div>
                </div>
                <div className="my-2 text-center">
                    <Button onClick={handleButtonClick} disabled={buttonDisabled}>{buttonText}</Button>
                </div>

            </div>
        );
    } else {
        content = (
            <TableContainer>
                <Table>
                    <tr>
                        <td>
                            <a href="https://thecavecompounder.com">
                                <img width="200" src="/images/CaveCompounder.png" />
                            </a>
                        </td>
                        <td>
                            <Label>Vault APY%</Label>
                            <Value>{apyPercentage}</Value>
                        </td>
                        <td>
                            <Label>Wallet balance</Label>
                            <Value className="flex items-center">
                                {ccContext.isFetchingBalance
                                    ? (<Loading width={29} size={3} />)
                                    : (<span>{Number(ethers.utils.formatEther(ccContext.lpBalance)).toFixed(3)}</span>)}
                                <Token>FANG-FTM LP</Token>
                            </Value>
                        </td>
                        <td>
                            <Button onClick={handleButtonClick} disabled={buttonDisabled}>{buttonText}</Button>
                        </td>
                    </tr>
                </Table>
            </TableContainer>
        );
    }

    return (
        <Container isSmallScreen={isSmallScreen} expanded={expanded} className={className}>

            <div>
                <ExpandButton className="block text-center mb-4 relative" onClick={expandButtonClick}>
                    <IconWrapperLeft>
                        {expanded ? <BiChevronDownSquare size={EXPAND_CHEVRON_SIZE} /> : <BiChevronUpSquare size={EXPAND_CHEVRON_SIZE} />}
                    </IconWrapperLeft>
                    Autocompound your rewards
                    <IconWrapperRight>
                        {expanded ? <BiChevronDownSquare size={EXPAND_CHEVRON_SIZE} /> : <BiChevronUpSquare size={EXPAND_CHEVRON_SIZE} />}
                    </IconWrapperRight>
                </ExpandButton>

                {content}
            </div>

        </Container>
    )
}