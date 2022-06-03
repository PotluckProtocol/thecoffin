import { createContext, PropsWithChildren, useState } from "react";

export type HarvestAllContextType = {
    requestHarvestingAll: () => void;
    register: (poolContract: string, handler: () => void) => void;
    unregister: (poolContract: string) => void;
}

export const HarvestAllContext = createContext<HarvestAllContextType>(null as any);

export const HarvestAllProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {

    const [handlerMap, setHandlerMap] = useState<{ [key: string]: () => void }>({});

    const contextValue: HarvestAllContextType = {
        requestHarvestingAll: () => {
            const handlers = Object.values(handlerMap);
            for (const handler of handlers) {
                handler();
            }
        },
        register: (poolContract: string, handler: () => void) => {
            setHandlerMap({ ...handlerMap, [poolContract]: handler });
        },
        unregister: (poolContract: string) => {
            const map = { ...handlerMap };
            delete map[poolContract];
            setHandlerMap(map);
        }

    }

    return (
        <HarvestAllContext.Provider value={contextValue}>
            {children}
        </HarvestAllContext.Provider>
    );
}