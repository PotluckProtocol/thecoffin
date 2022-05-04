import { useContext } from "react"
import { PoolBaseInfo } from "./PoolBaseInfo";
import { PoolsBaseInfoContext } from "./PoolsBaseInfoContext"

export const usePoolBaseInfo = (poolContractAddress: string): PoolBaseInfo => {
    const context = useContext(PoolsBaseInfoContext);
    const poolBaseInfo = context.getByPoolContractAddress(poolContractAddress);
    if (!poolBaseInfo) {
        throw new Error(`Pool base information for ${poolContractAddress} not initialized`);
    }
    return poolBaseInfo;
}