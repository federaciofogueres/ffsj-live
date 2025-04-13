import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { IRealTimeItem } from '../../model/real-time-config.model';

import { ItemCandidataComponent } from '../item-candidata/item-candidata.component';

@Component({
  selector: 'app-item',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatTabsModule,
    ItemCandidataComponent
  ],
  templateUrl: './item.component.html',
  styleUrl: './item.component.scss'
})
export class ItemComponent {

  @Input() itemData: IRealTimeItem | null = null;

}
