import { isPlatformBrowser } from '@angular/common';
import { EnvironmentInjector, inject, Injectable, OnDestroy, PLATFORM_ID, runInInjectionContext } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Database, ref as dbRef, get, onValue, runTransaction, set } from '@angular/fire/database';
import { addDoc, collection, doc, Firestore, getDocs, serverTimestamp, setDoc } from '@angular/fire/firestore';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytesResumable } from '@angular/fire/storage';
import { FfsjAlertService } from 'ffsj-web-components';
import { BehaviorSubject, Observable } from 'rxjs';
import { IRealTimeAdds } from '../model/real-time-config.model';

@Injectable({
    providedIn: 'root'
})
export class FirebaseStorageService implements OnDestroy {

    private _realtimeDataSubject = new BehaviorSubject<any>(null);
    public realtimeData$: Observable<any> = this._realtimeDataSubject.asObservable();
    private readonly realtimeCachePrefix = 'ffsj-live.realtimeDataCache.';
    private readonly realtimeCheckpointChild = 'cacheTimestamp';
    private toggleAdsTimeout!: ReturnType<typeof setTimeout> | null;
    private realtimeUnsubscribe: (() => void) | null = null;
    private _injector = inject(EnvironmentInjector);
    private platformId = inject(PLATFORM_ID);
    private _auth = inject(Auth);
    private _database = inject(Database);
    private _firestore = inject(Firestore);
    private _firebaseApp = this._firestore.app;
    private _storage = getStorage(this._firebaseApp, 'gs://ffsj-live.firebasestorage.app');

    constructor(
        private ffsjAlertService: FfsjAlertService
    ) { }

    private isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
    }

    async setShowAdds(): Promise<void> {
        try {
            if (this.toggleAdsTimeout) {
                clearTimeout(this.toggleAdsTimeout);
                this.toggleAdsTimeout = null;
            }

            const anunciosConfig: IRealTimeAdds = await this.getRealtimeData('config/anuncios');
            if (!anunciosConfig) {
                this.ffsjAlertService.warning('No se pudo obtener la configuracion de anuncios.');
                return;
            }

            if (anunciosConfig.activatedAdds === false) {
                this.ffsjAlertService.info('Los anuncios estan desactivados debido a activatedAdds.');
                return;
            }

            const newShowAdds = !anunciosConfig.showAdds;
            await this.setRealtimeData('config/anuncios/showAdds', newShowAdds);
            this.ffsjAlertService.info(`Anuncios ${newShowAdds ? 'activados' : 'desactivados'}`);

            const timeoutDuration = newShowAdds
                ? (anunciosConfig.anuncios?.length || 0) * 5 * 1000
                : (anunciosConfig.timing || 0) * 60 * 1000;

            if (timeoutDuration > 0) {
                this.toggleAdsTimeout = setTimeout(async () => {
                    await this.setShowAdds();
                }, timeoutDuration);
            }
        } catch (error) {
            this.ffsjAlertService.danger('Error al alternar el estado de showAdds: ' + String(error));
        }
    }

    listenToRealtimeData(path: string): void {
        if (!this.isBrowser()) {
            return;
        }

        try {
            this.stopRealtimeListener();
            const cachedData = this.getCachedRealtimeData(path);
            if (cachedData) {
                this.emitRealtimeData(cachedData.data);
            }

            this.realtimeUnsubscribe = runInInjectionContext(this._injector, () => {
                const reference = dbRef(this._database, `${path}/${this.realtimeCheckpointChild}`);
                return onValue(reference, async (snapshot) => {
                    try {
                        const firebaseTimestamp = this.normalizeTimestamp(snapshot.val());
                        const localCachedData = this.getCachedRealtimeData(path);

                        if (localCachedData && firebaseTimestamp > 0 && firebaseTimestamp <= localCachedData.timestamp) {
                            this.emitRealtimeData(localCachedData.data);
                            return;
                        }

                        const data = await this.readRealtimeData(path);
                        if (data !== null) {
                            this.setCachedRealtimeData(path, data, firebaseTimestamp || Date.now());
                            this.emitRealtimeData(data);
                        }
                    } catch (error) {
                        const fallbackCache = this.getCachedRealtimeData(path);
                        if (fallbackCache) {
                            this.emitRealtimeData(fallbackCache.data);
                            return;
                        }

                        console.warn(`No cached data available for path: ${path}`, error);
                        this._realtimeDataSubject.next(null);
                    }
                });
            });
        } catch (error) {
            this.ffsjAlertService.danger(`Error listening to Realtime Database at path: ${path}` + String(error));
        }
    }

    private stopRealtimeListener(): void {
        if (this.realtimeUnsubscribe) {
            this.realtimeUnsubscribe();
            this.realtimeUnsubscribe = null;
        }
    }

    async getRealtimeData(path: string): Promise<any> {
        if (!this.isBrowser()) {
            return null;
        }

        try {
            const data = await this.readRealtimeData(path);
            if (data !== null) {
                return data;
            }

            this.ffsjAlertService.danger(`No data available at path: ${path}`);
            return null;
        } catch (error) {
            this.ffsjAlertService.danger(`Error fetching data from Realtime Database at path: ${path}` + String(error));
            throw error;
        }
    }

    async setRealtimeData(path: string, data: any): Promise<void> {
        if (!this.isBrowser()) {
            return;
        }

        try {
            await runInInjectionContext(this._injector, () => {
                const reference = dbRef(this._database, path);
                return set(reference, data);
            });
            await this.touchRealtimeCheckpoint(path);
            this.ffsjAlertService.success(`Data written successfully at path: ${path}`);
        } catch (error) {
            this.ffsjAlertService.danger(`Error writing data to Realtime Database at path: ${path}` + String(error));
            throw error;
        }
    }

    async setCandidataFavorite(itemId: string, favorite: boolean): Promise<void> {
        if (!this.isBrowser() || !itemId) {
            return;
        }

        const currentConfig = this._realtimeDataSubject.getValue();
        const items = currentConfig?.list?.items;
        if (!Array.isArray(items)) {
            throw new Error('No se pudo localizar el listado de candidatas.');
        }

        const itemIndex = items.findIndex((item: { id?: string }) => item.id === itemId);
        if (itemIndex < 0) {
            throw new Error(`No se encontro la candidata con id ${itemId}.`);
        }
        const item = items[itemIndex];

        const delta = favorite ? 1 : -1;
        const transactionResult = await runInInjectionContext(this._injector, () => {
            const reference = dbRef(this._database, `config/list/items/${itemIndex}/favoriteCount`);
            return runTransaction(reference, (currentValue) => Math.max((Number(currentValue) || 0) + delta, 0));
        });
        this.updateCachedFavoriteCount(itemIndex, Number(transactionResult.snapshot.val()) || 0);
        await this.registerFavoriteMark(item, favorite ? 'marked' : 'unmarked');
    }

    private async readRealtimeData(path: string): Promise<any> {
        const snapshot = await runInInjectionContext(this._injector, () => {
            const reference = dbRef(this._database, path);
            return get(reference);
        });

        return snapshot.exists() ? snapshot.val() : null;
    }

    private emitRealtimeData(data: any): void {
        if (JSON.stringify(this._realtimeDataSubject.getValue()) !== JSON.stringify(data)) {
            this._realtimeDataSubject.next(data);
        }
    }

    private getCachedRealtimeData(path: string): { timestamp: number; data: any } | null {
        if (!this.isBrowser()) {
            return null;
        }

        try {
            const rawValue = localStorage.getItem(this.getRealtimeCacheKey(path));
            if (!rawValue) {
                return null;
            }

            const parsedValue = JSON.parse(rawValue);
            if (!parsedValue || typeof parsedValue.timestamp !== 'number' || parsedValue.data === undefined) {
                return null;
            }

            return parsedValue;
        } catch {
            return null;
        }
    }

    private setCachedRealtimeData(path: string, data: any, timestamp: number): void {
        if (!this.isBrowser()) {
            return;
        }

        localStorage.setItem(this.getRealtimeCacheKey(path), JSON.stringify({ timestamp, data }));
    }

    private getRealtimeCacheKey(path: string): string {
        return `${this.realtimeCachePrefix}${path}`;
    }

    private normalizeTimestamp(value: unknown): number {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === 'string') {
            const numericValue = Number(value);
            if (Number.isFinite(numericValue)) {
                return numericValue;
            }

            const parsedDate = Date.parse(value);
            if (Number.isFinite(parsedDate)) {
                return parsedDate;
            }
        }

        return 0;
    }

    private updateCachedFavoriteCount(itemIndex: number, favoriteCount: number): void {
        const currentConfig = this._realtimeDataSubject.getValue();
        const items = currentConfig?.list?.items;
        if (!Array.isArray(items) || !items[itemIndex]) {
            return;
        }

        const nextConfig = {
            ...currentConfig,
            list: {
                ...currentConfig.list,
                items: items.map((item: any, index: number) =>
                    index === itemIndex ? { ...item, favoriteCount } : item
                )
            }
        };

        const cachedConfig = this.getCachedRealtimeData('config');
        this.setCachedRealtimeData('config', nextConfig, cachedConfig?.timestamp || Date.now());
        this.emitRealtimeData(nextConfig);
    }

    private async touchRealtimeCheckpoint(path: string): Promise<void> {
        const rootPath = path.split('/')[0];
        if (!rootPath || path === `${rootPath}/${this.realtimeCheckpointChild}`) {
            return;
        }

        await runInInjectionContext(this._injector, () => {
            const reference = dbRef(this._database, `${rootPath}/${this.realtimeCheckpointChild}`);
            return set(reference, Date.now());
        });
    }

    private async registerFavoriteMark(item: {
        id: string;
        informacionPersonal?: { nombre?: string };
        vidaEnFogueres?: { asociacion_label?: string; asociacion_order?: number };
    }, action: 'marked' | 'unmarked'): Promise<void> {
        const user = this._auth.currentUser;
        const visitorId = this.getVisitorId();

        await runInInjectionContext(this._injector, () => addDoc(collection(this._firestore, 'candidataFavoriteMarks'), {
            action,
            candidataId: item.id,
            candidataNombre: item.informacionPersonal?.nombre || '',
            asociacion: item.vidaEnFogueres?.asociacion_label || '',
            asociacionOrder: item.vidaEnFogueres?.asociacion_order ?? null,
            firebaseUid: user?.uid || null,
            firebaseAnonymous: user?.isAnonymous ?? true,
            visitorId,
            createdAt: serverTimestamp(),
            clientTimestamp: new Date().toISOString()
        }));
    }

    private getVisitorId(): string {
        const storageKey = 'ffsj-live.visitorId';

        if (!this.isBrowser()) {
            return 'server';
        }

        const existingId = localStorage.getItem(storageKey);
        if (existingId) {
            return existingId;
        }

        const visitorId = crypto.randomUUID();
        localStorage.setItem(storageKey, visitorId);
        return visitorId;
    }

    uploadFile(filePath: string, file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const fileRef = ref(this._storage, filePath);
            const task = uploadBytesResumable(fileRef, file);

            task.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    this.ffsjAlertService.info(`Upload is ${progress}% done`);
                    switch (snapshot.state) {
                        case 'paused':
                            this.ffsjAlertService.info('Upload is paused');
                            break;
                        case 'running':
                            this.ffsjAlertService.info('Upload is running');
                            break;
                    }
                }, (error) => {
                    this.ffsjAlertService.danger('Error uploading file -> ' + String(error));
                    reject(error);
                }, () => {
                    getDownloadURL(task.snapshot.ref).then((downloadURL: string) => {
                        resolve(downloadURL);
                    });
                }
            );
        });
    }

    async getCollection(collectionName: string) {
        const colRef = collection(this._firestore, collectionName);
        const snapshot = await getDocs(colRef);
        const docs = snapshot.docs.map(docEntry => docEntry.data());
        return docs;
    }

    async addDevideConnection(userId: string, ip: string, deviceInfo: string) {
        const timestamp = new Date().toISOString();
        const newConnection = {
            ip: ip,
            device: deviceInfo,
            timestamp: timestamp
        };
        await setDoc(doc(this._firestore, `/users/${userId}/connections/${timestamp}`), newConnection);
    }

    async uploadImage(file: File, path: string): Promise<string | null> {
        try {
            const storageRef = ref(this._storage, `${path}/${file.name}`);
            const uploadTask = await uploadBytesResumable(storageRef, file);
            const downloadURL = await getDownloadURL(uploadTask.ref);
            return downloadURL;
        } catch (error) {
            this.ffsjAlertService.danger('Error al subir la imagen a Firebase Storage:' + String(error));
            return null;
        }
    }

    async deleteImage(url: string): Promise<void> {
        try {
            const storageRef = ref(this._storage, url);
            await deleteObject(storageRef);
            this.ffsjAlertService.success('Imagen eliminada correctamente de Firebase Storage.');
        } catch (error) {
            this.ffsjAlertService.danger('Error al eliminar la imagen de Firebase Storage:' + String(error));
            throw error;
        }
    }

    ngOnDestroy(): void {
        this.stopRealtimeListener();
        if (this.toggleAdsTimeout) {
            clearTimeout(this.toggleAdsTimeout);
            this.toggleAdsTimeout = null;
        }
    }

}
