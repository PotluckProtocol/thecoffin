import textfit from 'textfit';
import { useRef, useEffect, PropsWithChildren } from "react";
import styled from 'styled-components';
import debounce from 'lodash/debounce';

export type TextFitProps = {
    height?: number
    className?: string;
}

const Container = styled.div`
    width: 100%;

    span {
        line-height: 100%;
    }
`;

export const TextFit: React.FC<PropsWithChildren<TextFitProps>> = ({ height, children, className }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timeouts: Array<ReturnType<typeof setTimeout>> = [];

        const fit = () => textfit(ref.current as HTMLElement, { multiLine: true });
        const debouncedFit = debounce(fit, 100);

        if (ref.current) {
            // Really ugly hack
            // Call fit 4 times - just to be sure...
            // to be sure that fitting is done. 
            fit();
            timeouts.push(
                setTimeout(fit, 0),
                setTimeout(fit, 100),
                setTimeout(fit, 500),
                setTimeout(fit, 1000)
            );

            window.addEventListener('resize', debouncedFit);
        }

        return () => {
            timeouts.forEach(timer => clearTimeout(timer));
            window.removeEventListener('resize', debouncedFit);
        }

    }, [children, ref, height]);

    return (
        <Container className={className} ref={ref} style={{ height }}>
            {children}
        </Container>
    );
}