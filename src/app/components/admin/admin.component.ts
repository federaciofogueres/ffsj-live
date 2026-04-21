import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FfsjAlertService } from 'ffsj-web-components';
import { IRealTimeConfigModel, IRealTimeList, IRealTimeVotacion } from '../../model/real-time-config.model';
import { FirebaseStorageService } from '../../services/storage.service';
import { AnunciosFormComponent } from '../formularios/anuncios-form/anuncios-form.component';
import { InfoFormComponent } from '../formularios/info-form/info-form.component';
import { ListFormComponent } from '../formularios/list-form/list-form.component';
import { ListOptionsFormComponent } from '../formularios/list-options-form/list-options-form.component';
import { LiveFormComponent } from '../formularios/live-form/live-form.component';
import { StreamingFormComponent } from '../formularios/streaming-form/streaming-form.component';
import { VotacionesFormComponent } from '../formularios/votaciones-form/votaciones-form.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    AnunciosFormComponent,
    InfoFormComponent,
    LiveFormComponent,
    ListFormComponent,
    ListOptionsFormComponent,
    VotacionesFormComponent,
    StreamingFormComponent,
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
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  Array = Array;
  public infoForm!: FormGroup;
  public streamingForm!: FormGroup;
  public liveForm!: FormGroup;
  public listForm!: FormGroup;
  public anunciosForm!: FormGroup;
  public votacionesForm!: FormGroup;
  public votacionesList: IRealTimeVotacion[] = [];
  public selectedVotacionId: string = '';

  public liveItemId: number = 0;
  public itemList!: IRealTimeList;

  protected _selectedView: string = 'votaciones';
  protected loading: boolean = true;
  config: IRealTimeConfigModel = {};

  constructor(
    private firebaseStorageService: FirebaseStorageService,
    private fb: FormBuilder,
    private ffsjAlertService: FfsjAlertService
  ) { }

  get selectedView(): string {
    return this._selectedView;
  }

  set selectedView(value: string) {
    this._selectedView = value;
    this.getData();
  }

  ngOnInit() {
    this.loading = true;
    this.initializeData();
  }

  ngOnChanges() {
    if (this.itemList?.items?.length) {
      const currentItem = this.liveForm.get('item')?.value;
      if (!currentItem || !this.itemList.items.some(item => item.id === currentItem.id)) {
        this.liveForm.get('item')?.setValue(this.itemList.items[0]);
      }
    }
  }

  async initializeData() {
    this.getData();
  }

  getData() {
    this.firebaseStorageService.realtimeData$.subscribe({
      next: (newValue) => {
        if (newValue) {
          this.config = newValue;
          this.prepareForms();
        }
      }
    });
  }

  private initializeFormGroup(config: any, fields: string[]): FormGroup {
    const group: any = {};
    fields.forEach(field => {
      group[field] = [config?.[field] || ''];
    });
    return this.fb.group(group);
  }

  createFormArray(items: any[], createGroupFn: (item: any) => FormGroup): FormArray {
    return this.fb.array(items.map(createGroupFn));
  }

  createControlArray(items: any[]): FormArray {
    return this.fb.array(items.map(item => this.fb.control(item)));
  }

  prepareInfoForm() {
    this.infoForm = this.initializeFormGroup(this.config.event, ['title', 'horario', 'demo']);
    this.infoForm.addControl('presentadores', this.createFormArray(
      this.config.event?.presentadores || [],
      (presentador: any) => this.fb.group({
        nombre: [presentador.nombre || ''],
        src: [presentador.src || ''],
        info: [presentador.info || '']
      })
    ));
    this.infoForm.addControl('eventos', this.createControlArray(this.config.event?.eventos || []));
  }

  prepareStreamingForm() {
    this.streamingForm = this.initializeFormGroup(this.config.streaming, ['title', 'subtitle', 'src', 'height', 'width']);
  }

  prepareLiveForm() {
    this.itemList = this.config.list!;
    const initialItem = this.itemList.items.find(item => item.id === this.config.live?.item?.id) || this.itemList.items[0];
    this.liveForm = this.initializeFormGroup(this.config.live, ['descripcion', 'tipo', 'titulo']);
    this.liveForm.addControl('imagenes', this.fb.array(
      Array.isArray(this.config.live?.imagenes)
        ? this.config.live.imagenes.map((anuncio: string) => this.fb.control(anuncio))
        : []
    ));
    this.liveForm.addControl('item', new FormControl(initialItem));
    this.liveForm.addControl('updateInterval', new FormControl(''));
    this.liveItemId = this.itemList.items.findIndex(item => item.id === this.config.live?.item?.id) ?? 0;
  }

  prepareListForm() {
    this.listForm = this.initializeFormGroup(this.config.list, ['title', 'searching']);
    this.listForm.addControl('items', new FormControl(this.config.list?.items || ''));
    this.listForm.addControl('filterKeys', this.fb.array(
      Array.isArray(this.config.list?.filterKeys)
        ? this.config.list.filterKeys.map((filter: string) => this.fb.control(filter))
        : []
    ));
  }

  prepareAnunciosForm() {
    this.anunciosForm = this.initializeFormGroup(this.config.anuncios, ['timing', 'activatedAdds', 'showAdds']);
    this.anunciosForm.addControl('anuncios', this.fb.array(
      Array.isArray(this.config.anuncios?.anuncios)
        ? this.config.anuncios.anuncios.map((anuncio: string) => this.fb.control(anuncio))
        : []
    ));
  }

  prepareVotacionesForm() {
    this.votacionesList = normalizeVotaciones(this.config.votaciones);
    if (!this.selectedVotacionId) {
      this.selectedVotacionId = this.votacionesList[0]?.id || '';
    }

    const selected = this.votacionesList.find(v => v.id === this.selectedVotacionId) ?? this.votacionesList[0];
    if (!selected) {
      this.votacionesForm = this.fb.group({});
      return;
    }

    this.votacionesForm = this.initializeFormGroup(selected, [
      'title',
      'totalVotes',
      'winnersCount',
      'voteOptions',
      'blankVotes',
      'nullVotes'
    ]);
    this.votacionesForm.patchValue({
      totalVotes: selected.totalVotes ?? 0,
      winnersCount: selected.winnersCount ?? 1,
      voteOptions: selected.voteOptions ?? 1,
      blankVotes: selected.blankVotes ?? 0,
      nullVotes: selected.nullVotes ?? 0
    });
    this.votacionesForm.addControl('ballots', this.createFormArray(
      selected.ballots || [],
      (ballot: any) => this.fb.group({
        selected: [ballot.selected || []],
        blanks: [ballot.blanks || 0],
        nulls: [ballot.nulls || 0],
        createdAt: [ballot.createdAt || 0]
      })
    ));
    this.votacionesForm.addControl('candidaturas', this.createFormArray(
      selected.candidaturas || [],
      (candidatura: any) => this.fb.group({
        type: [candidatura.type || 'simple'],
        label: [candidatura.label || candidatura.nombre || ''],
        votes: [candidatura.votes || 0],
        maxVotes: [candidatura.maxVotes || 0],
        fields: this.createFormArray(
          candidatura.fields || [],
          (field: any) => this.fb.group({
            key: [field.key || ''],
            value: [field.value ?? ''],
            inputType: [field.inputType || 'text']
          })
        ),
        jurado: this.fb.group({
          nombre: [candidatura.jurado?.nombre || ''],
          foguera: [candidatura.jurado?.foguera || ''],
          imagen: [candidatura.jurado?.imagen || '']
        })
      })
    ));
  }

  prepareForms() {
    this.prepareInfoForm();
    this.prepareStreamingForm();
    this.prepareLiveForm();
    this.prepareListForm();
    this.prepareAnunciosForm();
    this.prepareVotacionesForm();
    this.loading = false;
  }

  onItemListChange(updatedList: IRealTimeList): void {
    this.itemList = updatedList;
    this.listForm.controls['items'].setValue(updatedList.items);
    this.procesar(this.listForm, 'list');
  }

  procesar(form: FormGroup, type: string) {
    if (form.contains('activatedAdds')) {
      this.firebaseStorageService.setShowAdds();
    }

    if (type === 'votaciones') {
      const index = this.votacionesList.findIndex(v => v.id === this.selectedVotacionId);
      const payload: IRealTimeVotacion = {
        id: this.selectedVotacionId || generateVotacionId(form.get('title')?.value || ''),
        ...form.value
      };

      if (index >= 0) {
        this.votacionesList[index] = payload;
      } else {
        this.votacionesList.push(payload);
      }

      this.firebaseStorageService.setRealtimeData('config/votaciones', this.votacionesList).then(() => {
        this.ffsjAlertService.success('Informacion del evento actualizada con exito!');
      });
      return;
    }

    this.firebaseStorageService.setRealtimeData('config/' + type, form.value).then(() => {
      this.ffsjAlertService.success('Informacion del evento actualizada con exito!');
    });
  }

  onVotacionSelected(votacionId: string) {
    this.selectedVotacionId = votacionId;
    this.prepareVotacionesForm();
  }

  createVotacion() {
    const newVotacion = createEmptyVotacion();
    this.votacionesList = [...this.votacionesList, newVotacion];
    this.selectedVotacionId = newVotacion.id;
    this.firebaseStorageService.setRealtimeData('config/votaciones', this.votacionesList).then(() => {
      this.ffsjAlertService.success('Nueva votacion creada.');
      this.prepareVotacionesForm();
    });
  }
}

function normalizeVotaciones(
  votaciones: IRealTimeVotacion[] | IRealTimeVotacion | undefined
): IRealTimeVotacion[] {
  if (!votaciones) return [];
  if (Array.isArray(votaciones)) {
    return votaciones.map(v => ({ ...v, id: v.id || generateVotacionId(v.title) }));
  }
  return [{ ...votaciones, id: votaciones.id || generateVotacionId(votaciones.title) }];
}

function generateVotacionId(title: string): string {
  const base = (title || 'votacion').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${base}-${Date.now()}`;
}

function createEmptyVotacion(): IRealTimeVotacion {
  return {
    id: generateVotacionId('votacion'),
    title: 'Nueva votacion',
    totalVotes: 0,
    winnersCount: 1,
    voteOptions: 1,
    blankVotes: 0,
    nullVotes: 0,
    ballots: [],
    candidaturas: []
  };
}
