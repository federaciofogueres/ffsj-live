import { EnvironmentInjector, Injectable, PLATFORM_ID, inject, runInInjectionContext } from '@angular/core';
import { Auth, onAuthStateChanged, signInAnonymously } from '@angular/fire/auth';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class AuthFirebaseService {
    private readonly injector = inject(EnvironmentInjector);
    private readonly platformId = inject(PLATFORM_ID);

    constructor(private auth: Auth) {
        if (this.isBrowser()) {
            this.authenticateUser();
        }
    }

    private isBrowser(): boolean {
        return isPlatformBrowser(this.platformId);
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
        if (!this.isBrowser()) {
            return Promise.resolve();
        }

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
