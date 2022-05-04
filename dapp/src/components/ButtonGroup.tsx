import styled, { CSSProperties } from "styled-components";
import { RoundedButton } from "./RoundedButton";

export type GroupButton = {
    text: string;
    value: string;
    active?: boolean;
}

export type ButtonGroupProps = {
    className?: string;
    buttonStyle?: CSSProperties;
    activeButtonStyle?: CSSProperties;
    buttons: GroupButton[];
    onSelect: (button: GroupButton) => void;
}

const Container = styled.div`
    button:not(:last-child) {
        border-right: 0 !important;
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
`;

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
    buttonStyle,
    activeButtonStyle,
    className,
    buttons,
    onSelect
}) => {

    buttonStyle = buttonStyle || {};
    activeButtonStyle = activeButtonStyle || {};

    return (
        <Container className={className}>
            {buttons.map(btn => {
                const style: CSSProperties = {
                    ...buttonStyle,
                    ...(btn.active ? activeButtonStyle : {})
                }

                return (
                    <RoundedButton key={btn.value} style={style} onClick={() => onSelect(btn)}>
                        {btn.text}
                    </RoundedButton>
                );
            })}
        </Container>
    );
}