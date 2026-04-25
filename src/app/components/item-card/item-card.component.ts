import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { IRealTimeItem } from '../../model/real-time-config.model';
import { FirebaseStorageService } from '../../services/storage.service';
import { getDefaultCandidataImage, resolveCandidataImage } from '../../utils/candidata-images';

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './item-card.component.html',
  styleUrl: './item-card.component.scss'
})
export class ItemCardComponent {

  @Input() item!: IRealTimeItem;
  @Input() showFavoriteCount: boolean = false;

  // URL de la imagen alternativa
  alternateImageUrl: string = '';

  // Estado de volteo
  isFlipped: boolean = false;

  // URL de la imagen actual
  currentImage: string = '';

  foguera: string = '';
  favoriteMarked = false;
  readonly defaultImage = getDefaultCandidataImage();

  constructor(
    protected router: Router,
    private firebaseStorageService: FirebaseStorageService
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['item']) {
      this.updateCandidataData();
    }
  }

  ngOnInit() {
    this.updateCandidataData();
  }

  updateCandidataData() {
    if (!this.item) {
      return;
    }

    this.currentImage = resolveCandidataImage(
      this.item.documentacion?.fotoBelleza,
      this.item.informacionPersonal?.tipoCandidata,
      this.item.vidaEnFogueres?.asociacion_order,
      'belleza'
    );
    this.alternateImageUrl = resolveCandidataImage(
      this.item.documentacion?.fotoCalle,
      this.item.informacionPersonal?.tipoCandidata,
      this.item.vidaEnFogueres?.asociacion_order,
      'calle'
    );
    this.foguera = this.item.vidaEnFogueres.asociacion_label || '';
    this.favoriteMarked = this.isFavoriteMarked();
  }

  async toggleFavorite(event: Event): Promise<void> {
    event.stopPropagation();

    if (!this.item?.id || this.favoriteMarked) {
      return;
    }

    this.favoriteMarked = true;
    this.saveFavoriteState(true);

    try {
      await this.firebaseStorageService.incrementCandidataFavorite(this.item.id);
    } catch (error) {
      this.favoriteMarked = false;
      this.saveFavoriteState(false);
      console.error('Error al marcar favorita:', error);
    }
  }

  private isFavoriteMarked(): boolean {
    if (!this.canUseLocalStorage()) {
      return false;
    }

    return localStorage.getItem(this.favoriteStorageKey()) === 'true';
  }

  private saveFavoriteState(value: boolean): void {
    if (!this.canUseLocalStorage()) {
      return;
    }

    if (value) {
      localStorage.setItem(this.favoriteStorageKey(), 'true');
      return;
    }

    localStorage.removeItem(this.favoriteStorageKey());
  }

  private favoriteStorageKey(): string {
    return `ffsj-live.favorite.${this.item?.id || ''}`;
  }

  private canUseLocalStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }

  toggleImage() {
    this.currentImage = this.currentImage === this.alternateImageUrl
      ? resolveCandidataImage(
        this.item.documentacion?.fotoBelleza,
        this.item.informacionPersonal?.tipoCandidata,
        this.item.vidaEnFogueres?.asociacion_order,
        'belleza'
      )
      : this.alternateImageUrl;
  }

  handleImageError(): void {
    this.currentImage = this.defaultImage;
    this.alternateImageUrl = this.defaultImage;
  }

  viewDetails() {
    // localStorage.setItem('item', JSON.stringify(this.item));
    this.router.navigateByUrl('list/' + this.item.id);
  }
}
