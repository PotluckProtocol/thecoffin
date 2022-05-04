

const ICON_MAP: { [networkId: number]: string } = {
    // Matic
    137: '/images/network-icons/matic.svg',

    // Fantom
    250: '/images/network-icons/fantom.svg',
    4002: '/images/network-icons/fantom.svg',

    // Avalanche
    43114: '/images/network-icons/avalanche.svg'
}

export type NetworkIconProps = {
    className?: string;
    size?: number,
    networkId: number;
}

export const NetworkIcon: React.FC<NetworkIconProps> = ({
    className,
    networkId,
    size
}) => {
    size = size || 40;

    const imageUrl = ICON_MAP[networkId];
    if (!imageUrl) {
        throw new Error(`Could not resolve icon for network ${networkId}`);
    }

    return (
        <img width={size} className={className} src={imageUrl} />
    );
}