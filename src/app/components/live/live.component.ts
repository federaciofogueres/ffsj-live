import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FfsjSpinnerComponent } from 'ffsj-web-components';
import { createDefaultLiveInfo, IRealTimeLive } from '../../model/real-time-config.model';
import { FirebaseStorageService } from '../../services/storage.service';
import { ItemComponent } from '../item/item.component';

@Component({
  selector: 'app-live',
  standalone: true,
  imports: [
    CommonModule,
    ItemComponent,
    FfsjSpinnerComponent
  ],
  templateUrl: './live.component.html',
  styleUrl: './live.component.scss'
})
export class LiveComponent {

  liveInfo: IRealTimeLive = createDefaultLiveInfo();
  loading: boolean = true;

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
        this.liveInfo = data.live;
        this.loading = false;
      }
    });
  }
}
