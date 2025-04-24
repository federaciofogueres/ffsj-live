import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService, FfsjAlertComponent } from '../lib/ffsj-web-components';
import { AddsComponent } from './components/adds/adds.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeaderComponent } from './components/header/header.component';
import { FirebaseStorageService } from './services/storage.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    AddsComponent,
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    FfsjAlertComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'ffsj-live';
  demo: boolean = true;

  constructor(
    private firebaseStorageService: FirebaseStorageService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.firebaseStorageService.listenToRealtimeData('config');
    this.firebaseStorageService.realtimeData$.subscribe({
      next: (value) => {
        if (value && value.event.demo && !this.authService.getCargos().some((cargo: { idCargo: number }) => cargo.idCargo === 16)) {
          console.log(this.authService.getCargos());
          this.demo = true;
        } else {
          this.demo = false;
        }
        console.log(this.demo);
      }
    })
  }

}
