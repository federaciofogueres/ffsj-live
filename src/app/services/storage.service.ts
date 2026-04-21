import { EnvironmentInjector, inject, Injectable, runInInjectionContext } from '@angular/core';
import { Database, ref as dbRef, get, onValue, set } from '@angular/fire/database';
import { collection, doc, Firestore, getDocs, setDoc } from '@angular/fire/firestore';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytesResumable } from '@angular/fire/storage';
import { FfsjAlertService } from 'ffsj-web-components';
import { BehaviorSubject, Observable } from 'rxjs';
import { IRealTimeAdds } from '../model/real-time-config.model';

@Injectable({
    providedIn: 'root'
})
export class FirebaseStorageService {

    private _realtimeDataSubject = new BehaviorSubject<any>(null);
    public realtimeData$: Observable<any> = this._realtimeDataSubject.asObservable();
    private toggleAdsTimeout!: ReturnType<typeof setTimeout> | null;
    private _injector = inject(EnvironmentInjector);
    private _database = inject(Database);
    private _firestore = inject(Firestore);
    private _firebaseApp = this._firestore.app;
    private _storage = getStorage(this._firebaseApp, 'gs://ffsj-live.firebasestorage.app');

    constructor(
        private ffsjAlertService: FfsjAlertService
    ) { }

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
        try {
            runInInjectionContext(this._injector, () => {
                const reference = dbRef(this._database, path);
                onValue(reference, (snapshot) => {
                    if (snapshot.exists()) {
                        const data = snapshot.val();
                        if (JSON.stringify(this._realtimeDataSubject.getValue()) !== JSON.stringify(data)) {
                            this._realtimeDataSubject.next(data);
                        }
                    } else {
                        console.warn(`No data available at path: ${path}`);
                        this._realtimeDataSubject.next(null);
                    }
                });
            });
        } catch (error) {
            this.ffsjAlertService.danger(`Error listening to Realtime Database at path: ${path}` + String(error));
        }
    }

    async getRealtimeData(path: string): Promise<any> {
        try {
            const reference = runInInjectionContext(this._injector, () => dbRef(this._database, path));
            const snapshot = await get(reference);

            if (snapshot.exists()) {
                return snapshot.val();
            }

            this.ffsjAlertService.danger(`No data available at path: ${path}`);
            return null;
        } catch (error) {
            this.ffsjAlertService.danger(`Error fetching data from Realtime Database at path: ${path}` + String(error));
            throw error;
        }
    }

    async setRealtimeData(path: string, data: any): Promise<void> {
        try {
            const reference = runInInjectionContext(this._injector, () => dbRef(this._database, path));
            await set(reference, data);
            this.ffsjAlertService.success(`Data written successfully at path: ${path}`);
        } catch (error) {
            this.ffsjAlertService.danger(`Error writing data to Realtime Database at path: ${path}` + String(error));
            throw error;
        }
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

}
