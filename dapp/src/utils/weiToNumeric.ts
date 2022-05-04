export function weiToNumeric(weiCost: number | string, decimals: number): number {
    const costStr = weiCost.toString();
    if (costStr.length >= 18) {
        const fullPart = costStr.substring(0, costStr.length - decimals);
        const decimalPart = costStr.substring(costStr.length - decimals);
        return parseFloat(`${fullPart}.${decimalPart}`);
    } else {
        const parts = costStr.split('');
        while (parts.length < 18) {
            parts.unshift('0');
        }
        return parseFloat(`0.${parts.join('')}`);
    }
}

(window as any).weiToNumeric = weiToNumeric;