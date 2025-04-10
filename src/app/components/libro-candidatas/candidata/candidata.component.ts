import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';


import { MatTabsModule } from '@angular/material/tabs';
import { CookieService } from 'ngx-cookie-service';
import { CandidataData } from '../../../model/candidata-data.model';
import { FirebaseStorageService } from '../../../services/storage.service';

@Component({
  selector: 'app-candidata',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatTabsModule
  ],
  templateUrl: './candidata.component.html',
  styleUrl: './candidata.component.scss'
})
export class CandidataComponent {

  Object = Object;

  @Input() candidataId: string = "";

  candidataData!: CandidataData;

  // URL de la imagen alternativa
  alternateImageUrl: string = '';

  // Estado de volteo
  isFlipped: boolean = false;

  // URL de la imagen actual
  currentImage: string = '';

  // Anotaciones
  anotaciones: string = '';

  // Indica si es un teléfono
  isTelefono: boolean = false;

  idUsuario: string = '';

  constructor(
    private breakpointObserver: BreakpointObserver,
    private firebaseStorageService: FirebaseStorageService,
    private cookieService: CookieService
  ) { }

  async ngOnInit() {
    if (this.candidataId !== '') {
      const info = JSON.parse(localStorage.getItem('candidatasData') || '');
      let candidataData = info.adultas.find((candidata: any) => candidata.id === this.candidataId.toString());
      if (!candidataData) {
        candidataData = info.infantiles.find((candidata: any) => candidata.id === this.candidataId.toString());
      }
      if (candidataData) {
        this.candidataData = candidataData;
      } else {
        this.candidataData = JSON.parse(localStorage.getItem('candidataData') || '');
      }
    } else {
      this.candidataData = JSON.parse(localStorage.getItem('candidataData') || '');
    }
    this.idUsuario = this.cookieService.get('idUsuario');
    this.loadAnotation();

    this.breakpointObserver
      .observe(['(max-width: 768px)'])
      .subscribe((state: BreakpointState) => {
        this.isTelefono = state.matches;
      });

    this.currentImage = this.candidataData.documentacion?.fotoBelleza || '';
    this.alternateImageUrl = this.candidataData.documentacion?.fotoCalle || '';
  }

  toggleImage() {
    this.currentImage = this.currentImage === this.candidataData.documentacion.fotoBelleza
      ? this.candidataData.documentacion.fotoCalle
      : this.candidataData.documentacion.fotoBelleza;
  }

  saveAnotaciones() {
    this.firebaseStorageService.addAnotation({ candidata: this.candidataData.id, anotacion: this.anotaciones }, this.idUsuario, this.candidataData.id);
  }

  loadAnotation() {
    if (localStorage.getItem('candidatasData')) {
      this.anotaciones = JSON.parse(localStorage.getItem('candidatasData')!).anotaciones.find((anotacion: any) => anotacion.candidata === this.candidataData.id)?.anotacion || '';
    }
  }

}
