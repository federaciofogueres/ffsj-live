import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IRealTimeLive } from '../../model/real-time-config.model';
import { FirebaseStorageService } from '../../services/storage.service';
import { CandidataComponent } from '../libro-candidatas/candidata/candidata.component';

@Component({
  selector: 'app-live',
  standalone: true,
  imports: [
    CandidataComponent
  ],
  templateUrl: './live.component.html',
  styleUrl: './live.component.scss'
})
export class LiveComponent {

  liveInfo: IRealTimeLive = {
    descripcion: '',
    item: '',
    tipo: '',
    titulo: ''
  }
  constructor(
    protected router: Router,
    private firebaseStorageService: FirebaseStorageService
  ) { }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    const config = await this.firebaseStorageService.getRealtimeData('config');
    this.liveInfo = config.live
  }
}
