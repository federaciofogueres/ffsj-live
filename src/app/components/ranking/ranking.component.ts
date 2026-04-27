import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FfsjSpinnerComponent } from 'ffsj-web-components';
import { IRealTimeItem } from '../../model/real-time-config.model';
import { FirebaseStorageService } from '../../services/storage.service';
import { ffsjDebugLog } from '../../utils/debug-log';
import { getDefaultCandidataImage, resolveCandidataImage } from '../../utils/candidata-images';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [
    CommonModule,
    FfsjSpinnerComponent
  ],
  templateUrl: './ranking.component.html',
  styleUrl: './ranking.component.scss'
})
export class RankingComponent implements OnInit {
  rankingItems: IRealTimeItem[] = [];
  loading = true;
  readonly defaultImage = getDefaultCandidataImage();
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private firebaseStorageService: FirebaseStorageService
  ) { }

  ngOnInit(): void {
    this.firebaseStorageService.realtimeData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        const items = data?.list?.items || [];
        this.rankingItems = [...items].sort(
          (a: IRealTimeItem, b: IRealTimeItem) => (b.favoriteCount || 0) - (a.favoriteCount || 0)
        );
        this.loading = false;
      });
  }

  getCandidataImage(item: IRealTimeItem): string {
    return resolveCandidataImage(
      item.documentacion?.fotoBelleza,
      item.informacionPersonal?.tipoCandidata,
      item.vidaEnFogueres?.asociacion_order,
      'belleza',
      item.documentacion?.fotoThumbBelleza
    );
  }

  handleImageLoad(event: Event, item: IRealTimeItem): void {
    const image = event.target as HTMLImageElement;
    ffsjDebugLog('image', 'ranking cargada', {
      id: item.id,
      nombre: item.informacionPersonal?.nombre,
      currentSrc: image.currentSrc || image.src,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      renderedWidth: image.clientWidth,
      renderedHeight: image.clientHeight
    });
  }
}
