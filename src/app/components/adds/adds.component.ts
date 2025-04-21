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
  public currentAdIndex: number = 0; // Índice de la imagen actual
  private intervalId!: any; // ID del intervalo para el carrusel automático
  private subscription!: Subscription; // Suscripción al observable realtimeData$

  constructor(
    private firebaseStorageService: FirebaseStorageService
  ) { }

  ngOnInit() {
    this.subscription = this.firebaseStorageService.realtimeData$.subscribe({
      next: (newValue) => {
        if (newValue) {
          this.adds = newValue.anuncios;
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
    // Limpia el intervalo al destruir el componente
    this.stopCarousel();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  startCarousel(): void {
    // Evita crear múltiples intervalos
    if (this.intervalId) {
      this.stopCarousel();
    }
    this.intervalId = setInterval(() => {
      this.nextAd();
    }, 5000); // Cambia de imagen cada 5 segundos
  }

  stopCarousel(): void {
    if (this.intervalId) {
      this.currentAdIndex = 0;
      clearInterval(this.intervalId); // Detiene el intervalo
      this.intervalId = null;
      // this.firebaseStorageService.setRealtimeData('config/anuncios/showAdds', false);
    }
  }

  nextAd(): void {
    if (this.currentAdIndex < this.adds.anuncios.length) {
      console.log('Entrando en el anuncio ', this.currentAdIndex);
      this.currentAdIndex++; // Cambia al siguiente anuncio
    } else {
      this.stopCarousel(); // Detiene el carrusel si es la última imagen
    }
  }

  closeCarousel(): void {
    this.adds.showAdds = false; // Oculta el carrusel
    this.stopCarousel(); // Detiene el carrusel automático
  }
}
