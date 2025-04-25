import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService, FfsjAlertComponent, FfsjSpinnerComponent } from '../lib/ffsj-web-components';
import { AddsComponent } from './components/adds/adds.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { AuthFirebaseService } from './services/auth.service';
import { FirebaseStorageService } from './services/storage.service';

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

  constructor(
    private firebaseStorageService: FirebaseStorageService,
    private authService: AuthService,
    private authFirebase: AuthFirebaseService
  ) { }

  ngOnInit() {
    this.authFirebase.ensureAuthenticated().then(() => {
      // Escuchar los datos de Firebase solo después de la autenticación
      this.firebaseStorageService.listenToRealtimeData('config');
      this.firebaseStorageService.realtimeData$.subscribe({
        next: (value) => {
          this.loading = false;
          if (value && value.event.demo && !this.authService.getCargos().some((cargo: { idCargo: number }) => cargo.idCargo === 16)) {
            this.demo = true;
          } else {
            this.demo = false;
          }
        }
      });
    }).catch((error) => {
      console.error('Error al autenticar:', error);
    });
  }

}
