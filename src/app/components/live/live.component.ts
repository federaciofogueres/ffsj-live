import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { createDefaultLiveInfo, IRealTimeLive } from '../../model/real-time-config.model';
import { FirebaseStorageService } from '../../services/storage.service';
import { ItemComponent } from '../item/item.component';

@Component({
  selector: 'app-live',
  standalone: true,
  imports: [
    ItemComponent
  ],
  templateUrl: './live.component.html',
  styleUrl: './live.component.scss'
})
export class LiveComponent {

  liveInfo: IRealTimeLive = createDefaultLiveInfo()
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
