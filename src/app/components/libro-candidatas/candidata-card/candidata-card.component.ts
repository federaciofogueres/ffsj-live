import { CommonModule } from '@angular/common';
import { Component, Input, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { IRealTimeItem } from '../../../model/real-time-config.model';

@Component({
  selector: 'app-candidata-card',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './candidata-card.component.html',
  styleUrl: './candidata-card.component.scss'
})
export class CandidataCardComponent {

  @Input() candidataData!: IRealTimeItem;

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
    if (changes['candidataData']) {
      this.updateCandidataData();
    }
  }

  ngOnInit() {
    this.currentImage = (this.candidataData.documentacion.fotoBelleza === '' || !this.candidataData.documentacion.fotoBelleza.includes('staticfoguerapp')) ? 'https://staticfoguerapp.hogueras.es/CANDIDATAS/default.png' : this.candidataData.documentacion.fotoBelleza;
    this.alternateImageUrl = (this.candidataData.documentacion.fotoCalle === '' || !this.candidataData.documentacion.fotoBelleza.includes('staticfoguerapp')) ? 'https://staticfoguerapp.hogueras.es/CANDIDATAS/default.png' : this.candidataData.documentacion.fotoCalle;
    this.foguera = this.candidataData.vidaEnFogueres.asociacion_label!;
  }

  updateCandidataData() {
    this.currentImage = (this.candidataData.documentacion.fotoBelleza === '' || !this.candidataData.documentacion.fotoBelleza.includes('staticfoguerapp')) ? 'https://staticfoguerapp.hogueras.es/CANDIDATAS/default.png' : this.candidataData.documentacion.fotoBelleza;
    this.alternateImageUrl = (this.candidataData.documentacion.fotoCalle === '' || !this.candidataData.documentacion.fotoBelleza.includes('staticfoguerapp')) ? 'https://staticfoguerapp.hogueras.es/CANDIDATAS/default.png' : this.candidataData.documentacion.fotoCalle;
    this.foguera = this.candidataData.vidaEnFogueres.asociacion_label!;
  }

  toggleImage() {
    this.currentImage = this.currentImage === this.candidataData.documentacion.fotoBelleza
      ? this.candidataData.documentacion.fotoCalle
      : this.candidataData.documentacion.fotoBelleza;
  }

  viewDetails() {
    localStorage.setItem('candidataData', JSON.stringify(this.candidataData));
    this.router.navigateByUrl('candidatas/' + this.candidataData.id);
  }

}
