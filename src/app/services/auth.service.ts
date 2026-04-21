import { EnvironmentInjector, Injectable, inject, runInInjectionContext } from '@angular/core';
import { Auth, onAuthStateChanged, signInAnonymously } from '@angular/fire/auth';

@Injectable({
    providedIn: 'root'
})
export class AuthFirebaseService {
    private readonly injector = inject(EnvironmentInjector);

    constructor(private auth: Auth) {
        this.authenticateUser();
    }

    private authenticateUser(): void {
        runInInjectionContext(this.injector, () => {
            onAuthStateChanged(this.auth, (user) => {
                if (!user) {
                    signInAnonymously(this.auth).catch(() => undefined);
                }
            });
        });
    }

    ensureAuthenticated(): Promise<void> {
        return new Promise((resolve, reject) => {
            runInInjectionContext(this.injector, () => {
                const unsubscribe = onAuthStateChanged(this.auth, (user) => {
                    if (user) {
                        unsubscribe();
                        resolve();
                        return;
                    }

                    signInAnonymously(this.auth)
                        .then(() => {
                            unsubscribe();
                            resolve();
                        })
                        .catch((error) => {
                            unsubscribe();
                            reject(error);
                        });
                });
            });
        });
    }
}
