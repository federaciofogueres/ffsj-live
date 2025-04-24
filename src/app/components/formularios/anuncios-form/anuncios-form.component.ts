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
import { FirebaseStorageService } from '../../../services/storage.service';

@Component({
  selector: 'app-anuncios-form',
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
    DragDropModule
  ],
  templateUrl: './anuncios-form.component.html',
  styleUrl: './anuncios-form.component.scss'
})
export class AnunciosFormComponent {
  @Input() anunciosForm!: FormGroup; // Recibe el formulario desde el componente padre
  @Output() formSubmit = new EventEmitter<FormGroup>(); // Emite el formulario al enviarlo
  @Output() removeAnuncio = new EventEmitter<number>(); // Emite el índice del anuncio a eliminar

  nuevoAnuncioControl = new FormControl('');

  constructor(
    private firebaseStorageService: FirebaseStorageService,
    private fb: FormBuilder,
    private ffsjAlertService: FfsjAlertService
  ) { }


  get anuncios(): FormArray {
    return this.anunciosForm.get('anuncios') as FormArray;
  }

  addAnuncio(): void {
    const nuevoAnuncio = this.nuevoAnuncioControl.value;
    if (nuevoAnuncio && nuevoAnuncio.trim()) {
      this.anuncios.push(this.fb.control(nuevoAnuncio));
      this.nuevoAnuncioControl.reset();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.firebaseStorageService.uploadImage(file, 'anuncios').then((url) => {
        if (url) {
          this.anuncios.push(this.fb.control(url));
        }
      }).catch((error) => {
        this.ffsjAlertService.danger('Error al subir la imagen:', error);
      });
    }
  }

  removeAdd(index: number, url: string): void {
    this.anuncios.removeAt(index);
    this.firebaseStorageService.deleteImage(url).then(() => {
      this.ffsjAlertService.success(`Imagen eliminada del almacenamiento: ${url}`);
    }).catch((error) => {
      this.ffsjAlertService.danger('Error al eliminar la imagen del almacenamiento:', error);
    });
  }
}
