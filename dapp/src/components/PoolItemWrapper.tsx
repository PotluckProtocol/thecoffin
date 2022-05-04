import { NFTContractProvider } from "../nft-contract/NFTContractContext";
import { PoolContractProvider } from "../pools/pool-contract/PoolContractContext";
import { PoolItem, PoolItemProps } from "./PoolItem";

export const PoolItemWrapper: React.FC<PoolItemProps> = (props) => {
    return (
        <NFTContractProvider>
            <PoolContractProvider>
                <PoolItem {...props} />
            </PoolContractProvider>
        </NFTContractProvider>
    )
}