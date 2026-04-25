import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService, FfsjSpinnerComponent } from 'ffsj-web-components';
import { IRealTimeConfigModel, IRealTimeItem } from '../../model/real-time-config.model';
import { FirebaseStorageService } from '../../services/storage.service';
import { ItemCardComponent } from '../item-card/item-card.component';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    ItemCardComponent,
    FfsjSpinnerComponent,
    MatIconModule,
    ReactiveFormsModule
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
export class ListComponent {

  public config: IRealTimeConfigModel = {};
  public searchControl = new FormControl();
  public loading: boolean = true;
  public items: IRealTimeItem[] = [];
  public filteredItems: IRealTimeItem[] = [];
  public filterKeys: string[] = [];
  public userAdmin: boolean = false;
  public showOnlyFavorites: boolean = false;

  constructor(
    protected router: Router,
    private firebaseStorageService: FirebaseStorageService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.userAdmin = this.authService.getCargos().some((cargo: { idCargo: number }) => cargo.idCargo === 16);
    this.loadData();
  }

  async loadData() {
    this.firebaseStorageService.realtimeData$.subscribe((data) => {
      if (data) {
        this.config = data;
        this.items = this.config.list?.items || [];
        this.filterKeys = this.config.list?.filterKeys || [];
        this.applyFilters();
        this.loading = false;
      }
    });
    this.loading = false;
  }

  filterItems(value: Event): void {
    this.searchControl.setValue((value.target as HTMLInputElement).value, { emitEvent: false });
    this.applyFilters();
  }

  toggleFavoritesFilter(): void {
    this.showOnlyFavorites = !this.showOnlyFavorites;
    this.applyFilters();
  }

  private applyFilters(): void {
    const lowerValue = this.searchControl.value?.toString().toLowerCase() || '';

    this.filteredItems = this.items.filter((item) => {
      const matchesFavorite = !this.showOnlyFavorites || this.isFavoriteMarked(item);
      const matchesSearch = !lowerValue || this.filterKeys.some((key) => {
        const fieldValue = this.getFieldValue(item, key)?.toString()?.toLowerCase() || '';
        return fieldValue.includes(lowerValue);
      });

      return matchesFavorite && matchesSearch;
    });
  }

  private isFavoriteMarked(item: IRealTimeItem): boolean {
    if (typeof localStorage === 'undefined') {
      return false;
    }

    return localStorage.getItem(`ffsj-live.favorite.${item.id}`) === 'true';
  }

  private getFieldValue(item: IRealTimeItem, key: string): any {
    const keys = key.split('.'); // Divide la clave en partes
    return keys.reduce((acc: any, curr) => acc && acc[curr], item); // Navega por las propiedades anidadas
  }

}
