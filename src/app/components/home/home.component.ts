import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IRealTimeEvent } from '../../model/real-time-config.model';
import { FirebaseStorageService } from '../../services/storage.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  eventInfo: IRealTimeEvent = {
    title: '',
    horario: '',
    presentadores: [],
    eventos: []
  }
  showProtagonists = false;
  showWelcomeModal = true;

  constructor(
    protected router: Router,
    private firebaseStorageService: FirebaseStorageService
  ) { }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.firebaseStorageService.realtimeData$.subscribe((data) => {
      if (data) {
        const config = data;
        this.eventInfo = config.event
      }
    });
  }

  // Alternar la visibilidad de los protagonistas
  toggleProtagonists(): void {
    this.showProtagonists = !this.showProtagonists;
  }

  closeWelcomeModal(): void {
    this.showWelcomeModal = false;
  }

  goToCandidatas(): void {
    this.closeWelcomeModal();
    this.router.navigateByUrl('/list');
  }
}
