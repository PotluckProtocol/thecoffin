import { Network, NETWORKS } from "./Networks";

export const resolveNetwork = (networkData: number | string): Network => {
    const network = NETWORKS.find(n => {
        if (typeof networkData === 'number') {
            return networkData === n.networkId;
        } else if (typeof networkData === 'string') {
            return [
                n.symbol.toLocaleLowerCase(),
                n.name.toLocaleLowerCase()
            ].includes(networkData.toLocaleLowerCase());
        }
    });

    if (!network) {
        throw new Error(`Could not resolve correct network for ${networkData}`);
    }

    return network;
}