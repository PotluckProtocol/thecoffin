import styled from "styled-components";

export type RoundedButtonProps = React.ComponentPropsWithRef<'button'>;

export const RoundedButton = styled.button`
    border-radius: 2rem;
    font-size: 1.3rem;
    line-height: 1.3rem;
    font-weight: 600;
    padding: .5rem 0;
`;