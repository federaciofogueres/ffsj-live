import { inject, Injectable } from '@angular/core';
import { ref as dbRef, get, getDatabase, set } from '@angular/fire/database';
import { collection, doc, Firestore, getDocs, setDoc } from '@angular/fire/firestore';
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from '@angular/fire/storage';

@Injectable({
    providedIn: 'root'
})
export class FirebaseStorageService {

    private _firestore = inject(Firestore);
    private _firebaseApp = this._firestore.app;
    private _collection = collection(this._firestore, 'candidatas');
    private _storage = getStorage(this._firebaseApp, 'gs://ffsj-form-candidatas.appspot.com');

    constructor() { }

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

    // async addCandidata(candidata: CandidataData) {
    //     const candidataValues = this.extractValues(candidata);
    //     await setDoc(doc(this._firestore, `candidatas/2024/${candidataValues.tipoCandidata}`, candidataValues.asociacion), candidataValues);
    // }

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

    // extractValues(candidata: CandidataData) {
    //     return {
    //         id: candidata.id.value,
    //         dni: candidata.informacionPersonal.dni.value,
    //         nombre: candidata.informacionPersonal.nombre.value,
    //         fechaNacimiento: candidata.informacionPersonal.fechaNacimiento.value,
    //         ciudad: candidata.informacionPersonal.ciudad.value,
    //         email: candidata.informacionPersonal.email.value,
    //         telefono: candidata.informacionPersonal.telefono.value,
    //         edad: candidata.informacionPersonal.edad.value,
    //         tipoCandidata: candidata.informacionPersonal.tipoCandidata.value,
    //         asociacion: candidata.vidaEnFogueres.asociacion.value,
    //         anyosFiesta: candidata.vidaEnFogueres.anyosFiesta.value,
    //         curriculum: candidata.vidaEnFogueres.curriculum.value,
    //         formacion: candidata.academico.formacion.value,
    //         situacionLaboral: candidata.academico.situacionLaboral.value,
    //         observaciones: candidata.academico.observaciones.value,
    //         aficiones: candidata.academico.aficiones.value,
    //         autorizacionFoguera: candidata.documentacion.autorizacionFoguera.value,
    //         compromisoDisponibilidad: candidata.documentacion.compromisoDisponibilidad.value,
    //         derechosAutor: candidata.documentacion.derechosAutor.value,
    //         dniEscaneado: candidata.documentacion.dniEscaneado.value,
    //         fotoBelleza: candidata.documentacion.fotoBelleza.value,
    //         fotoCalle: candidata.documentacion.fotoCalle.value,
    //         nombreTutor1: candidata.responsables.nombreTutor1.value,
    //         nombreTutor2: candidata.responsables.nombreTutor2.value,
    //         telefonoTutor1: candidata.responsables.telefonoTutor1.value,
    //         telefonoTutor2: candidata.responsables.telefonoTutor2.value
    //     }
    // };
}