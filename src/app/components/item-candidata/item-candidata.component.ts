import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { AuthService, FfsjSpinnerComponent } from 'ffsj-web-components';
import { IRealTimeItem } from '../../model/real-time-config.model';
import { FirebaseStorageService } from '../../services/storage.service';
import { ffsjDebugLog } from '../../utils/debug-log';
import { getDefaultCandidataImage, resolveCandidataImage } from '../../utils/candidata-images';

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
  alternateImageUrl: string = '';
  isFlipped: boolean = false;
  currentImage: string = '';
  imageLoading = false;
  private pendingImageLoads = 0;
  anotaciones: string = '';
  isTelefono: boolean = false;

  idUsuario: string = '';
  parsedCurriculum: any[] = [];
  itemsList: IRealTimeItem[] = [];
  favoriteMarked = false;
  favoriteUpdating = false;
  userAdmin = false;
  readonly defaultImage = getDefaultCandidataImage();

  constructor(
    private breakpointObserver: BreakpointObserver,
    private firebaseStorageService: FirebaseStorageService,
    private authService: AuthService,
    private cookieService: CookieService,
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  async ngOnInit() {
    this.loading = true;
    this.userAdmin = this.authService.getCargos().some((cargo: { idCargo: number }) => cargo.idCargo === 16);
    this.breakpointObserver
      .observe(['(max-width: 768px)'])
      .subscribe((state: BreakpointState) => {
        this.isTelefono = state.matches;
      });

    this.initComponent();
  }

  private updateImages() {
    this.startImageLoading();
    this.currentImage = resolveCandidataImage(
      this._itemData?.documentacion?.fotoBelleza,
      this._itemData?.informacionPersonal?.tipoCandidata,
      this._itemData?.vidaEnFogueres?.asociacion_order,
      'belleza',
      this._itemData?.documentacion?.fotoLargeBelleza
    );
    this.alternateImageUrl = resolveCandidataImage(
      this._itemData?.documentacion?.fotoCalle,
      this._itemData?.informacionPersonal?.tipoCandidata,
      this._itemData?.vidaEnFogueres?.asociacion_order,
      'calle',
      this._itemData?.documentacion?.fotoLargeCalle
    );
    ffsjDebugLog('image', 'detalle resuelta', {
      id: this._itemData?.id,
      nombre: this._itemData?.informacionPersonal?.nombre,
      selected: this.currentImage,
      alternate: this.alternateImageUrl,
      bellezaLarge: this._itemData?.documentacion?.fotoLargeBelleza || null,
      calleLarge: this._itemData?.documentacion?.fotoLargeCalle || null,
      bellezaOriginal: this._itemData?.documentacion?.fotoBelleza || null,
      calleOriginal: this._itemData?.documentacion?.fotoCalle || null
    });
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
        this.favoriteMarked = this.isFavoriteMarked();
        this.updateImages();
        this.loading = false;
      }
    });
  }

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
      this.startImageLoading();
      this.currentImage = this.currentImage === this.alternateImageUrl
        ? resolveCandidataImage(
          this.itemData.documentacion?.fotoBelleza,
          this.itemData.informacionPersonal?.tipoCandidata,
          this.itemData.vidaEnFogueres?.asociacion_order,
          'belleza',
          this.itemData.documentacion?.fotoLargeBelleza
        )
        : this.alternateImageUrl;
    }
    this.cdr.detectChanges();
  }

  handleImageError(): void {
    ffsjDebugLog('image', 'detalle error, usando default', {
      id: this.itemData?.id,
      failed: this.currentImage
    });
    this.currentImage = this.defaultImage;
    this.alternateImageUrl = this.defaultImage;
    this.finishImageLoading();
    this.cdr.detectChanges();
  }

  handleImageLoad(event: Event, context: string): void {
    const image = event.target as HTMLImageElement;
    this.finishImageLoading();
    ffsjDebugLog('image', `${context} cargada`, {
      id: this.itemData?.id,
      nombre: this.itemData?.informacionPersonal?.nombre,
      currentSrc: image.currentSrc || image.src,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      renderedWidth: image.clientWidth,
      renderedHeight: image.clientHeight
    });
  }

  private startImageLoading(): void {
    this.pendingImageLoads = this.isTelefono ? 1 : 2;
    this.imageLoading = true;
  }

  private finishImageLoading(): void {
    this.pendingImageLoads = Math.max(this.pendingImageLoads - 1, 0);
    this.imageLoading = this.pendingImageLoads > 0;
  }

  async toggleFavorite(): Promise<void> {
    if (!this.itemData?.id || this.favoriteUpdating) {
      return;
    }

    const previousValue = this.favoriteMarked;
    const nextValue = !previousValue;
    this.favoriteUpdating = true;
    this.favoriteMarked = nextValue;
    this.saveFavoriteState(nextValue);

    try {
      await this.firebaseStorageService.setCandidataFavorite(this.itemData.id, nextValue);
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
    return `ffsj-live.favorite.${this.itemData?.id || ''}`;
  }

  private canUseLocalStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }
}
