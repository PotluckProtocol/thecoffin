import { useContext } from "react";
import styled from "styled-components";
import { AccountContext } from "../account/AccountContext";
import { NetworkIcon } from "./NetworkIcon";
import { RoundedButton, RoundedButtonProps } from "./RoundedButton";

const toShortWallet = (walletAddr: string): string => {
    return [
        walletAddr.substring(0, 4),
        walletAddr.substring(walletAddr.length - 4)
    ].join('...');
}

type ButtonGroupProps = {
    singleMode: boolean;
}

const ConnectButton = styled(RoundedButton)`
    ${(props: any) => props.shadow && `box-shadow: #43b8b8 0px 0px 10px 2px;`}
    background-color: #000;
    color: #fff;
    display: block;
    padding: .3rem .7rem;
    font-size: 1rem;
    line-height: 25px;
`;

const NetworkButton = styled(ConnectButton)`
    padding: .3rem .5rem .3rem 0; 
`;

const ButtonGroup = styled.div<ButtonGroupProps>`
    ${props => (!props.singleMode) && `
        button:not(:last-child) {
            border-right: 0;
        }

        button:first-child {
            border-top-right-radius: 0;
            border-bottom-right-radius: 0; 
        }

        button:last-child {
            border-right: inherit;
            border-top-left-radius: 0;
            border-bottom-left-radius: 0; 
        }
    `}
`;

export const ConnectWalletButton: React.FC = () => {
    const accountContext = useContext(AccountContext);

    const handleButtonClick = () => {
        if (accountContext.account) {
            accountContext.disconnect();
        } else {
            accountContext.connect();
        }
    }

    let connectButtonText = 'Connect Wallet';
    if (accountContext.isConnecting) {
        connectButtonText = 'Connecting...';
    } else if (!!accountContext.account) {
        connectButtonText = toShortWallet(accountContext.account.walletAddress);
    }

    // Single button mode if there is no account connected
    const useSingleButtonMode = !accountContext.account;

    const anyProps: any = { shadow: useSingleButtonMode }

    return (
        <div>
            <ButtonGroup singleMode={useSingleButtonMode} className="flex justify-center items-center">
                <ConnectButton onClick={handleButtonClick} {...anyProps}>
                    {connectButtonText}
                </ConnectButton>
                {(!!accountContext.account) && (
                    <NetworkButton>
                        <NetworkIcon networkId={accountContext.account.network.networkId} size={25} />
                    </NetworkButton>
                )}
            </ButtonGroup>
        </div>
    )
}