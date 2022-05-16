import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import { BigNumber, ethers, utils } from 'ethers';
import useUser from "../../../account/useUser";
import { abi as erc20Abi } from "../../../common-abis/ERC20";
import { abi as vaultAbi } from "../abi/caveCompounderAbi";
import useInterval from "../../../hooks/useInterval";

const NETWORK_ID = 250;
const LP_CONTRACT = "0x871DD566AB3De61E5Cc8fb16fEE82595b17e9cc6";
const FANG_FTM_VAULT_CONTRACT = "0x350b5214dDC88B8A90D4b0dCDE004B711f93Fa7C";

export type CaveCompounderContextType = {
    isInitialized: boolean;
    allowance: BigNumber;
    lpBalance: BigNumber;
    isFetchingBalance: boolean;
    isApproving: boolean;
    isDepositing: boolean;
    init: () => void;
    reset: () => void;
    approve: () => Promise<void>;
    retrieveAllowanceAndBalance(): Promise<void>;
    retrieveAndWaitForNewBalance(oldBalance: BigNumber): Promise<void>;
    depositAll(): Promise<boolean>;
}

export const CaveCompounderContext = createContext<CaveCompounderContextType>(null as any);

export const CaveCompounderProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {

    const [isInitialized, setIsInitialized] = useState(false);
    const [isFetchingBalance, setIsFetchingBalance] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [isDepositing, setIsDepositing] = useState(false);
    const [allowance, setAllowance] = useState<BigNumber>(BigNumber.from(0));
    const [lpBalance, setLpBalance] = useState<BigNumber>(BigNumber.from(0));
    const [erc20Contract, setErc20Contract] = useState<null | ethers.Contract>(null);
    const [vaultContract, setVaultContract] = useState<null | ethers.Contract>(null);
    const user = useUser();

    const _internalGetAllowanceAndBalance = async (
        erc20Contract: ethers.Contract,
        vaultContract: ethers.Contract
    ): Promise<{ allowance: BigNumber, balance: BigNumber }> => {
        const allowance: BigNumber = await erc20Contract.allowance(user.account?.walletAddress, vaultContract.address);
        const balance: BigNumber = await erc20Contract.balanceOf(user.account?.walletAddress);
        setAllowance(allowance);
        setLpBalance(balance);
        return { allowance, balance };
    }

    const init = async () => {
        const providerOrSigner = user.getSignerOrProvider(NETWORK_ID);
        const vaultContract = new ethers.Contract(FANG_FTM_VAULT_CONTRACT, vaultAbi, providerOrSigner);
        const erc20Contract = new ethers.Contract(LP_CONTRACT, erc20Abi, providerOrSigner);

        await _internalGetAllowanceAndBalance(erc20Contract, vaultContract);

        setVaultContract(vaultContract);
        setErc20Contract(erc20Contract);
        setIsInitialized(true);
    }

    const reset = () => {
        setLpBalance(BigNumber.from(0));
        setAllowance(BigNumber.from(0));
        setErc20Contract(null);
        setVaultContract(null);
        setIsInitialized(false);
    }

    const approve = async (): Promise<void> => {
        if (erc20Contract && vaultContract) {
            setIsApproving(true);
            try {
                const { balance } = await _internalGetAllowanceAndBalance(erc20Contract, vaultContract);
                const tx = await erc20Contract.approve(vaultContract.address, BigNumber.from(balance));
                await tx.wait();

                setAllowance(BigNumber.from(balance));
            } catch (e) {
                console.log('Error on approving', e);
            } finally {
                setIsApproving(false);
            }
        }
    }

    const depositAll = async (): Promise<boolean> => {
        if (!vaultContract) {
            return false;
        }

        setIsDepositing(true);
        try {
            const tx = await vaultContract.depositAll();
            await tx.wait();

            // Reload balance on background
            retrieveAndWaitForNewBalance(BigNumber.from(lpBalance));

            return true;
        } catch (e) {
            console.log('Error on depositAll', e);
            return false;
        } finally {
            setIsDepositing(false);
        }
    }

    const retrieveAllowanceAndBalance = async (): Promise<void> => {
        if (erc20Contract && vaultContract) {
            await _internalGetAllowanceAndBalance(erc20Contract, vaultContract);
        }
    }

    const wait = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const retrieveAndWaitForNewBalance = async (oldBalance: BigNumber): Promise<void> => {
        if (!erc20Contract || !vaultContract) {
            return;
        }

        setIsFetchingBalance(true);
        try {
            while (true) {
                const { balance } = await _internalGetAllowanceAndBalance(erc20Contract, vaultContract);
                if (!oldBalance.eq(balance)) {
                    break;
                }
                // Wait 2secs before asking again
                await wait(4000);
            }
        } finally {
            setIsFetchingBalance(false);
        }
    }

    const contextValue: CaveCompounderContextType = {
        approve,
        retrieveAllowanceAndBalance,
        init,
        depositAll,
        reset,
        retrieveAndWaitForNewBalance,
        isInitialized,
        allowance,
        lpBalance,
        isFetchingBalance,
        isApproving,
        isDepositing
    }

    return (
        <CaveCompounderContext.Provider value={contextValue}>
            {children}
        </CaveCompounderContext.Provider>
    );
}