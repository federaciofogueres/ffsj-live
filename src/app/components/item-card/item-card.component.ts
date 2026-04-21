import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { IRealTimeItem } from '../../model/real-time-config.model';
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

  // URL de la imagen alternativa
  alternateImageUrl: string = '';

  // Estado de volteo
  isFlipped: boolean = false;

  // URL de la imagen actual
  currentImage: string = '';

  foguera: string = '';
  readonly defaultImage = getDefaultCandidataImage();

  constructor(
    protected router: Router
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
