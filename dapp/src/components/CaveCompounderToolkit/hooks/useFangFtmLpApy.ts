import { useEffect, useState } from "react";

const API = `https://newapi.potluckprotocol.com/apy/breakdown`;
const VAULT_KEY = "potluck-fang-ftm";

type VaultItem = {
    totalApy: number;
}

export const useFangFtmLpApy = (): null | number => {
    const [apy, setApy] = useState<null | number>(null);

    useEffect(() => {
        const fetchApy = async () => {
            const res = await fetch(API);
            const json = await res.json();
            const vaultItem: VaultItem = json[VAULT_KEY];
            if (vaultItem) {
                setApy(vaultItem.totalApy);
            }
        }
        fetchApy();
    }, []);

    return apy;
}