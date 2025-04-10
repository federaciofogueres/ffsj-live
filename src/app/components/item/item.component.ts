import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { CookieService } from 'ngx-cookie-service';
import { IRealTimeItem } from '../../model/real-time-config.model';
import { FirebaseStorageService } from '../../services/storage.service';

import { BreakpointObserver } from '@angular/cdk/layout';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-item',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatTabsModule
  ],
  templateUrl: './item.component.html',
  styleUrl: './item.component.scss'
})
export class ItemComponent {
  Object = Object;

  @Input() itemData: IRealTimeItem | null = null;

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
    private cookieService: CookieService,
    private activatedRoute: ActivatedRoute
  ) { }

  async ngOnInit() {
    await this.initComponent();
  }

  private async initComponent() {
    if (this.itemData === null) {
      const itemId = this.activatedRoute.snapshot.paramMap.get('id') || '';
      const item = this.loadItemData(itemId);
      this.itemData = item ? item : {} as IRealTimeItem;
    }
  }

  // Método para cargar itemData desde la URL
  private loadItemData(itemId: string): IRealTimeItem | null {
    const itemsListData = JSON.parse(localStorage.getItem('config') || '').list.items;

    if (itemsListData) {
      const itemData = Object.values(itemsListData).flat().find((item: any) => item.id === itemId) as IRealTimeItem;
      return itemData || null;
    }

    return null;
  }

  toggleImage() {
    if (this.itemData) {
      this.currentImage = this.currentImage === this.itemData.documentacion.fotoBelleza
        ? this.itemData.documentacion.fotoCalle
        : this.itemData.documentacion.fotoBelleza;
    }
  }

  saveAnotaciones() {
    if (this.itemData) {
      this.firebaseStorageService.addAnotation({ candidata: this.itemData.id, anotacion: this.anotaciones }, this.idUsuario, this.itemData.id);
    }
  }

  loadAnotation() {
    if (localStorage.getItem('itemsListData')) {
      const itemsListData = localStorage.getItem('itemsListData');
      if (itemsListData) {
        const parsedData = JSON.parse(itemsListData);
        this.anotaciones = parsedData.anotaciones?.find((anotacion: any) => anotacion.candidata === this.itemData?.id)?.anotacion || '';
      } else {
        this.anotaciones = '';
      }
    }
  }
}
