import { useEffect, useRef, useState } from 'react'

function useInterval(callback: () => void, delay: number | null): () => void {
    const savedCallback = useRef(callback)
    const [resetCounter, setResetCounter] = useState(0);

    // Remember the latest callback if it changes.
    useEffect(() => {
        savedCallback.current = callback
    }, [callback])

    // Set up the interval.
    useEffect(() => {
        // Don't schedule if no delay is specified.
        // Note: 0 is a valid value for delay.
        if (!delay && delay !== 0) {
            return
        }

        const id = setInterval(() => savedCallback.current(), delay)

        return () => clearInterval(id)
    }, [delay, resetCounter]);

    return () => {
        setResetCounter(resetCounter + 1);
    }
}

export default useInterval;