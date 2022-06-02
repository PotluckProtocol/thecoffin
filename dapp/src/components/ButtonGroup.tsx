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

const defaultButtonStyle: CSSProperties = {
    border: '2px solid #600f89',
    padding: '.2rem 1rem',
    fontWeight: 600,
    fontSize: '1rem',
    color: '#d5b9e6'
}

const defaultActiveButtonStyle: CSSProperties = {
    background: 'linear-gradient(180deg, #d5b9e6 0%, #600f89 100%)',
    backgroundColor: 'none',
    color: "black"
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
    buttonStyle,
    activeButtonStyle,
    className,
    buttons,
    onSelect
}) => {
    const mergedButtonStyle = { ...defaultButtonStyle, ...(buttonStyle || {}) };
    const mergedActiveButtonStyle = { ...defaultActiveButtonStyle, ...(activeButtonStyle || {}) };

    return (
        <Container className={className}>
            {buttons.map(btn => {
                const style: CSSProperties = {
                    ...mergedButtonStyle,
                    ...(btn.active ? mergedActiveButtonStyle : {})
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