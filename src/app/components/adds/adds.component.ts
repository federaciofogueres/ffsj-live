import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { IRealTimeAdds } from '../../model/real-time-config.model';
import { FirebaseStorageService } from '../../services/storage.service';

@Component({
  selector: 'app-adds',
  standalone: true,
  imports: [],
  templateUrl: './adds.component.html',
  styleUrl: './adds.component.scss'
})
export class AddsComponent {
  public adds!: IRealTimeAdds;
  public currentAdIndex: number = 0;
  private intervalId!: any;
  private subscription!: Subscription;

  constructor(
    private firebaseStorageService: FirebaseStorageService
  ) { }

  ngOnInit() {
    this.subscription = this.firebaseStorageService.realtimeData$.subscribe({
      next: (newValue) => {
        if (newValue) {
          this.adds = newValue.anuncios;
          if (newValue.activatedAdds === false) {
            this.stopCarousel();
            return;
          }

          if (this.adds.showAdds && this.adds.anuncios) {
            this.startCarousel();
          } else if (!this.adds.showAdds && this.intervalId) {
            this.stopCarousel();
          }
        }
      }
    })
  }

  ngOnDestroy(): void {
    this.stopCarousel();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  startCarousel(): void {
    if (this.intervalId) {
      this.stopCarousel();
    }
    this.intervalId = setInterval(() => {
      this.nextAd();
    }, 5000);
  }

  stopCarousel(): void {
    if (this.intervalId) {
      this.currentAdIndex = 0;
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  nextAd(): void {
    if (this.currentAdIndex < this.adds.anuncios.length) {
      this.currentAdIndex++;
    } else {
      this.stopCarousel();
    }
  }

  closeCarousel(): void {
    this.adds.showAdds = false;
    this.stopCarousel();
  }
}
