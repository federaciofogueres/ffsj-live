import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
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
    ItemCardComponent
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  Array = Array;
  public infoForm!: FormGroup;
  public streamingForm!: FormGroup;
  public liveForm!: FormGroup;

  public placeHolder!: IRealTimeItem;

  public liveItemId: number = 0;
  public itemList!: IRealTimeList;
  public asociacionLive!: FormControl;

  protected _selectedView: string = 'info';
  protected loading: boolean = true;
  config: IRealTimeConfigModel = {};
  nuevoEventoControl!: FormControl;
  nuevoPresentador!: FormGroup;

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
    await this.getData(); // Esperar a que los datos se carguen
    this.prepareForms(); // Preparar los formularios después de cargar los datos
    this.loading = false;
  }

  async getData() {
    this.config = await this.firebaseStorageService.getRealtimeData('config');
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

  prepareForms() {
    this.prepareInfoForm();
    this.prepareStreamingForm();
    this.prepareLiveForm();
  }

  updateItem(itemId: number) {
    this.liveItemId = itemId;
    const item = this.itemList.items[this.liveItemId] || this.itemList.items[0];
    this.liveForm.get('item')?.setValue(item);
    this.procesar(this.liveForm, 'live');
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

  procesar(form: FormGroup, type: string) {
    console.log(this.infoForm.value);
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

    // Limpiar la configuración cargada
    this.config = {};

    console.log('Todos los formularios y datos han sido reseteados.');
  }

  handleSelect(event: any) {
    console.log(event.target.value.vidaEnFogueres.asociacion_label);

  }
}
