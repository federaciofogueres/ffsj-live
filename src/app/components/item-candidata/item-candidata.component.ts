import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { CookieService } from 'ngx-cookie-service';
import { IRealTimeItem } from '../../model/real-time-config.model';
import { FirebaseStorageService } from '../../services/storage.service';

import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { ActivatedRoute } from '@angular/router';
import { FfsjSpinnerComponent } from 'ffsj-web-components';

@Component({
  selector: 'app-item-candidata',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatTabsModule,
    FfsjSpinnerComponent
  ],
  templateUrl: './item-candidata.component.html',
  styleUrl: './item-candidata.component.scss'
})
export class ItemCandidataComponent {
  Object = Object;

  @Input() set itemData(value: IRealTimeItem | null) {
    this._itemData = value;
    if (this._itemData) {
      this.updateImages();
    }
  }
  get itemData(): IRealTimeItem | null {
    return this._itemData;
  }
  private _itemData: IRealTimeItem | null = null;

  isLive: boolean = true;
  loading: boolean = false;

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
  parsedCurriculum: any[] = [];
  itemsList: IRealTimeItem[] = [];

  constructor(
    private breakpointObserver: BreakpointObserver,
    private firebaseStorageService: FirebaseStorageService,
    private cookieService: CookieService,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    this.loading = true;
    this.breakpointObserver
      .observe(['(max-width: 768px)'])
      .subscribe((state: BreakpointState) => {
        this.isTelefono = state.matches;
      });

    this.initComponent();
  }

  private updateImages() {
    this.currentImage = this._itemData?.documentacion?.fotoBelleza || '';
    this.alternateImageUrl = this._itemData?.documentacion?.fotoCalle || '';

    // Forzar la detección de cambios si es necesario
    this.cdr.detectChanges();
  }

  private initComponent() {
    this.firebaseStorageService.realtimeData$.subscribe((data) => {
      if (data) {
        const config = data;
        this.itemsList = config.list.items;
        if (this.itemData === null) {
          this.isLive = false;
          const itemId = this.activatedRoute.snapshot.paramMap.get('id') || '';
          const item = this.loadItemData(itemId);
          this.itemData = item ? item : {} as IRealTimeItem;
        } else {
          this.isLive = true;
        }
        this.parseCurriculum();
        this.currentImage = this.itemData?.documentacion?.fotoBelleza || '';
        this.alternateImageUrl = this.itemData?.documentacion?.fotoCalle || '';
        this.loading = false;
      }
    });
  }

  // Método para cargar itemData desde la URL
  private loadItemData(itemId: string): IRealTimeItem | null {
    const itemData = Object.values(this.itemsList).flat().find((item: any) => item.id === itemId) as IRealTimeItem;
    return itemData || null;
  }

  parseCurriculum() {
    if (this.itemData?.vidaEnFogueres?.curriculum) {
      try {
        this.parsedCurriculum = JSON.parse(this.itemData.vidaEnFogueres.curriculum);
      } catch (error) {
        console.error('Error al parsear el curriculum festero:', error);
      }
    }
  }

  toggleImage() {
    if (this.itemData) {
      this.currentImage = this.currentImage === this.itemData.documentacion.fotoBelleza
        ? this.itemData.documentacion.fotoCalle
        : this.itemData.documentacion.fotoBelleza;
    }
    // Forzar la detección de cambios
    this.cdr.detectChanges();
  }

}
