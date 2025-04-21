import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-info-form',
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
  templateUrl: './info-form.component.html',
  styleUrls: ['./info-form.component.scss']
})
export class InfoFormComponent {
  @Input() infoForm!: FormGroup;
  @Output() formSubmit = new EventEmitter<FormGroup>();

  nuevoPresentador = this.fb.group({
    nombre: [''],
    src: [''],
    info: ['']
  });

  nuevoEventoControl = new FormControl('');

  constructor(private fb: FormBuilder) { }

  get presentadores(): FormArray {
    return this.infoForm.get('presentadores') as FormArray;
  }

  get eventos(): FormArray {
    return this.infoForm.get('eventos') as FormArray;
  }

  get nombreControl(): FormControl {
    return this.nuevoPresentador.get('nombre') as FormControl;
  }

  get infoControl(): FormControl {
    return this.nuevoPresentador.get('info') as FormControl;
  }

  get srcControl(): FormControl {
    return this.nuevoPresentador.get('src') as FormControl;
  }

  addPresentador(): void {
    const presentador = this.nuevoPresentador.value;
    if (presentador.nombre?.trim() && presentador.src?.trim() && presentador.info?.trim()) {
      this.presentadores.push(this.fb.group(presentador));
      this.nuevoPresentador.reset();
    }
  }

  removePresentador(index: number): void {
    this.presentadores.removeAt(index);
  }

  addEvento(): void {
    const nuevoEvento = this.nuevoEventoControl.value!;
    if (nuevoEvento.trim()) {
      this.eventos.push(this.fb.control(nuevoEvento));
      this.nuevoEventoControl.reset();
    }
  }

  removeEvento(index: number): void {
    this.eventos.removeAt(index);
  }

  onSubmit(): void {
    this.formSubmit.emit(this.infoForm);
  }
}