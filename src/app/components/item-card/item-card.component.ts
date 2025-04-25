import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { IRealTimeItem } from '../../model/real-time-config.model';

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

  constructor(
    protected router: Router
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['item']) {
      this.updateCandidataData();
    }
  }

  ngOnInit() {
    this.currentImage = (this.item.documentacion.fotoBelleza === '' || !this.item.documentacion.fotoBelleza.includes('staticfoguerapp')) ? 'https://staticfoguerapp.hogueras.es/CANDIDATAS/default.png' : this.item.documentacion.fotoBelleza;
    this.alternateImageUrl = (this.item.documentacion.fotoCalle === '' || !this.item.documentacion.fotoBelleza.includes('staticfoguerapp')) ? 'https://staticfoguerapp.hogueras.es/CANDIDATAS/default.png' : this.item.documentacion.fotoCalle;
    this.foguera = this.item.vidaEnFogueres.asociacion_label!;
  }

  updateCandidataData() {
    this.currentImage = (this.item.documentacion.fotoBelleza === '' || !this.item.documentacion.fotoBelleza.includes('staticfoguerapp')) ? 'https://staticfoguerapp.hogueras.es/CANDIDATAS/default.png' : this.item.documentacion.fotoBelleza;
    this.alternateImageUrl = (this.item.documentacion.fotoCalle === '' || !this.item.documentacion.fotoBelleza.includes('staticfoguerapp')) ? 'https://staticfoguerapp.hogueras.es/CANDIDATAS/default.png' : this.item.documentacion.fotoCalle;
    this.foguera = this.item.vidaEnFogueres.asociacion_label!;
  }

  toggleImage() {
    this.currentImage = this.currentImage === this.item.documentacion.fotoBelleza
      ? this.item.documentacion.fotoCalle
      : this.item.documentacion.fotoBelleza;
  }

  viewDetails() {
    // localStorage.setItem('item', JSON.stringify(this.item));
    this.router.navigateByUrl('list/' + this.item.id);
  }
}
