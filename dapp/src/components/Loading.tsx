import styled from "styled-components";

const Spinner = styled.div<LoadingProps>`
    display: inline-block;
    position: relative;
    width: ${props => `${props.width}px`};
    height:  ${props => `${props.width}px`};
 
     div {
        box-sizing: border-box;
        display: block;
        position: absolute;
        width:  ${props => `${props.width - 16}px`};
        height:  ${props => `${props.width - 16}px`};
        margin: 8px;
        border: ${props => `${props.size}px solid`};
        border-radius: 50%;
        animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
        border-color: ${props => `${props.color} transparent transparent transparent`};
    }
    
    div:nth-child(1) {
        animation-delay: -0.30s;
    }
    
    div:nth-child(2) {
        animation-delay: -0.2s;
    }
    
    div:nth-child(3) {
        animation-delay: -0.10s;
    }

    @keyframes lds-ring {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
`;

export type LoadingProps = {
    width: number;
    size?: number;
    color?: string;
}

export const Loading: React.FC<LoadingProps> = ({ color, size, width }) => {
    color = color || '#bd95d3';
    size = size || 12;

    return (
        <Spinner width={width} size={size} color={color}>
            <div /><div /><div />
        </Spinner>
    )
}