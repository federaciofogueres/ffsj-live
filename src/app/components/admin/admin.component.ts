import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FfsjAlertService } from 'ffsj-web-components';
import { IRealTimeConfigModel, IRealTimeItem, IRealTimeList } from '../../model/real-time-config.model';
import { FirebaseStorageService } from '../../services/storage.service';
import { AnunciosFormComponent } from '../formularios/anuncios-form/anuncios-form.component';
import { InfoFormComponent } from '../formularios/info-form/info-form.component';
import { ListOptionsFormComponent } from '../formularios/list-options-form/list-options-form.component';
import { LiveFormComponent } from '../formularios/live-form/live-form.component';
import { StreamingFormComponent } from '../formularios/streaming-form/streaming-form.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    AnunciosFormComponent,
    InfoFormComponent,
    LiveFormComponent,
    ListOptionsFormComponent,
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

  public placeHolder!: IRealTimeItem;

  public liveItemId: number = 0;
  public itemList!: IRealTimeList;
  public asociacionLive!: FormControl;

  protected _selectedView: string = 'info';
  protected loading: boolean = true;
  config: IRealTimeConfigModel = {};
  nuevoEventoControl!: FormControl;
  nuevoPresentador!: FormGroup;
  nuevoFilterKey!: FormControl;

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

  get liveItemControl(): FormControl {
    return this.liveForm.get('item') as FormControl;
  }

  get filterKeys(): FormArray {
    return this.listForm.get('filterKeys') as FormArray;
  }

  get anuncios(): FormArray {
    return this.anunciosForm.get('anuncios') as FormArray;
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
    })
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
    this.infoForm = this.initializeFormGroup(this.config.event, ['title', 'horario']);
    this.infoForm.addControl('presentadores', this.createFormArray(
      this.config.event?.presentadores || [],
      (presentador: any) => this.fb.group({
        nombre: [presentador.nombre || ''],
        src: [presentador.src || ''],
        info: [presentador.info || '']
      })
    ));
    this.infoForm.addControl('eventos', this.createControlArray(this.config.event?.eventos || []));

    this.nuevoPresentador = this.fb.group({
      nombre: [''],
      src: [''],
      info: ['']
    });

    this.nuevoEventoControl = new FormControl('');
  }

  prepareStreamingForm() {
    this.streamingForm = this.initializeFormGroup(this.config.streaming, ['title', 'subtitle', 'src', 'height', 'width']);
  }

  prepareLiveForm() {
    this.itemList = this.config.list!;
    const initialItem = this.itemList.items.find(item => item.id === this.config.live?.item?.id) || this.itemList.items[0];
    this.liveForm = this.initializeFormGroup(this.config.live, ['descripcion', 'tipo', 'titulo']);
    this.liveForm.addControl('item', new FormControl(initialItem));
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
    this.nuevoFilterKey = new FormControl('');
  }

  prepareAnunciosForm() {
    this.anunciosForm = this.initializeFormGroup(this.config.anuncios, ['timing', 'activatedAdds', 'showAdds']);
    this.anunciosForm.addControl('anuncios', this.fb.array(
      Array.isArray(this.config.anuncios?.anuncios)
        ? this.config.anuncios.anuncios.map((anuncio: string) => this.fb.control(anuncio))
        : []
    ));
  }

  prepareForms() {
    this.prepareInfoForm();
    this.prepareStreamingForm();
    this.prepareLiveForm();
    this.prepareListForm();
    this.prepareAnunciosForm();
    this.loading = false;
  }

  procesar(form: FormGroup, type: string) {
    if (form.contains('activatedAdds')) {
      this.firebaseStorageService.setShowAdds();
    }
    this.firebaseStorageService.setRealtimeData('config/' + type, form.value).then((response) => {
      this.ffsjAlertService.success('Información del evento actualizada con éxito!');
      this.resetAll();
    })
  }

  resetAll() {
    this.nuevoPresentador.reset({
      nombre: '',
      src: '',
      info: ''
    });
    this.nuevoEventoControl.reset('');
    this.nuevoFilterKey.reset('');
    this.config = {};
  }

  handleSelect(event: any) {
    console.log(event.target.value.vidaEnFogueres.asociacion_label);
  }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.itemList.items, event.previousIndex, event.currentIndex);
    this.procesar(this.listForm, 'list');
  }



}
