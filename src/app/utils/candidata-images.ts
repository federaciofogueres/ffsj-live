const BASE_URL_IMAGES = 'https://staticfoguerapp.hogueras.es/CANDIDATAS';
const DEFAULT_IMAGE = `${BASE_URL_IMAGES}/default.png`;

export function resolveCandidataImage(
    explicitUrl: string | undefined,
    tipoCandidata: string | undefined,
    asociacionOrder: number | undefined,
    variant: 'belleza' | 'calle'
): string {
    const trimmedUrl = String(explicitUrl || '').trim();
    if (trimmedUrl) {
        return trimmedUrl;
    }

    if (!tipoCandidata || asociacionOrder === undefined || asociacionOrder === null) {
        return DEFAULT_IMAGE;
    }

    return `${BASE_URL_IMAGES}/${variant}/${tipoCandidata}/${asociacionOrder}.jpg`;
}

export function getDefaultCandidataImage(): string {
    return DEFAULT_IMAGE;
}
