import classNames from "classnames";
import styled from "styled-components";

export type SimpleItemPairProps = {
    label: string;
    value: string;
    subValue?: string;
    className?: string;
}

const Label = styled.div`
    font-size: .7rem;
`;

const Container = styled.div`
    line-height: 1.1rem;
`;

const Value = styled.div`
    font-weight: 600;
    color: #d5c3e1;
`;

const SubValue = styled.div`
    font-size: .6rem;
`;

export const SimpleItemPair: React.FC<SimpleItemPairProps> = ({
    label,
    value,
    subValue,
    className
}) => {

    const classes = classNames('text-center', className);

    return (
        <Container className={classes}>
            <Label>{label}</Label>
            <div className="flex justify-center items-center">
                <Value>{value}</Value>
                {subValue && (<>&nbsp;<SubValue>{subValue}</SubValue></>)}
            </div>
        </Container>
    )
}