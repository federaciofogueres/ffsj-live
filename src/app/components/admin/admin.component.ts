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
import { ItemCardComponent } from '../item-card/item-card.component';

@Component({
  selector: 'app-admin',
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
    ItemCardComponent,
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

  get eventos(): FormArray {
    return this.infoForm.get('eventos') as FormArray;
  }

  get presentadores(): FormArray {
    return this.infoForm.get('presentadores') as FormArray;
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

  prepareInfoForm() {
    this.infoForm = this.fb.group({
      title: [this.config.event?.title || ''],
      horario: [this.config.event?.horario || ''],
      presentadores: this.fb.array(
        Array.isArray(this.config.event?.presentadores)
          ? this.config.event.presentadores.map((presentador: any) =>
            this.fb.group({
              nombre: [presentador.nombre || ''],
              src: [presentador.src || ''],
              info: [presentador.info || '']
            })
          )
          : []
      ),
      eventos: this.fb.array(
        Array.isArray(this.config.event?.eventos)
          ? this.config.event.eventos.map((evento: string) => this.fb.control(evento))
          : []
      )
    });

    this.nuevoPresentador = this.fb.group({
      nombre: [''],
      src: [''],
      info: ['']
    });

    this.nuevoEventoControl = new FormControl('');
  }

  prepareStreamingForm() {
    this.streamingForm = this.fb.group({
      title: [this.config.streaming?.title || ''],
      subtitle: [this.config.streaming?.subtitle || ''],
      src: [this.config.streaming?.src || ''],
      height: [this.config.streaming?.height || ''],
      width: [this.config.streaming?.width || '']
    });
  }

  prepareLiveForm() {
    this.itemList = this.config.list!;

    const initialItem = this.itemList.items.find(item => item.id === this.config.live?.item?.id) || this.itemList.items[0];

    this.liveForm = this.fb.group({
      item: [initialItem],
      descripcion: [this.config.live?.descripcion || ''],
      tipo: [this.config.live?.tipo || ''],
      titulo: [this.config.live?.titulo || ''],
    });

    this.liveItemId = this.itemList.items.findIndex(item => item.id === this.config.live?.item?.id) ?? 0;
  }

  prepareListForm() {
    this.listForm = this.fb.group({
      title: [this.config.list?.title || ''],
      items: [this.config.list?.items || ''],
      searching: [this.config.list?.searching || ''],
      filterKeys: this.fb.array(
        Array.isArray(this.config.list?.filterKeys)
          ? this.config.list.filterKeys.map((filter: string) => this.fb.control(filter))
          : []
      )
    });
    this.nuevoFilterKey = new FormControl('');
  }

  prepareAnunciosForm() {
    this.anunciosForm = this.fb.group({
      timing: [this.config.anuncios?.timing || ''],
      activatedAdds: [this.config.anuncios?.activatedAdds || ''],
      showAdds: [this.config.anuncios?.showAdds || false],
      anuncios: this.fb.array(
        Array.isArray(this.config.anuncios?.anuncios)
          ? this.config.anuncios.anuncios.map((anuncio: string) => this.fb.control(anuncio))
          : []
      )
    });
  }

  prepareForms() {
    this.prepareInfoForm();
    this.prepareStreamingForm();
    this.prepareLiveForm();
    this.prepareListForm();
    this.prepareAnunciosForm();
    this.loading = false;
  }

  updateItem(itemId: number) {
    this.liveItemId = itemId;
    const item = this.itemList.items[this.liveItemId] || this.itemList.items[0];
    this.liveForm.get('item')?.setValue(item);
    this.procesar(this.liveForm, 'live');
  }

  addFilterKey(): void {
    const presentador = this.nuevoPresentador.value;
    if (presentador.nombre.trim() && presentador.src.trim() && presentador.info.trim()) {
      this.filterKeys.push(this.fb.group(presentador));
      this.nuevoPresentador.reset(); // Limpiar el formulario del nuevo presentador
    }
  }

  removeFilterKey(index: number): void {
    this.filterKeys.removeAt(index);
  }

  addPresentador(): void {
    const presentador = this.nuevoPresentador.value;
    if (presentador.nombre.trim() && presentador.src.trim() && presentador.info.trim()) {
      this.presentadores.push(this.fb.group(presentador));
      this.nuevoPresentador.reset();
    }
  }


  removePresentador(index: number): void {
    this.presentadores.removeAt(index);
  }

  addEvento(): void {
    const nuevoEvento = this.nuevoEventoControl.value;
    if (nuevoEvento.trim()) {
      this.eventos.push(this.fb.control(nuevoEvento));
      this.nuevoEventoControl.reset();
    }
  }

  removeEvento(index: number): void {
    this.eventos.removeAt(index);
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
    this.infoForm.reset({
      title: '',
      horario: '',
      presentadores: [],
      eventos: []
    });
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

  onFileSelected(event: Event): void {
    this.loading = true;
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.firebaseStorageService.uploadImage(file).then((url) => {
        if (url) {
          this.anuncios.push(this.fb.control(url));
          this.loading = false;
        }
      }).catch((error) => {
        this.ffsjAlertService.danger('Error al subir la imagen:', error);
      });
    }
  }

  removeAdd(index: number, url: string): void {
    this.loading = true;
    this.anuncios.removeAt(index);
    this.firebaseStorageService.deleteImage(url).then(() => {
      this.ffsjAlertService.success(`Imagen eliminada del almacenamiento: ${url}`);
    }).catch((error) => {
      this.ffsjAlertService.danger('Error al eliminar la imagen del almacenamiento:', error);
    }).finally(() => {
      this.loading = false;
    })
  }

}
