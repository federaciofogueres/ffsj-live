import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as i0 from "@angular/core";
import * as i1 from "@angular/router";
import * as i2 from "./censo.service";
import * as i3 from "./encoder.service";
import * as i4 from "ngx-cookie-service";
export class AuthService {
    constructor(router, censoService, encoderService, cookieService) {
        this.router = router;
        this.censoService = censoService;
        this.encoderService = encoderService;
        this.cookieService = cookieService;
        this.loginStatus$ = new BehaviorSubject(false);
        this.loginStatusObservable = this.loginStatus$.asObservable();
    }
    checkToken() {
        return !this.checkExpireDateToken(this.encoderService.decrypt(this.cookieService.get('token')));
    }
    checkExpireDateToken(token) {
        if (token === '' || token === null) {
            return true;
        }
        const expiry = (JSON.parse(atob(token.split('.')[1]))).exp;
        return (Math.floor((new Date).getTime() / 1000)) >= expiry;
    }
    isLocalDomain() {
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    }
    saveToken(token) {
        const isLocal = this.isLocalDomain();
        const hostName = isLocal ? undefined : '.hogueras.es';
        const options = {
            domain: hostName,
            path: '/',
            secure: !isLocal // Assuming secure cookies should not be set for localhost
        };
        this.cookieService.set('token', this.encoderService.encrypt(token), options);
    }
    async login(user, password) {
        let usuario = {
            user,
            password: this.encoderService.encrypt(password)
        };
        return new Promise(async (resolve, reject) => {
            this.censoService.doLogin(usuario).subscribe({
                next: (res) => {
                    if (res.solicitud) {
                        console.log('Cambiar password');
                        this.censoService.configuration.accessToken = res.solicitud.token;
                        // this.saveToken(res.solicitud.token!);
                        resolve({ code: 201, id: res.solicitud.id });
                    }
                    else {
                        console.log(res);
                        this.saveToken(res.token);
                        resolve({ code: 200 });
                    }
                    console.log(res);
                    this.saveToken(res.token);
                    this.loginStatus$.next(true);
                    resolve(res);
                },
                error: (error) => {
                    console.log(error);
                    this.loginStatus$.next(false);
                    reject({ code: 400 });
                }
            });
        });
    }
    getToken() {
        let token = '';
        if (this.cookieService.get('token')) {
            token = this.encoderService.decrypt(this.cookieService.get('token'));
            this.loginStatus$.next(true);
        }
        return token;
    }
    logout() {
        this.cookieService.delete('token');
        this.router.navigateByUrl('login');
        this.loginStatus$.next(false);
    }
    isLoggedIn() {
        const token = this.cookieService.get('token');
        const isLoggedIn = token !== null && token !== '' ? this.checkToken() : false;
        this.loginStatus$.next(isLoggedIn);
        return isLoggedIn;
    }
    getCargos() {
        try {
            // Suponiendo que token es la cadena que quieres decodificar
            const token = this.cookieService.get('token');
            if (!token) {
                throw new Error('Token no encontrado');
            }
            // Asegúrate de que la cadena esté correctamente codificada en base64 antes de decodificarla
            const tokenDecoded = this.encoderService.decrypt(token);
            const base64Payload = tokenDecoded.split('.')[1]; // Asumiendo JWT. Ajusta según sea necesario.
            const payload = atob(base64Payload);
            // Procesa el payload como necesites
            return JSON.parse(payload).cargos; // Ajusta según la estructura de tus datos
        }
        catch (error) {
            // console.log('Error al decodificar la cadena base64:', error);
            // Retorna un valor de respaldo o maneja el error como consideres apropiado
            return [];
        }
    }
    updatePassword(asociado, password) {
        return new Promise((resolve, reject) => {
            this.censoService.asociadosGetById(asociado).subscribe({
                next: (res) => {
                    console.log(res);
                    let usuario = res.asociados[0];
                    usuario.password = this.encoderService.encrypt(password);
                    this.censoService.asociadosPut(usuario, usuario.id).subscribe({
                        next: (res) => {
                            console.log(res);
                            resolve(res); // Resuelve la promesa si la actualización es correcta
                        },
                        error: (error) => {
                            console.log(error);
                            reject(error); // Rechaza la promesa si hay un error en la actualización
                        }
                    });
                },
                error: (error) => {
                    console.log(error);
                    reject(error); // Rechaza la promesa si hay un error al obtener el usuario
                }
            });
        });
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.3.11", ngImport: i0, type: AuthService, deps: [{ token: i1.Router }, { token: i2.CensoService }, { token: i3.EncoderService }, { token: i4.CookieService }], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "17.3.11", ngImport: i0, type: AuthService, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.3.11", ngImport: i0, type: AuthService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root'
                }]
        }], ctorParameters: () => [{ type: i1.Router }, { type: i2.CensoService }, { type: i3.EncoderService }, { type: i4.CookieService }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvZmZzai13ZWItY29tcG9uZW50cy9zcmMvbGliL2Zmc2otbG9naW4vc2VydmljZXMvYXV0aC5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFHM0MsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLE1BQU0sQ0FBQzs7Ozs7O0FBUXZDLE1BQU0sT0FBTyxXQUFXO0lBS3RCLFlBQ1UsTUFBYyxFQUNkLFlBQTBCLEVBQzFCLGNBQThCLEVBQzlCLGFBQTRCO1FBSDVCLFdBQU0sR0FBTixNQUFNLENBQVE7UUFDZCxpQkFBWSxHQUFaLFlBQVksQ0FBYztRQUMxQixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7UUFDOUIsa0JBQWEsR0FBYixhQUFhLENBQWU7UUFQOUIsaUJBQVksR0FBRyxJQUFJLGVBQWUsQ0FBVSxLQUFLLENBQUMsQ0FBQztRQUMzRCwwQkFBcUIsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksRUFBRSxDQUFDO0lBT3JELENBQUM7SUFFTCxVQUFVO1FBQ1IsT0FBTyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUE7SUFDbEcsQ0FBQztJQUVELG9CQUFvQixDQUFDLEtBQWE7UUFDaEMsSUFBSSxLQUFLLEtBQUssRUFBRSxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUNuQyxPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7UUFDRCxNQUFNLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMs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QU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7NEJBRWpCLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLHNEQUFzRDt3QkFDdEUsQ0FBQzt3QkFDRCxLQUFLLEVBQUUsQ0FBQyxLQUFVLEVBQUUsRUFBRTs0QkFDcEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQzs0QkFDbkIsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMseURBQXlEO3dCQUMxRSxDQUFDO3FCQUNGLENBQUMsQ0FBQztnQkFDTCxDQUFDO2dCQUNELEtBQUssRUFBRSxDQUFDLEtBQVUsRUFBRSxFQUFFO29CQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNuQixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQywyREFBMkQ7Z0JBQzVFLENBQUM7YUFDRixDQUFDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7K0dBM0lVLFdBQVc7bUhBQVgsV0FBVyxjQUZWLE1BQU07OzRGQUVQLFdBQVc7a0JBSHZCLFVBQVU7bUJBQUM7b0JBQ1YsVUFBVSxFQUFFLE1BQU07aUJBQ25CIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xyXG5pbXBvcnQgeyBSb3V0ZXIgfSBmcm9tICdAYW5ndWxhci9yb3V0ZXInO1xyXG5pbXBvcnQgeyBDb29raWVTZXJ2aWNlIH0gZnJvbSAnbmd4LWNvb2tpZS1zZXJ2aWNlJztcclxuaW1wb3J0IHsgQmVoYXZpb3JTdWJqZWN0IH0gZnJvbSAncnhqcyc7XHJcbmltcG9ydCB7IFVzdWFyaW8gfSBmcm9tICcuLi9leHRlcm5hbC1hcGkvdXN1YXJpbyc7XHJcbmltcG9ydCB7IENlbnNvU2VydmljZSB9IGZyb20gJy4vY2Vuc28uc2VydmljZSc7XHJcbmltcG9ydCB7IEVuY29kZXJTZXJ2aWNlIH0gZnJvbSAnLi9lbmNvZGVyLnNlcnZpY2UnO1xyXG5cclxuQEluamVjdGFibGUoe1xyXG4gIHByb3ZpZGVkSW46ICdyb290J1xyXG59KVxyXG5leHBvcnQgY2xhc3MgQXV0aFNlcnZpY2Uge1xyXG5cclxuICBwcml2YXRlIGxvZ2luU3RhdHVzJCA9IG5ldyBCZWhhdmlvclN1YmplY3Q8Ym9vbGVhbj4oZmFsc2UpO1xyXG4gIGxvZ2luU3RhdHVzT2JzZXJ2YWJsZSA9IHRoaXMubG9naW5TdGF0dXMkLmFzT2JzZXJ2YWJsZSgpO1xyXG5cclxuICBjb25zdHJ1Y3RvcihcclxuICAgIHByaXZhdGUgcm91dGVyOiBSb3V0ZXIsXHJcbiAgICBwcml2YXRlIGNlbnNvU2VydmljZTogQ2Vuc29TZXJ2aWNlLFxyXG4gICAgcHJpdmF0ZSBlbmNvZGVyU2VydmljZTogRW5jb2RlclNlcnZpY2UsXHJcbiAgICBwcml2YXRlIGNvb2tpZVNlcnZpY2U6IENvb2tpZVNlcnZpY2VcclxuICApIHsgfVxyXG5cclxuICBjaGVja1Rva2VuKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuICF0aGlzLmNoZWNrRXhwaXJlRGF0ZVRva2VuKHRoaXMuZW5jb2RlclNlcnZpY2UuZGVjcnlwdCh0aGlzLmNvb2tpZVNlcnZpY2UuZ2V0KCd0b2tlbicpISkpXHJcbiAgfVxyXG5cclxuICBjaGVja0V4cGlyZURhdGVUb2tlbih0b2tlbjogc3RyaW5nKSB7XHJcbiAgICBpZiAodG9rZW4gPT09ICcnIHx8IHRva2VuID09PSBudWxsKSB7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gICAgY29uc3QgZXhwaXJ5ID0gKEpTT04ucGFyc2UoYXRvYih0b2tlbi5zcGxpdCgnLicpWzFdKSkpLmV4cDtcclxuICAgIHJldHVybiAoTWF0aC5mbG9vcigobmV3IERhdGUpLmdldFRpbWUoKSAvIDEwMDApKSA+PSBleHBpcnk7XHJcbiAgfVxyXG5cclxuICBwcml2YXRlIGlzTG9jYWxEb21haW4oKTogYm9vbGVhbiB7XHJcbiAgICByZXR1cm4gd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lID09PSAnbG9jYWxob3N0JyB8fCB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgPT09ICcxMjcuMC4wLjEnO1xyXG4gIH1cclxuICBcclxuICBzYXZlVG9rZW4odG9rZW46IHN0cmluZyk6IHZvaWQge1xyXG4gICAgY29uc3QgaXNMb2NhbCA9IHRoaXMuaXNMb2NhbERvbWFpbigpO1xyXG4gICAgY29uc3QgaG9zdE5hbWUgPSBpc0xvY2FsID8gdW5kZWZpbmVkIDogJy5ob2d1ZXJhcy5lcyc7XHJcbiAgICBjb25zdCBvcHRpb25zID0ge1xyXG4gICAgICBkb21haW46IGhvc3ROYW1lLFxyXG4gICAgICBwYXRoOiAnLycsXHJcbiAgICAgIHNlY3VyZTogIWlzTG9jYWwgLy8gQXNzdW1pbmcgc2VjdXJlIGNvb2tpZXMgc2hvdWxkIG5vdCBiZSBzZXQgZm9yIGxvY2FsaG9zdFxyXG4gICAgfVxyXG4gICAgdGhpcy5jb29raWVTZXJ2aWNlLnNldCgndG9rZW4nLCB0aGlzLmVuY29kZXJTZXJ2aWNlLmVuY3J5cHQodG9rZW4pLCBvcHRpb25zKTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGxvZ2luKHVzZXI6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZykge1xyXG4gICAgbGV0IHVzdWFyaW86IFVzdWFyaW8gPSB7XHJcbiAgICAgIHVzZXIsXHJcbiAgICAgIHBhc3N3b3JkOiB0aGlzLmVuY29kZXJTZXJ2aWNlLmVuY3J5cHQocGFzc3dvcmQpXHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmNlbnNvU2VydmljZS5kb0xvZ2luKHVzdWFyaW8pLnN1YnNjcmliZSh7XHJcbiAgICAgICAgbmV4dDogKHJlczogYW55KSA9PiB7XHJcbiAgICAgICAgICBpZiAocmVzLnNvbGljaXR1ZCkge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQ2FtYmlhciBwYXNzd29yZCcpO1xyXG4gICAgICAgICAgICB0aGlzLmNlbnNvU2VydmljZS5jb25maWd1cmF0aW9uLmFjY2Vzc1Rva2VuID0gcmVzLnNvbGljaXR1ZC50b2tlbiE7XHJcbiAgICAgICAgICAgIC8vIHRoaXMuc2F2ZVRva2VuKHJlcy5zb2xpY2l0dWQudG9rZW4hKTtcclxuICAgICAgICAgICAgcmVzb2x2ZSh7Y29kZTogMjAxLCBpZDogcmVzLnNvbGljaXR1ZC5pZH0pO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzKTtcclxuICAgICAgICAgICAgdGhpcy5zYXZlVG9rZW4ocmVzLnRva2VuISk7XHJcbiAgICAgICAgICAgIHJlc29sdmUoe2NvZGU6IDIwMH0pXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBjb25zb2xlLmxvZyhyZXMpO1xyXG4gICAgICAgICAgdGhpcy5zYXZlVG9rZW4ocmVzLnRva2VuISk7XHJcbiAgICAgICAgICB0aGlzLmxvZ2luU3RhdHVzJC5uZXh0KHRydWUpO1xyXG4gICAgICAgICAgcmVzb2x2ZShyZXMpXHJcbiAgICAgICAgfSxcclxuICAgICAgICBlcnJvcjogKGVycm9yOiBhbnkpID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcclxuICAgICAgICAgIHRoaXMubG9naW5TdGF0dXMkLm5leHQoZmFsc2UpO1xyXG4gICAgICAgICAgcmVqZWN0KHtjb2RlOiA0MDB9KVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgfVxyXG5cclxuICBwdWJsaWMgZ2V0VG9rZW4oKSB7XHJcbiAgICBsZXQgdG9rZW4gPSAnJztcclxuICAgIGlmICh0aGlzLmNvb2tpZVNlcnZpY2UuZ2V0KCd0b2tlbicpKSB7XHJcbiAgICAgIHRva2VuID0gdGhpcy5lbmNvZGVyU2VydmljZS5kZWNyeXB0KHRoaXMuY29va2llU2VydmljZS5nZXQoJ3Rva2VuJykhKTtcclxuICAgICAgdGhpcy5sb2dpblN0YXR1cyQubmV4dCh0cnVlKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0b2tlbjtcclxuICB9XHJcblxyXG4gIGxvZ291dCgpIHtcclxuICAgIHRoaXMuY29va2llU2VydmljZS5kZWxldGUoJ3Rva2VuJyk7XHJcbiAgICB0aGlzLnJvdXRlci5uYXZpZ2F0ZUJ5VXJsKCdsb2dpbicpO1xyXG4gICAgdGhpcy5sb2dpblN0YXR1cyQubmV4dChmYWxzZSk7XHJcbiAgfVxyXG5cclxuICBpc0xvZ2dlZEluKCk6IGJvb2xlYW4ge1xyXG4gICAgY29uc3QgdG9rZW4gPSB0aGlzLmNvb2tpZVNlcnZpY2UuZ2V0KCd0b2tlbicpO1xyXG4gICAgY29uc3QgaXNMb2dnZWRJbiA9IHRva2VuICE9PSBudWxsICYmIHRva2VuICE9PSAnJyA/IHRoaXMuY2hlY2tUb2tlbigpIDogZmFsc2U7XHJcbiAgICB0aGlzLmxvZ2luU3RhdHVzJC5uZXh0KGlzTG9nZ2VkSW4pO1xyXG4gICAgcmV0dXJuIGlzTG9nZ2VkSW47XHJcbiAgfVxyXG5cclxuICBnZXRDYXJnb3MoKTogYW55W10ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgLy8gU3Vwb25pZW5kbyBxdWUgdG9rZW4gZXMgbGEgY2FkZW5hIHF1ZSBxdWllcmVzIGRlY29kaWZpY2FyXHJcbiAgICAgIGNvbnN0IHRva2VuID0gdGhpcy5jb29raWVTZXJ2aWNlLmdldCgndG9rZW4nKTtcclxuICAgICAgaWYgKCF0b2tlbikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignVG9rZW4gbm8gZW5jb250cmFkbycpO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIEFzZWfDunJhdGUgZGUgcXVlIGxhIGNhZGVuYSBlc3TDqSBjb3JyZWN0YW1lbnRlIGNvZGlmaWNhZGEgZW4gYmFzZTY0IGFudGVzIGRlIGRlY29kaWZpY2FybGFcclxuICAgICAgY29uc3QgdG9rZW5EZWNvZGVkID0gdGhpcy5lbmNvZGVyU2VydmljZS5kZWNyeXB0KHRva2VuKTtcclxuICAgICAgY29uc3QgYmFzZTY0UGF5bG9hZCA9IHRva2VuRGVjb2RlZC5zcGxpdCgnLicpWzFdOyAvLyBBc3VtaWVuZG8gSldULiBBanVzdGEgc2Vnw7puIHNlYSBuZWNlc2FyaW8uXHJcbiAgICAgIGNvbnN0IHBheWxvYWQgPSBhdG9iKGJhc2U2NFBheWxvYWQpO1xyXG4gICAgICAvLyBQcm9jZXNhIGVsIHBheWxvYWQgY29tbyBuZWNlc2l0ZXNcclxuICAgICAgcmV0dXJuIEpTT04ucGFyc2UocGF5bG9hZCkuY2FyZ29zOyAvLyBBanVzdGEgc2Vnw7puIGxhIGVzdHJ1Y3R1cmEgZGUgdHVzIGRhdG9zXHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAvLyBjb25zb2xlLmxvZygnRXJyb3IgYWwgZGVjb2RpZmljYXIgbGEgY2FkZW5hIGJhc2U2NDonLCBlcnJvcik7XHJcbiAgICAgIC8vIFJldG9ybmEgdW4gdmFsb3IgZGUgcmVzcGFsZG8gbyBtYW5lamEgZWwgZXJyb3IgY29tbyBjb25zaWRlcmVzIGFwcm9waWFkb1xyXG4gICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcbiAgfVxyXG4gIFxyXG4gIHVwZGF0ZVBhc3N3b3JkKGFzb2NpYWRvOiBudW1iZXIsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPGFueT4ge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5jZW5zb1NlcnZpY2UuYXNvY2lhZG9zR2V0QnlJZChhc29jaWFkbykuc3Vic2NyaWJlKHtcclxuICAgICAgICBuZXh0OiAocmVzOiBhbnkpID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKHJlcyk7XHJcbiAgICAgICAgICBsZXQgdXN1YXJpbyA9IHJlcy5hc29jaWFkb3NbMF07XHJcbiAgICAgICAgICB1c3VhcmlvLnBhc3N3b3JkID0gdGhpcy5lbmNvZGVyU2VydmljZS5lbmNyeXB0KHBhc3N3b3JkKTtcclxuICAgICAgICAgIHRoaXMuY2Vuc29TZXJ2aWNlLmFzb2NpYWRvc1B1dCh1c3VhcmlvLCB1c3VhcmlvLmlkKS5zdWJzY3JpYmUoe1xyXG4gICAgICAgICAgICBuZXh0OiAocmVzOiBhbnkpID0+IHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXMpO1xyXG5cclxuICAgICAgICAgICAgICByZXNvbHZlKHJlcyk7IC8vIFJlc3VlbHZlIGxhIHByb21lc2Egc2kgbGEgYWN0dWFsaXphY2nDs24gZXMgY29ycmVjdGFcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXJyb3I6IChlcnJvcjogYW55KSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xyXG4gICAgICAgICAgICAgIHJlamVjdChlcnJvcik7IC8vIFJlY2hhemEgbGEgcHJvbWVzYSBzaSBoYXkgdW4gZXJyb3IgZW4gbGEgYWN0dWFsaXphY2nDs25cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBlcnJvcjogKGVycm9yOiBhbnkpID0+IHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcclxuICAgICAgICAgIHJlamVjdChlcnJvcik7IC8vIFJlY2hhemEgbGEgcHJvbWVzYSBzaSBoYXkgdW4gZXJyb3IgYWwgb2J0ZW5lciBlbCB1c3VhcmlvXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbn1cclxuIl19