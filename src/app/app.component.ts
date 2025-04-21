import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FfsjAlertComponent } from '../lib/ffsj-web-components';
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

  constructor(
    private firebaseStorageService: FirebaseStorageService
  ) { }

  ngOnInit() {
    this.firebaseStorageService.listenToRealtimeData('config');
  }

}
