import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IRealTimeEventInfo } from '../../model/real-time-event.model';
import { FirebaseStorageService } from '../../services/storage.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  eventInfo: IRealTimeEventInfo = {
    title: '',
    horario: '',
    presentadores: [],
    eventos: []
  }
  showProtagonists = false;

  constructor(
    protected router: Router,
    private firebaseStorageService: FirebaseStorageService
  ) { }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    const config = await this.firebaseStorageService.getRealtimeData('config');
    this.eventInfo = config.evento
  }

  // Alternar la visibilidad de los protagonistas
  toggleProtagonists(): void {
    this.showProtagonists = !this.showProtagonists;
  }
}
