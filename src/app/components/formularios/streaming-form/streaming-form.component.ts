import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-streaming-form',
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
  templateUrl: './streaming-form.component.html',
  styleUrl: './streaming-form.component.scss'
})
export class StreamingFormComponent {
  @Input() streamingForm!: FormGroup; // Recibe el formulario desde el componente padre
  @Output() formSubmit = new EventEmitter<FormGroup>(); // Emite el formulario al enviarlo

  constructor(private fb: FormBuilder) { }

  onSubmit(): void {
    this.formSubmit.emit(this.streamingForm); // Emite el formulario al componente padre
  }
}
