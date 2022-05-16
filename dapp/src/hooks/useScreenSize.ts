import { useState, useEffect } from 'react';
import throttle from 'lodash/throttle';

export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const getScreenSize = (width: number): ScreenSize => {
    if (width < 640) {
        return 'xs';
    } else if (width < 768) {
        return 'sm';
    } else if (width < 1024) {
        return 'md';
    } else if (width < 1280) {
        return 'lg';
    } else if (width < 1536) {
        return 'xl';
    } else {
        return '2xl';
    }
};

const useScreenSize = (): ScreenSize => {
    const [screenSize, setScreenSize] = useState<ScreenSize>(() => getScreenSize(window.innerWidth));

    useEffect(() => {
        const calcInnerWidth = throttle(function () {
            setScreenSize(getScreenSize(window.innerWidth))
        }, 200);
        window.addEventListener('resize', calcInnerWidth);
        return () => window.removeEventListener('resize', calcInnerWidth);
    }, []);

    return screenSize;
}

export default useScreenSize;