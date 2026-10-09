export function parsePrice(text: string | null): number {
    if (!text) {
        throw new Error('Cannot parse price from null or empty string');
    }

    const priceText = text.match(/\$(\d+(?:\.\d+)?)/)?.[1];

    if (!priceText) {
        throw new Error('Cannot parse price from string: ' + text);
    }

    return parseFloat(priceText);
}

export function toCents(dollars: number): number {
    return Math.round(dollars * 100);
}