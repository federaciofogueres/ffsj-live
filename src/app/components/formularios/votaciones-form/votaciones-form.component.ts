import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Input, Output, SimpleChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FfsjAlertService } from 'ffsj-web-components';
import { FirebaseStorageService } from '../../../services/storage.service';
import { merge } from 'rxjs';
import { IRealTimeVotacion } from '../../../model/real-time-config.model';

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
  @Input() votacionesList: IRealTimeVotacion[] = [];
  @Input() selectedVotacionId: string = '';
  @Output() formSubmit = new EventEmitter<FormGroup>();
  @Output() votacionSelected = new EventEmitter<string>();
  @Output() createVotacion = new EventEmitter<void>();

  private readonly destroyRef = inject(DestroyRef);
  activeTab: 'info' | 'opciones' | 'votacion' = 'info';
  currentTypeControl = new FormControl('simple', { nonNullable: true });
  private currentType: 'simple' | 'multiple' | 'jurado' = 'simple';
  showCandidaturas = true;
  editingIndex: number | null = null;

  nuevaCandidatura = this.fb.group({
    type: ['simple', Validators.required],
    label: [''],
    votes: [0, [Validators.min(0)]],
    maxVotes: [0, [Validators.min(0)]],
    fields: this.fb.array([]),
    jurado: this.fb.group({
      nombre: [''],
      foguera: [''],
      imagen: ['']
    })
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

  get typeControl(): FormControl {
    return this.currentTypeControl;
  }

  get fieldsControls(): FormArray {
    return this.nuevaCandidatura.get('fields') as FormArray;
  }

  get juradoGroup(): FormGroup {
    return this.nuevaCandidatura.get('jurado') as FormGroup;
  }

  setTab(tab: 'info' | 'opciones' | 'votacion'): void {
    this.activeTab = tab;
  }

  onVotacionChange(value: string): void {
    this.votacionSelected.emit(value);
  }

  onCreateVotacion(): void {
    this.createVotacion.emit();
  }

  toggleCandidaturas(): void {
    this.showCandidaturas = !this.showCandidaturas;
  }

  getCandidaturaType(candidatura: AbstractControl): 'simple' | 'multiple' | 'jurado' {
    const type = (candidatura as FormGroup).get('type')?.value || 'simple';
    if (type === 'multiple' || type === 'jurado') return type;
    return 'simple';
  }

  getCandidaturaFields(candidatura: AbstractControl): FormArray {
    return (candidatura as FormGroup).get('fields') as FormArray;
  }

  getCandidaturaJurado(candidatura: AbstractControl): FormGroup {
    return (candidatura as FormGroup).get('jurado') as FormGroup;
  }

  ngOnInit() {
    const totalVotesControl = this.votacionesForm.get('totalVotes');
    const voteOptionsControl = this.votacionesForm.get('voteOptions');

    if (totalVotesControl && voteOptionsControl) {
      totalVotesControl.setValidators([Validators.required, Validators.min(0)]);
      voteOptionsControl.setValidators([Validators.required, Validators.min(1)]);
      totalVotesControl.updateValueAndValidity({ emitEvent: false });
      voteOptionsControl.updateValueAndValidity({ emitEvent: false });

      merge(totalVotesControl.valueChanges, voteOptionsControl.valueChanges)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.recalcularMaxVotes());
    }

    const winnersCountControl = this.votacionesForm.get('winnersCount');
    if (winnersCountControl) {
      winnersCountControl.setValidators([Validators.required, Validators.min(1)]);
      winnersCountControl.updateValueAndValidity({ emitEvent: false });
    }

    this.initializeTipoCandidatura();
    this.currentTypeControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => this.handleTipoCandidaturaChange(value));

    this.recalcularMaxVotes();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['votacionesForm'] && this.votacionesForm) {
      this.initializeTipoCandidatura();
      this.recalcularMaxVotes();
    }
  }

  private recalcularMaxVotes(): void {
    const totalPapeletas = Number(this.votacionesForm.get('totalVotes')?.value) || 0;
    const opcionesVoto = Number(this.votacionesForm.get('voteOptions')?.value) || 1;
    const totalVotosPosibles = totalPapeletas * opcionesVoto;

    const votosContados = this.candidaturas.controls.reduce((acc, c) => {
      return acc + (c.get('votes')?.value || 0);
    }, 0);

    const votosRestantes = Math.max(0, totalVotosPosibles - votosContados);

    this.candidaturas.controls.forEach(c => {
      const votosActuales = c.get('votes')?.value || 0;
      const maxVotes = Math.min(totalPapeletas, votosActuales + votosRestantes);
      c.get('maxVotes')?.setValue(maxVotes);
    });
  }

  removeCandidatura(index: number): void {
    this.candidaturas.removeAt(index);
    if (this.editingIndex === index) {
      this.editingIndex = null;
      this.resetNuevaCandidatura();
    } else if (this.editingIndex !== null && index < this.editingIndex) {
      this.editingIndex -= 1;
    }
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
    const type = this.currentType;

    if (this.editingIndex !== null) {
      this.updateCandidatura(this.editingIndex, candidatura);
      this.recalcularMaxVotes();
      this.formSubmit.emit(this.votacionesForm);
      this.editingIndex = null;
      this.resetNuevaCandidatura();
      return;
    }

    if (type === 'simple' && !candidatura.label?.trim()) {
      return;
    }

    if (type === 'multiple' && this.fieldsControls.length === 0) {
      return;
    }

    if (type === 'jurado') {
      const jurado = this.juradoGroup.value;
      if (!jurado?.nombre?.trim() || !jurado?.foguera?.trim()) {
        return;
      }
    }

    if (type === 'multiple') {
      const invalidField = this.fieldsControls.controls.some(control => {
        const field = control as FormGroup;
        const key = field.get('key')?.value || '';
        const inputType = field.get('inputType')?.value || 'text';
        const value = field.get('value')?.value;
        if (!String(key).trim()) {
          return true;
        }
        if (inputType === 'image') {
          return !String(value || '').trim();
        }
        return !String(value || '').trim();
      });

      if (invalidField) {
        return;
      }
    }

    this.candidaturas.push(this.fb.group({
      type: [type],
      label: [candidatura.label || ''],
      votes: [candidatura.votes || 0],
      maxVotes: [candidatura.maxVotes || 0],
      fields: this.createFieldsArray(this.fieldsControls.value || []),
      jurado: this.fb.group({
        nombre: [this.juradoGroup.get('nombre')?.value || ''],
        foguera: [this.juradoGroup.get('foguera')?.value || ''],
        imagen: [this.juradoGroup.get('imagen')?.value || '']
      })
    }));
    this.recalcularMaxVotes();
    this.formSubmit.emit(this.votacionesForm);
    this.resetNuevaCandidatura();
  }

  editCandidatura(candidatura: AbstractControl, index: number): void {
    const group = candidatura as FormGroup;
    this.editingIndex = index;
    this.activeTab = 'opciones';

    this.nuevaCandidatura.patchValue({
      type: this.currentType,
      label: group.get('label')?.value || '',
      votes: group.get('votes')?.value || 0,
      maxVotes: group.get('maxVotes')?.value || 0
    });

    this.fieldsControls.clear();
    const fields = (group.get('fields')?.value || []) as any[];
    fields.forEach(field => {
      this.fieldsControls.push(this.fb.group({
        key: [field.key || '', Validators.required],
        value: [field.value ?? '', Validators.required],
        inputType: [field.inputType || 'text']
      }));
    });

    const jurado = group.get('jurado')?.value || {};
    this.juradoGroup.patchValue({
      nombre: jurado.nombre || '',
      foguera: jurado.foguera || '',
      imagen: jurado.imagen || ''
    });
  }

  addField(): void {
    this.fieldsControls.push(this.fb.group({
      key: ['', Validators.required],
      value: ['', Validators.required],
      inputType: ['text']
    }));
  }

  removeField(index: number): void {
    this.fieldsControls.removeAt(index);
  }

  onJuradoImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.firebaseStorageService.uploadImage(file, 'votaciones/jurado').then((url) => {
      if (url) {
        this.juradoGroup.get('imagen')?.setValue(url);
      }
    }).catch((error) => {
      this.ffsjAlertService.danger('Error al subir la imagen: ' + String(error));
    });
  }

  onFieldImageSelected(event: Event, fieldGroup: AbstractControl): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.firebaseStorageService.uploadImage(file, 'votaciones/fields').then((url) => {
      if (url) {
        (fieldGroup as FormGroup).get('value')?.setValue(url);
      }
    }).catch((error) => {
      this.ffsjAlertService.danger('Error al subir la imagen: ' + String(error));
    });
  }

  getCandidaturaLabel(candidatura: AbstractControl): string {
    const group = candidatura as FormGroup;
    const type = group.get('type')?.value || 'simple';
    if (type === 'jurado') {
      const jurado = group.get('jurado')?.value || {};
      const nombre = jurado.nombre || '';
      const foguera = jurado.foguera || '';
      return `${nombre}${foguera ? ' - ' + foguera : ''}`.trim() || 'Jurado';
    }

    if (type === 'multiple') {
      const label = group.get('label')?.value || '';
      if (label) return label;
      const fields = group.get('fields')?.value || [];
      const firstField = fields[0];
      if (firstField?.value) return String(firstField.value);
      return 'Opcion multiple';
    }

    return group.get('label')?.value || 'Candidatura';
  }

  private createFieldsArray(fields: any[]): FormArray {
    return this.fb.array(
      fields.map(field => this.fb.group({
        key: [field.key || '', Validators.required],
        value: [field.value ?? '', Validators.required],
        inputType: [field.inputType || 'text']
      }))
    );
  }

  private resetNuevaCandidatura(): void {
    this.nuevaCandidatura.reset({
      type: this.currentType,
      label: '',
      votes: 0,
      maxVotes: 0
    });
    this.fieldsControls.clear();
    this.juradoGroup.reset({
      nombre: '',
      foguera: '',
      imagen: ''
    });
  }

  private initializeTipoCandidatura(): void {
    const existingType = this.getExistingCandidaturaType();
    this.currentType = existingType;
    this.currentTypeControl.setValue(existingType, { emitEvent: false });
    this.nuevaCandidatura.get('type')?.setValue(existingType, { emitEvent: false });
    this.normalizeExistingCandidaturas(existingType);
  }

  private handleTipoCandidaturaChange(nextType: string): void {
    const newType = (nextType || 'simple') as 'simple' | 'multiple' | 'jurado';
    if (newType === this.currentType) {
      return;
    }

    if (this.candidaturas.length > 0) {
      const confirmed = window.confirm(
        'Aviso, va a modificar el tipo de candidatura actual, borrará el resto de candidaturas'
      );
      if (!confirmed) {
        this.currentTypeControl.setValue(this.currentType, { emitEvent: false });
        return;
      }

      this.clearCandidaturas();
      this.editingIndex = null;
      this.recalcularMaxVotes();
      this.formSubmit.emit(this.votacionesForm);
    }

    this.currentType = newType;
    this.nuevaCandidatura.get('type')?.setValue(newType, { emitEvent: false });
    this.resetNuevaCandidaturaForType();
  }

  private getExistingCandidaturaType(): 'simple' | 'multiple' | 'jurado' {
    const first = this.candidaturas.at(0) as FormGroup | undefined;
    const type = first?.get('type')?.value;
    if (type === 'multiple' || type === 'jurado' || type === 'simple') {
      return type;
    }
    return 'simple';
  }

  private normalizeExistingCandidaturas(type: 'simple' | 'multiple' | 'jurado'): void {
    this.candidaturas.controls.forEach(control => {
      (control as FormGroup).get('type')?.setValue(type, { emitEvent: false });
    });
  }

  private clearCandidaturas(): void {
    while (this.candidaturas.length) {
      this.candidaturas.removeAt(0);
    }
  }

  private updateCandidatura(index: number, candidatura: any): void {
    const group = this.candidaturas.at(index) as FormGroup;
    group.get('label')?.setValue(candidatura.label || '');
    group.get('type')?.setValue(this.currentType);

    const existingFields = group.get('fields') as FormArray;
    existingFields.clear();
    const fields = this.fieldsControls.value || [];
    fields.forEach((field: any) => {
      existingFields.push(this.fb.group({
        key: [field.key || '', Validators.required],
        value: [field.value ?? '', Validators.required],
        inputType: [field.inputType || 'text']
      }));
    });

    const juradoGroup = group.get('jurado') as FormGroup;
    juradoGroup.patchValue({
      nombre: this.juradoGroup.get('nombre')?.value || '',
      foguera: this.juradoGroup.get('foguera')?.value || '',
      imagen: this.juradoGroup.get('imagen')?.value || ''
    });
  }

  private resetNuevaCandidaturaForType(): void {
    this.fieldsControls.clear();
    this.juradoGroup.reset({
      nombre: '',
      foguera: '',
      imagen: ''
    });
    this.nuevaCandidatura.patchValue({
      type: this.currentType,
      label: '',
      votes: 0,
      maxVotes: 0
    });
  }
}
