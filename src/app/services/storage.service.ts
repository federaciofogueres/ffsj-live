import { isPlatformBrowser } from '@angular/common';
import { Inject, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ref as dbRef, get, getDatabase, onValue, set } from '@angular/fire/database';
import { collection, doc, Firestore, getDocs, setDoc } from '@angular/fire/firestore';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytesResumable } from '@angular/fire/storage';
import { FfsjAlertService } from 'ffsj-web-components';
import { BehaviorSubject, Observable } from 'rxjs';
import { IRealTimeAdds } from '../model/real-time-config.model';

@Injectable({
    providedIn: 'root'
})
export class FirebaseStorageService {

    private _realtimeDataSubject = new BehaviorSubject<any>(null); // BehaviorSubject para almacenar los datos
    public realtimeData$: Observable<any> = this._realtimeDataSubject.asObservable(); // Observable accesible globalmente
    // private toggleAdsSubscription!: Subscription; // Suscripción para alternar anuncios
    private toggleAdsTimeout!: any; // Timeout para manejar el tiempo de espera
    private isToggling: boolean = false; // Bandera para controlar la ejecución simultánea

    private _firestore = inject(Firestore);
    private _firebaseApp = this._firestore.app;
    private _collection = collection(this._firestore, 'candidatas');
    private _storage = getStorage(this._firebaseApp, 'gs://ffsj-live.firebasestorage.app');


    constructor(
        @Inject(PLATFORM_ID) private platformId: Object,
        private ffsjAlertService: FfsjAlertService
    ) { }

    async setShowAdds(): Promise<void> {
        try {
            // Cancela cualquier timeout activo
            if (this.toggleAdsTimeout) {
                clearTimeout(this.toggleAdsTimeout);
                this.toggleAdsTimeout = null;
            }

            // Obtén la configuración actual de anuncios
            const anunciosConfig: IRealTimeAdds = await this.getRealtimeData('config/anuncios');
            if (!anunciosConfig) {
                this.ffsjAlertService.warning('No se pudo obtener la configuración de anuncios.');
                return;
            }

            // Verifica el estado de activatedAdds
            if (anunciosConfig.activatedAdds === false) {
                this.ffsjAlertService.info('Los anuncios están desactivados debido a activatedAdds.');
                return;
            }

            // Invierte el valor de showAdds y actualiza en Realtime Database
            const newShowAdds = !anunciosConfig.showAdds;
            await this.setRealtimeData('config/anuncios/showAdds', newShowAdds);
            this.ffsjAlertService.info(`Anuncios ${newShowAdds ? 'activados' : 'desactivados'}`);

            // Configura el timeout según el estado de showAdds
            const timeoutDuration = newShowAdds
                ? (anunciosConfig.anuncios?.length || 0) * 5 * 1000 // Tiempo para desactivar
                : (anunciosConfig.timing || 0) * 60 * 1000; // Tiempo para reactivar

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
            const database = getDatabase(this._firebaseApp);
            const reference = dbRef(database, path);
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
        } catch (error) {
            this.ffsjAlertService.danger(`Error listening to Realtime Database at path: ${path}` + String(error));
        }
    }

    updateRealTimeValue(data: any, path: string) {
        this._realtimeDataSubject.next(data);
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(path, JSON.stringify(data));
        } else {
            this.ffsjAlertService.warning('localStorage no está disponible en este entorno.');
        }
    }

    async getRealtimeData(path: string): Promise<any> {
        try {
            const database = getDatabase(this._firebaseApp);
            const reference = dbRef(database, path);
            const snapshot = await get(reference);

            if (snapshot.exists()) {
                return snapshot.val();
            } else {
                this.ffsjAlertService.danger(`No data available at path: ${path}`);
                return null;
            }
        } catch (error) {
            this.ffsjAlertService.danger(`Error fetching data from Realtime Database at path: ${path}` + String(error))
            throw error;
        }
    }

    async setRealtimeData(path: string, data: any): Promise<void> {
        try {
            const database = getDatabase(this._firebaseApp);
            const reference = dbRef(database, path);
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
                    this.ffsjAlertService.danger('Error uploading file -> ' + String(error))
                    reject(error);
                }, () => {
                    getDownloadURL(task.snapshot.ref).then((downloadURL: string) => {
                        resolve(downloadURL);
                    });
                }
            );
        });
    }

    async addAnotation(anotation: any, anotador: string, candidata: string): Promise<void> {
        const path = 'candidatas/2024/anotaciones/' + anotador + '/anotaciones/' + candidata;
        try {
            const anotationData = { anotation, timestamp: new Date() };
            await setDoc(doc(this._firestore, path), anotationData).then((result) => {
                if (localStorage.getItem('candidatasData')) {
                    let storageItem = JSON.parse(localStorage.getItem('candidatasData')!);
                    const anotacionIndex = storageItem.anotaciones.findIndex((anotacion: any) => anotacion.candidata === candidata);
                    if (anotacionIndex !== -1) {
                        storageItem.anotaciones[anotacionIndex] = anotation;
                    }
                    localStorage.setItem('candidatasData', JSON.stringify(storageItem));
                }
            });
            console.log(`Anotation saved at ${path}`);
        } catch (error) {
            console.error(`Failed to save anotation at ${path}:`, error);
        }
    }

    async getCollection(collectionName: string) {
        const colRef = collection(this._firestore, collectionName);
        const snapshot = await getDocs(colRef);
        const docs = snapshot.docs.map(doc => doc.data());
        return docs;
    }

    async addDevideConnection(userId: string, ip: string, deviceInfo: string) {
        const timestamp = new Date().toISOString();
        const newConnection = {
            ip: ip,
            device: deviceInfo,
            timestamp: timestamp
        }
        await setDoc(doc(this._firestore, `/users/${userId}/connections/${timestamp}`), newConnection).then((result) => {
            console.log(result);
        });
    }

    async uploadImage(file: File, path: string): Promise<string | null> {
        try {
            const storageRef = ref(this._storage, `${path}/${file.name}`);
            const uploadTask = await uploadBytesResumable(storageRef, file);
            const downloadURL = await getDownloadURL(uploadTask.ref);
            return downloadURL;
        } catch (error) {
            this.ffsjAlertService.danger('Error al subir la imagen a Firebase Storage:' + String(error))
            return null;
        }
    }

    async deleteImage(url: string): Promise<void> {
        try {
            const storageRef = ref(this._storage, url);
            await deleteObject(storageRef);
            this.ffsjAlertService.success('Imagen eliminada correctamente de Firebase Storage.')
        } catch (error) {
            this.ffsjAlertService.danger('Error al eliminar la imagen de Firebase Storage:' + String(error));
            throw error;
        }
    }

}