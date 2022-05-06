import { useEffect, useState } from "react";
import useUser from "../account/useUser";

export type UseDaysRemainingProps = {
    toBlock: number;
    networkId: number;
}

const AVERAGE_BLOCKTIMES_MS: { [networkId: number]: number } = {
    250: 1100
}

const getAverageBlocktime = (networkId: number): number => {
    if (!AVERAGE_BLOCKTIMES_MS[networkId]) {
        throw new Error(`No average block time for ${networkId}`)
    }
    return AVERAGE_BLOCKTIMES_MS[networkId];
}

export const useDaysRemaining = ({
    toBlock,
    networkId
}: UseDaysRemainingProps): number | null => {
    const user = useUser();
    const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

    useEffect(() => {
        const run = async () => {
            const provider = user.getProvider(networkId);
            const averageBlockTimeMs = getAverageBlocktime(networkId);
            const blockNum = await provider.getBlockNumber();
            const blocksBetween = Math.max(0, toBlock - blockNum);
            const timeInMs = blocksBetween * averageBlockTimeMs;
            const timeInDays = Math.round(timeInMs / 1000 / 60 / 60 / 24);

            setDaysRemaining(timeInDays);
        }

        run();
    }, [toBlock, networkId]);

    return daysRemaining;
}