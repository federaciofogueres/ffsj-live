import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterOutlet } from '@angular/router';
import { AuthService, FfsjAlertComponent, FfsjSpinnerComponent } from 'ffsj-web-components';
import { AddsComponent } from './components/adds/adds.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { AuthFirebaseService } from './services/auth.service';
import { FirebaseStorageService } from './services/storage.service';
import { installFirebaseNetworkDebugLogger } from './utils/debug-log';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    AddsComponent,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    FfsjAlertComponent,
    FfsjSpinnerComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'ffsj-live';
  demo: boolean = true;
  loading: boolean = true;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private firebaseStorageService: FirebaseStorageService,
    private authService: AuthService,
    private authFirebase: AuthFirebaseService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    installFirebaseNetworkDebugLogger();

    this.authFirebase.ensureAuthenticated().then(() => {
      // Escuchar los datos de Firebase solo después de la autenticación
      this.firebaseStorageService.listenToRealtimeData('config');
      this.firebaseStorageService.realtimeData$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
        next: (value) => {
          queueMicrotask(() => {
            this.loading = false;
            this.demo = !!(
              value?.event?.demo &&
              !this.authService.getCargos().some((cargo: { idCargo: number }) => cargo.idCargo === 16)
            );
            this.cdr.detectChanges();
          });
        }
      });
    }).catch((error) => {
      console.error('Error al autenticar:', error);
    });
  }

}
