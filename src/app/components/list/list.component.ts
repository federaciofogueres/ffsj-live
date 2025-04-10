import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { FfsjSpinnerComponent } from 'ffsj-web-components';
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

  constructor(
    protected router: Router,
    private firebaseStorageService: FirebaseStorageService
  ) { }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.config = await this.firebaseStorageService.getRealtimeData('config');
    this.items = this.config.list?.items || [];
    this.filteredItems = this.items;
    this.filterKeys = this.config.list?.filterKeys || [];
    this.loading = false;
    console.log(this.config);
  }

  filterItems(value: Event): void {
    const lowerValue = (value.target as HTMLInputElement).value.toLowerCase() || '';
    this.filteredItems = this.items.filter((item) =>
      this.filterKeys.some((key) => {
        const fieldValue = this.getFieldValue(item, key)?.toString()?.toLowerCase() || '';
        return fieldValue.includes(lowerValue);
      })
    );
  }

  private getFieldValue(item: IRealTimeItem, key: string): any {
    const keys = key.split('.'); // Divide la clave en partes
    return keys.reduce((acc: any, curr) => acc && acc[curr], item); // Navega por las propiedades anidadas
  }

}
