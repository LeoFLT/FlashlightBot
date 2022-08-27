export function median (arr: number[]): number {
    if (arr.length === 0)
        return 0;
    
    let copiedArr = [...arr];
    copiedArr.sort((a, b) => a - b);
    const mid = Math.floor(copiedArr.length / 2);

    if (copiedArr.length % 2)
        return copiedArr[mid];
    
    return (copiedArr[mid - 1] + copiedArr[mid]) / 2;
}

export function round (number: number, decimalPlaces: number) {
    return (Math.round(((number + Number.EPSILON) * (10 ** decimalPlaces))) / (10 ** decimalPlaces)).toFixed(decimalPlaces);
}