import { isPlatformBrowser } from '@angular/common';
import { Inject, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ref as dbRef, get, getDatabase, onValue, set } from '@angular/fire/database';
import { collection, doc, Firestore, getDocs, setDoc } from '@angular/fire/firestore';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from '@angular/fire/storage';
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
    private _storage = getStorage(this._firebaseApp, 'gs://ffsj-form-candidatas.appspot.com');


    constructor(
        @Inject(PLATFORM_ID) private platformId: Object // Inyecta PLATFORM_ID
    ) { }

    async setShowAdds(): Promise<void> {
        try {
            // Verifica si ya hay un timeout activo y lo cancela
            if (this.toggleAdsTimeout) {
                clearTimeout(this.toggleAdsTimeout);
                this.toggleAdsTimeout = null;
            }

            // Obtén la configuración actual de anuncios
            const anunciosConfig: IRealTimeAdds = await this.getRealtimeData('config/anuncios');
            if (!anunciosConfig) {
                console.warn('No se pudo obtener la configuración de anuncios.');
                return;
            }

            const currentShowAdds = anunciosConfig.showAdds;
            const newShowAdds = !currentShowAdds; // Invierte el valor actual

            // Actualiza el valor en Realtime Database
            await this.setRealtimeData('config/anuncios/showAdds', newShowAdds);
            console.log(`Anuncios ${newShowAdds ? 'activados' : 'desactivados'}`);

            if (newShowAdds) {
                // Si se activan los anuncios, calcula el tiempo para desactivarlos
                if (anunciosConfig.anuncios && anunciosConfig.anuncios.length > 0) {
                    const segundosToSetFalse = anunciosConfig.anuncios.length * 5 * 1000; // Convertir a milisegundos

                    // Configura un timeout para desactivar los anuncios
                    this.toggleAdsTimeout = setTimeout(async () => {
                        await this.setShowAdds(); // Llama al método para desactivar los anuncios
                    }, segundosToSetFalse);
                }
            } else {
                // Si se desactivan los anuncios, espera el tiempo definido en 'timing' para reactivarlos
                if (anunciosConfig.timing) {
                    const timing = anunciosConfig.timing * 60 * 1000; // Convertir minutos a milisegundos

                    // Configura un timeout para reactivar los anuncios
                    this.toggleAdsTimeout = setTimeout(async () => {
                        await this.setShowAdds(); // Llama al método para reactivar los anuncios
                    }, timing);
                }
            }
        } catch (error) {
            console.error('Error al alternar el estado de showAdds:', error);
        }
    }

    // async setShowAdds(): Promise<void> {
    //     try {
    //         if (this.isToggling) {
    //             console.warn('El método setShowAdds ya está en ejecución. Ignorando llamada duplicada.');
    //             return; // Evita llamadas duplicadas
    //         }

    //         this.isToggling = true; // Marca el inicio de la ejecución

    //         // Obtén la configuración actual de anuncios
    //         const anunciosConfig: IRealTimeAdds = await this.getRealtimeData('config/anuncios');
    //         const currentShowAdds = anunciosConfig.showAdds;

    //         // Invierte el valor actual de showAdds
    //         const newShowAdds = !currentShowAdds;

    //         // Actualiza el valor en Realtime Database
    //         await this.setRealtimeData('config/anuncios/showAdds', newShowAdds);
    //         console.log(`Anuncios ${newShowAdds ? 'activados' : 'desactivados'}`);

    //         if (newShowAdds) {
    //             // Si se activan los anuncios, calcula el tiempo para desactivarlos
    //             if (anunciosConfig.anuncios && anunciosConfig.anuncios.length > 0) {
    //                 const segundosToSetFalse = anunciosConfig.anuncios.length * 5 * 1000; // Convertir a milisegundos

    //                 // Limpia cualquier timeout previo
    //                 if (this.toggleAdsTimeout) {
    //                     clearTimeout(this.toggleAdsTimeout);
    //                 }

    //                 // Configura un timeout para desactivar los anuncios
    //                 this.toggleAdsTimeout = setTimeout(async () => {
    //                     await this.setShowAdds(); // Llama al método para desactivar los anuncios
    //                 }, segundosToSetFalse);
    //             }
    //         } else {
    //             // Si se desactivan los anuncios, espera el tiempo definido en 'timing' para reactivarlos
    //             if (anunciosConfig.timing) {
    //                 const timing = anunciosConfig.timing * 60 * 1000; // Convertir minutos a milisegundos

    //                 // Limpia cualquier timeout previo
    //                 if (this.toggleAdsTimeout) {
    //                     clearTimeout(this.toggleAdsTimeout);
    //                 }

    //                 // Configura un timeout para reactivar los anuncios
    //                 this.toggleAdsTimeout = setTimeout(async () => {
    //                     await this.setShowAdds(); // Llama al método para reactivar los anuncios
    //                 }, timing);
    //             }
    //         }
    //     } catch (error) {
    //         console.error('Error al alternar el estado de showAdds:', error);
    //     } finally {
    //         this.isToggling = false; // Marca el final de la ejecución
    //     }
    // }

    // toggleAdsAutomatically(): void {
    //     this.getRealtimeData('config/anuncios').then((anunciosConfig) => {
    //         if (anunciosConfig && anunciosConfig.timing) {
    //             const timing = anunciosConfig.timing * 60000; // Convertir a milisegundos

    //             // Detener cualquier suscripción previa
    //             if (this.toggleAdsSubscription) {
    //                 this.toggleAdsSubscription.unsubscribe();
    //             }

    //             // Alternar el estado de los anuncios cada 'timing' segundos
    //             this.toggleAdsSubscription = interval(timing).subscribe(async () => {
    //                 const currentShowAdds = anunciosConfig.showAdds || false;
    //                 const newShowAdds = !currentShowAdds;

    //                 // Actualizar el valor en Realtime Database
    //                 await this.setRealtimeData('config/anuncios/showAdds', newShowAdds);
    //                 console.log(`Anuncios ${newShowAdds ? 'activados' : 'desactivados'}`);

    //                 // Actualizar el valor localmente
    //                 anunciosConfig.showAdds = newShowAdds;
    //             });
    //         } else {
    //             console.warn('No se encontró la configuración de anuncios o el valor de timing.');
    //         }
    //     }).catch((error) => {
    //         console.error('Error al obtener la configuración de anuncios:', error);
    //     });
    // }

    // stopToggleAds(): void {
    //     if (this.toggleAdsSubscription) {
    //         this.toggleAdsSubscription.unsubscribe();
    //         console.log('Alternancia de anuncios detenida.');
    //     }
    // }

    listenToRealtimeData(path: string): void {
        try {
            const database = getDatabase(this._firebaseApp); // Obtén la instancia de Realtime Database
            const reference = dbRef(database, path); // Crea una referencia al path especificado

            // Escucha los cambios en tiempo real
            onValue(reference, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    if (JSON.stringify(this._realtimeDataSubject.getValue()) !== JSON.stringify(data)) {
                        this._realtimeDataSubject.next(data); // Actualiza el BehaviorSubject con los datos nuevos
                    }
                    // this.updateRealTimeValue(data, path);
                } else {
                    console.warn(`No data available at path: ${path}`);
                    this._realtimeDataSubject.next(null); // Actualiza con null si no hay datos
                }
            });
        } catch (error) {
            console.error(`Error listening to Realtime Database at path: ${path}`, error);
        }
    }

    updateRealTimeValue(data: any, path: string) {
        this._realtimeDataSubject.next(data); // Actualiza el BehaviorSubject con los datos nuevos
        if (isPlatformBrowser(this.platformId)) { // Verifica si el código se ejecuta en el navegador
            localStorage.setItem(path, JSON.stringify(data));
        } else {
            console.warn('localStorage no está disponible en este entorno.');
        }
    }

    async getRealtimeData(path: string): Promise<any> {
        try {
            const database = getDatabase(this._firebaseApp); // Obtén la instancia de Realtime Database
            const reference = dbRef(database, path); // Crea una referencia al path especificado
            const snapshot = await get(reference); // Obtén los datos del path

            if (snapshot.exists()) {
                return snapshot.val(); // Devuelve los datos si existen
            } else {
                console.warn(`No data available at path: ${path}`);
                return null;
            }
        } catch (error) {
            console.error(`Error fetching data from Realtime Database at path: ${path}`, error);
            throw error;
        }
    }

    async setRealtimeData(path: string, data: any): Promise<void> {
        try {
            const database = getDatabase(this._firebaseApp); // Obtén la instancia de Realtime Database
            const reference = dbRef(database, path); // Crea una referencia al path especificado
            await set(reference, data); // Escribe los datos en la ubicación especificada
            console.log(`Data written successfully at path: ${path}`);
        } catch (error) {
            console.error(`Error writing data to Realtime Database at path: ${path}`, error);
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
                    console.log(`Upload is ${progress}% done`);
                    switch (snapshot.state) {
                        case 'paused':
                            console.log('Upload is paused');
                            break;
                        case 'running':
                            console.log('Upload is running');
                            break;
                    }
                }, (error) => {
                    console.error('Error uploading file -> ', error);
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

}