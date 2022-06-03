
import { useContext } from "react";
import styled from "styled-components";
import useUser from "../account/useUser";
import { HarvestAllContext } from "../pools/HarvestAllContext";
import { useAllPoolsBaseInfo } from "../pools/useAllPoolsBaseInfo"
import { PoolItemWrapper } from "./PoolItemWrapper";
import { RoundedButton } from "./RoundedButton";

export type ListPoolsProps = {
    mode: 'basic' | 'harvest' | 'ended';
}

type ContainerProps = {
    wrongNetwork: boolean;
}

const Container = styled.div<ContainerProps>`
    position: relative;
    
    ${props => props.wrongNetwork && (`
    &:after {
        position: absolute;
        content: ' ';
        top: 0;
        bottom: 0;
        right: 0;
        left: 0;
        background-color: rgba(0,0,0,.8);
    }
    `)}
`;

const WrongNetworkInfo = styled.div`
    color: white;
    position: absolute;
    font-size: 1.3rem;
    top: 2rem;
    right: 0;
    left: 0;
    bottom: 0;
    text-align: center;
`;

const HarvestAllButton = styled(RoundedButton)`
    background: #d5b9e6;
    background: linear-gradient(180deg,#ffaf8e 0%,#ff7b44 100%);
    font-size: 1rem;
    padding: .25rem 1rem;
    box-shadow: rgba(111, 4, 180, .5) 1px 1px 10px 1px;
    transition: color 350ms ease-in-out, background 350ms ease-in-out;

    &:hover {
        color: white;
    }

    &:disabled {
        background: gray;
        color: black;
        cursor: not-allowed;
    }
`;

export const ListPools: React.FC<ListPoolsProps> = (props) => {
    const allPools = useAllPoolsBaseInfo();
    const user = useUser();
    const harvestAllContext = useContext(HarvestAllContext);
    const wrongNetwork = !!user.account && ![250, 4002].includes(user.account.network.networkId);

    return (
        <div className="relative">

            {props.mode === 'harvest' && (
                <div className="flex justify-center mb-8">
                    <HarvestAllButton onClick={() => harvestAllContext.requestHarvestingAll()}>
                        RAID ALL
                    </HarvestAllButton>
                </div>
            )}

            <Container wrongNetwork={wrongNetwork} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {allPools.map((pool, index) => (
                    <PoolItemWrapper className="mx-auto"
                        key={index}
                        baseInfo={pool}
                        mode={props.mode}
                    />
                ))}
            </Container>
            {wrongNetwork && (
                <WrongNetworkInfo>
                    Currently only Fantom Opera supported. Please change your network.
                </WrongNetworkInfo>
            )}
        </div>
    )

}