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
    console.log('Vista seleccionada:', value);
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

  ngOnDestroy(): void {
    // Detiene la alternancia automática de anuncios al destruir el componente
    // this.firebaseStorageService.stopToggleAds();
  }

  async initializeData() {
    this.getData(); // Esperar a que los datos se carguen
  }

  getData() {
    this.firebaseStorageService.setShowAdds();
    this.firebaseStorageService.realtimeData$.subscribe({
      next: (newValue) => {
        if (newValue) {
          this.config = newValue;
          // this.firebaseStorageService.toggleAdsAutomatically();
          this.prepareForms();
        }
      }
    })
    // this.config = await this.firebaseStorageService.getRealtimeData('config');
  }

  saveInfo() {
    console.log('Información guardada:', this.config.event);
    // Aquí puedes agregar lógica para guardar los datos en Firebase u otro servicio
  }

  prepareInfoForm() {
    this.infoForm = this.fb.group({
      title: [this.config.event?.title || ''], // Asegurarse de que haya un valor predeterminado
      horario: [this.config.event?.horario || ''],
      presentadores: this.fb.array(
        Array.isArray(this.config.event?.presentadores) // Verificar si es un array
          ? this.config.event.presentadores.map((presentador: any) =>
            this.fb.group({
              nombre: [presentador.nombre || ''],
              src: [presentador.src || ''],
              info: [presentador.info || '']
            })
          )
          : [] // Si no es un array, inicializar como vacío
      ),
      eventos: this.fb.array(
        Array.isArray(this.config.event?.eventos) // Verificar si es un array
          ? this.config.event.eventos.map((evento: string) => this.fb.control(evento))
          : [] // Si no es un array, inicializar como vacío
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
    // Encuentra el objeto en itemList.items que coincide con el ID del item seleccionado
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
        Array.isArray(this.config.list?.filterKeys) // Verificar si es un array
          ? this.config.list.filterKeys.map((filter: string) => this.fb.control(filter))
          : [] // Si no es un array, inicializar como vacío
      )
    });
    this.nuevoFilterKey = new FormControl('');
  }

  prepareAnunciosForm() {
    this.anunciosForm = this.fb.group({
      timing: [this.config.anuncios?.timing || ''],
      showAdds: [this.config.anuncios?.showAdds || ''],
      anuncios: this.fb.array(
        Array.isArray(this.config.anuncios?.anuncios) // Verificar si es un array
          ? this.config.anuncios.anuncios.map((anuncio: string) => this.fb.control(anuncio))
          : [] // Si no es un array, inicializar como vacío
      )
    });
    // this.nuevoFilterKey = new FormControl('');
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

  // Añadir un nuevo presentador al FormArray
  addFilterKey(): void {
    const presentador = this.nuevoPresentador.value;
    if (presentador.nombre.trim() && presentador.src.trim() && presentador.info.trim()) {
      this.filterKeys.push(this.fb.group(presentador));
      this.nuevoPresentador.reset(); // Limpiar el formulario del nuevo presentador
    }
  }

  // Eliminar un presentador del FormArray
  removeFilterKey(index: number): void {
    this.filterKeys.removeAt(index);
  }

  // Añadir un nuevo presentador al FormArray
  addPresentador(): void {
    const presentador = this.nuevoPresentador.value;
    if (presentador.nombre.trim() && presentador.src.trim() && presentador.info.trim()) {
      this.presentadores.push(this.fb.group(presentador));
      this.nuevoPresentador.reset(); // Limpiar el formulario del nuevo presentador
    }
  }

  // Eliminar un presentador del FormArray
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

  // setTimingAnuncios() {
  //   const timing = Number(this.anunciosForm.controls['timing'].value) * 60;
  //   console.log('Timing: ', timing);

  //   setTimeout(() => {
  //     console.log('Setting showAdds true');

  //     this.anunciosForm.controls['showAdds'].setValue(true);
  //     this.procesar(this.anunciosForm, 'anuncios');
  //   }, timing);
  // }

  procesar(form: FormGroup, type: string) {
    console.log(form.value);
    this.firebaseStorageService.setRealtimeData('config/' + type, form.value).then((response) => {
      this.ffsjAlertService.success('Información del evento actualizada con éxito!');
      this.resetAll();
    })
  }

  resetAll() {
    // Resetear el formulario principal
    this.infoForm.reset({
      title: '',
      horario: '',
      presentadores: [],
      eventos: []
    });

    // Resetear el formulario de nuevo presentador
    this.nuevoPresentador.reset({
      nombre: '',
      src: '',
      info: ''
    });

    // Resetear el control de nuevo evento
    this.nuevoEventoControl.reset('');
    this.nuevoFilterKey.reset('');

    // Limpiar la configuración cargada
    this.config = {};

    console.log('Todos los formularios y datos han sido reseteados.');
  }

  handleSelect(event: any) {
    console.log(event.target.value.vidaEnFogueres.asociacion_label);

  }

  // Método para manejar el reordenamiento
  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.itemList.items, event.previousIndex, event.currentIndex);
    this.procesar(this.listForm, 'list');
    console.log(this.listForm);
  }

  onFileSelected(event: Event): void {
    this.loading = true;
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.firebaseStorageService.uploadImage(file).then((url) => {
        if (url) {
          // Agrega la URL al array de anuncios
          this.anuncios.push(this.fb.control(url));
          this.loading = false;
          console.log('Imagen subida y URL agregada:', url);
          console.log(this.anunciosForm);

        }
      }).catch((error) => {
        console.error('Error al subir la imagen:', error);
      });
    }
  }

  removeAdd(index: number, url: string): void {
    // Elimina el anuncio del FormArray
    this.loading = true;
    this.anuncios.removeAt(index);

    // Llama al servicio para eliminar la imagen del almacenamiento de Firebase
    this.firebaseStorageService.deleteImage(url).then(() => {
      console.log(`Imagen eliminada del almacenamiento: ${url}`);
    }).catch((error) => {
      console.error('Error al eliminar la imagen del almacenamiento:', error);
    }).finally(() => {
      this.loading = false;
    })
  }

}
