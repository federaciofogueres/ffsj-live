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
  selector: 'app-votaciones-form',
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
  templateUrl: './votaciones-form.component.html',
  styleUrls: ['./votaciones-form.component.scss']
})
export class VotacionesFormComponent {
  @Input() votacionesForm!: FormGroup;
  @Output() formSubmit = new EventEmitter<FormGroup>();

  nuevaCandidatura = this.fb.group({
    label: [''],
    votes: [0],
    maxVotes: [0]
  });

  constructor(
    private fb: FormBuilder,
    private firebaseStorageService: FirebaseStorageService,
    private ffsjAlertService: FfsjAlertService
  ) { }

  get candidaturas(): FormArray {
    return this.votacionesForm.get('candidaturas') as FormArray;
  }

  get labelControl(): FormControl {
    return this.nuevaCandidatura.get('label') as FormControl;
  }

  get votesControl(): FormControl {
    return this.nuevaCandidatura.get('votes') as FormControl;
  }

  private recalcularMaxVotes(): void {
    const totalEmitidos = this.votacionesForm.get('totalVotes')?.value || 0;

    const votosContados = this.candidaturas.controls.reduce((acc, c) => {
      return acc + (c.get('votes')?.value || 0);
    }, 0);

    const votosRestantes = Math.max(0, totalEmitidos - votosContados);

    this.candidaturas.controls.forEach(c => {
      const votosActuales = c.get('votes')?.value || 0;
      const maxVotes = votosActuales + votosRestantes;
      c.get('maxVotes')?.setValue(maxVotes);
    });
  }


  removeCandidatura(index: number): void {
    this.candidaturas.removeAt(index);
    this.recalcularMaxVotes();
    this.formSubmit.emit(this.votacionesForm);
  }

  changeVotes(candidatura: any, votes: number): void {
    const newVotes = Math.max(0, votes);
    candidatura.get('votes')?.setValue(newVotes);
    this.recalcularMaxVotes();
    this.formSubmit.emit(this.votacionesForm);
  }

  addCandidatura(): void {
    const candidatura = this.nuevaCandidatura.value;
    if (candidatura.label?.trim()) {
      this.candidaturas.push(this.fb.group(candidatura));
      this.recalcularMaxVotes();
      this.formSubmit.emit(this.votacionesForm);
      this.nuevaCandidatura.reset();
    }
  }

}