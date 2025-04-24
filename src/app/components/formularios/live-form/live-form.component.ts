import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FfsjAlertService } from 'ffsj-web-components';
import { IRealTimeList } from '../../../model/real-time-config.model';
import { FirebaseStorageService } from '../../../services/storage.service';
import { ItemCardComponent } from '../../item-card/item-card.component';

@Component({
  selector: 'app-live-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSlideToggleModule,
    DragDropModule,
    ItemCardComponent
  ],
  templateUrl: './live-form.component.html',
  styleUrl: './live-form.component.scss'
})
export class LiveFormComponent {
  @Input() liveForm!: FormGroup;
  @Input() itemList!: IRealTimeList;
  @Input() liveItemId: number = 0;
  @Output() formSubmit = new EventEmitter<FormGroup>();
  @Output() itemChange = new EventEmitter<number>();

  constructor(
    private fb: FormBuilder,
    private firebaseStorageService: FirebaseStorageService,
    private ffsjAlertService: FfsjAlertService
  ) { }

  get liveItemControl(): FormControl {
    return this.liveForm.get('item') as FormControl;
  }

  get imagenes(): FormArray {
    return this.liveForm.get('imagenes') as FormArray;
  }

  updateItem(itemId: number): void {
    this.liveItemId = itemId;
    const item = this.itemList.items[this.liveItemId] || this.itemList.items[0];
    this.liveForm.get('item')?.setValue(item);
    this.formSubmit.emit(this.liveForm);
  }

  handleSelect(event: any) {
    console.log(event.target.value.vidaEnFogueres.asociacion_label);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.firebaseStorageService.uploadImage(file, 'imagenes').then((url) => {
        if (url) {
          this.imagenes.push(this.fb.control(url));
          input.value = '';
        }
      }).catch((error) => {
        this.ffsjAlertService.danger('Error al subir la imagen:', error);
      });
    }
  }

  removeItem(index: number, url: string): void {
    this.imagenes.removeAt(index);
    this.firebaseStorageService.deleteImage(url).then(() => {
      this.ffsjAlertService.success(`Imagen eliminada del almacenamiento: ${url}`);
    }).catch((error) => {
      this.ffsjAlertService.danger('Error al eliminar la imagen del almacenamiento:', error);
    });
  }

}
