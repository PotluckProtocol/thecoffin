import { useContext } from "react"
import { PoolBaseInfo } from "./PoolBaseInfo";
import { PoolsBaseInfoContext } from "./PoolsBaseInfoContext"

export const useAllPoolsBaseInfo = (): PoolBaseInfo[] => {
    const context = useContext(PoolsBaseInfoContext);
    return context.getAll();
}