import React, { createContext, useState } from "react";

export type Terminology = 'lite' | 'advanced';

export type TerminologyContextType = {
    setTerminology: (terminology: Terminology) => void;
    terminology: Terminology;
}

export const TerminologyContext = createContext<TerminologyContextType>(null as any);

export const TerminologyProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {

    const [terminology, setTerminology] = useState<Terminology>('advanced');

    const terminologyContextValue: TerminologyContextType = {
        terminology,
        setTerminology
    }

    return (
        <TerminologyContext.Provider value={terminologyContextValue}>
            {children}
        </TerminologyContext.Provider>
    )

}
