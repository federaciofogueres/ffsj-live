import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { IRealTimeItem } from '../../model/real-time-config.model';
import { FirebaseStorageService } from '../../services/storage.service';
import { ffsjDebugLog } from '../../utils/debug-log';
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
  favoriteUpdating = false;
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
      'belleza',
      this.item.documentacion?.fotoThumbBelleza
    );
    this.alternateImageUrl = resolveCandidataImage(
      this.item.documentacion?.fotoCalle,
      this.item.informacionPersonal?.tipoCandidata,
      this.item.vidaEnFogueres?.asociacion_order,
      'calle',
      this.item.documentacion?.fotoThumbCalle
    );
    this.foguera = this.item.vidaEnFogueres.asociacion_label || '';
    this.favoriteMarked = this.isFavoriteMarked();
    ffsjDebugLog('image', 'card resuelta', {
      id: this.item.id,
      nombre: this.item.informacionPersonal?.nombre,
      selected: this.currentImage,
      thumb: this.item.documentacion?.fotoThumbBelleza || null,
      original: this.item.documentacion?.fotoBelleza || null
    });
  }

  async toggleFavorite(event: Event): Promise<void> {
    event.stopPropagation();

    if (!this.item?.id || this.favoriteUpdating) {
      return;
    }

    const previousValue = this.favoriteMarked;
    const nextValue = !previousValue;
    this.favoriteUpdating = true;
    this.favoriteMarked = nextValue;
    this.saveFavoriteState(nextValue);

    try {
      await this.firebaseStorageService.setCandidataFavorite(this.item.id, nextValue);
    } catch (error) {
      this.favoriteMarked = previousValue;
      this.saveFavoriteState(previousValue);
      console.error('Error al actualizar favorita:', error);
    } finally {
      this.favoriteUpdating = false;
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
        'belleza',
        this.item.documentacion?.fotoThumbBelleza
      )
      : this.alternateImageUrl;
  }

  handleImageError(): void {
    ffsjDebugLog('image', 'card error, usando default', {
      id: this.item?.id,
      failed: this.currentImage
    });
    this.currentImage = this.defaultImage;
    this.alternateImageUrl = this.defaultImage;
  }

  handleImageLoad(event: Event): void {
    const image = event.target as HTMLImageElement;
    ffsjDebugLog('image', 'card cargada', {
      id: this.item?.id,
      nombre: this.item?.informacionPersonal?.nombre,
      currentSrc: image.currentSrc || image.src,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      renderedWidth: image.clientWidth,
      renderedHeight: image.clientHeight
    });
  }

  viewDetails() {
    // localStorage.setItem('item', JSON.stringify(this.item));
    this.router.navigateByUrl('list/' + this.item.id);
  }
}
