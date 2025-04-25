import { Injectable } from '@angular/core';
import { Auth, onAuthStateChanged, signInAnonymously } from '@angular/fire/auth';

@Injectable({
    providedIn: 'root'
})
export class AuthFirebaseService {
    constructor(private auth: Auth) {
        this.authenticateUser();
    }

    private authenticateUser(): void {
        onAuthStateChanged(this.auth, (user) => {
            if (!user) {
                // Si no hay un usuario autenticado, inicia sesión anónima
                signInAnonymously(this.auth)
                    .then(() => {
                        // console.log('Usuario autenticado anónimamente');
                    })
                    .catch((error) => {
                        // console.error('Error al autenticar anónimamente:', error);
                    });
            } else {
                // console.log('Usuario ya autenticado:', user);
            }
        });
    }

    ensureAuthenticated(): Promise<void> {
        return new Promise((resolve, reject) => {
            onAuthStateChanged(this.auth, (user) => {
                if (user) {
                    resolve();
                } else {
                    signInAnonymously(this.auth)
                        .then(() => resolve())
                        .catch((error) => reject(error));
                }
            });
        });
    }
}