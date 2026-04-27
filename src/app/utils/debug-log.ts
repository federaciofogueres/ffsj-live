export function isFfsjDebugEnabled(): boolean {
    if (!isLocalDeployment()) {
        return false;
    }

    return true;
}

export function ffsjDebugLog(area: string, message: string, data?: unknown): void {
    if (!isFfsjDebugEnabled()) {
        return;
    }

    if (data === undefined) {
        console.info(`[FFSJ ${area}] ${message}`);
        return;
    }

    console.info(`[FFSJ ${area}] ${message}`, data);
}

const FIREBASE_NETWORK_LOG_PREFIX = '### FFSJ_FIREBASE_NETWORK_ACCESS ###';
const FIREBASE_NETWORK_DEBUG_KEY = 'ffsj-live.firebaseNetworkDebug';
const loggedFirebaseResources = new Set<string>();

export function installFirebaseNetworkDebugLogger(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined' || !isLocalDeployment()) {
        return;
    }

    if ((window as any).__ffsjFirebaseNetworkDebugLoggerInstalled) {
        return;
    }
    (window as any).__ffsjFirebaseNetworkDebugLoggerInstalled = true;

    const logResource = (entry: PerformanceResourceTiming): void => {
        if (localStorage.getItem(FIREBASE_NETWORK_DEBUG_KEY) !== 'true') {
            return;
        }

        const resourceInfo = classifyFirebaseResource(entry.name);
        if (!resourceInfo) {
            return;
        }

        const resourceKey = `${entry.name}|${entry.startTime}|${entry.transferSize}`;
        if (loggedFirebaseResources.has(resourceKey)) {
            return;
        }
        loggedFirebaseResources.add(resourceKey);

        console.warn(FIREBASE_NETWORK_LOG_PREFIX, {
            service: resourceInfo.service,
            impactsStorageNetworkTransfer: resourceInfo.impactsStorageNetworkTransfer,
            initiatorType: entry.initiatorType,
            url: entry.name,
            transferSize: entry.transferSize,
            encodedBodySize: entry.encodedBodySize,
            decodedBodySize: entry.decodedBodySize,
            duration: Math.round(entry.duration),
            timestamp: new Date().toISOString()
        });
    };

    performance
        .getEntriesByType('resource')
        .filter((entry): entry is PerformanceResourceTiming => entry instanceof PerformanceResourceTiming)
        .forEach(logResource);

    const observer = new PerformanceObserver((list) => {
        list
            .getEntries()
            .filter((entry): entry is PerformanceResourceTiming => entry instanceof PerformanceResourceTiming)
            .forEach(logResource);
    });

    observer.observe({ type: 'resource', buffered: true });
}

function isLocalDeployment(): boolean {
    if (typeof location === 'undefined') {
        return false;
    }

    return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}

function classifyFirebaseResource(url: string): { service: string; impactsStorageNetworkTransfer: boolean } | null {
    let hostname = '';
    try {
        hostname = new URL(url).hostname;
    } catch {
        return null;
    }

    if (hostname === 'firebasestorage.googleapis.com' || hostname.endsWith('.firebasestorage.googleapis.com')) {
        return { service: 'firebase-storage', impactsStorageNetworkTransfer: true };
    }

    if (hostname === 'storage.googleapis.com' || hostname.endsWith('.storage.googleapis.com')) {
        return { service: 'google-cloud-storage', impactsStorageNetworkTransfer: true };
    }

    if (hostname.endsWith('.firebaseio.com')) {
        return { service: 'firebase-realtime-database', impactsStorageNetworkTransfer: false };
    }

    if (hostname === 'firestore.googleapis.com') {
        return { service: 'firestore', impactsStorageNetworkTransfer: false };
    }

    if (hostname === 'identitytoolkit.googleapis.com' || hostname === 'securetoken.googleapis.com') {
        return { service: 'firebase-auth', impactsStorageNetworkTransfer: false };
    }

    return null;
}
