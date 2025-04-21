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
import * as XLSX from 'xlsx';
import { IRealTimeList } from '../../../model/real-time-config.model';
import { MappingService } from '../../../services/mapping.service';

@Component({
  selector: 'app-list-options-form',
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
  templateUrl: './list-options-form.component.html',
  styleUrl: './list-options-form.component.scss'
})
export class ListOptionsFormComponent {
  @Input() listForm!: FormGroup; // Recibe el formulario desde el componente padre
  @Input() itemList!: IRealTimeList; // Recibe la lista de ítems desde el componente padre
  @Output() formSubmit = new EventEmitter<FormGroup>(); // Emite el formulario al enviarlo

  nuevoFilterKey = new FormControl('');

  constructor(
    private fb: FormBuilder,
    private ffsjAlertService: FfsjAlertService,
    private mappingService: MappingService
  ) { }

  get filterKeys(): FormArray {
    return this.listForm.get('filterKeys') as FormArray;
  }

  addFilterKey(): void {
    const newKey = this.nuevoFilterKey.value || '';
    if (newKey.trim()) {
      this.filterKeys.push(this.fb.control(newKey));
      this.nuevoFilterKey.reset();
    }
  }

  removeFilterKey(index: number): void {
    this.filterKeys.removeAt(index);
  }

  onExcelUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Asume que los datos están en la primera hoja
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convierte los datos de la hoja a JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (jsonData && jsonData.length > 0) {
          this.ffsjAlertService.success('Datos cargados desde el Excel');
          this.updateListado(jsonData); // Llama a updateListado solo si hay datos
        } else {
          this.ffsjAlertService.warning('El archivo Excel no contiene datos válidos.');
        }
      };

      reader.onerror = () => {
        this.ffsjAlertService.danger('Error al leer el archivo Excel.');
      };

      reader.readAsArrayBuffer(file);
    }
  }

  updateListado(data: any[]): void {
    if (!this.itemList) {
      this.itemList = {
        title: '',
        searching: '',
        filterKeys: [],
        items: []
      };
    }
    this.itemList.items = data.map((item, index) => this.mappingService.mapToIRealTimeItem(item, index));
    this.listForm.controls['items'].setValue(this.itemList.items);
    this.ffsjAlertService.success('Listado actualizado desde el Excel correctamente.');
  }

  downloadListadoAsExcel(): void {
    if (!this.itemList || !this.itemList.items || this.itemList.items.length === 0) {
      this.ffsjAlertService.warning('No hay datos en el listado para descargar.');
      return;
    }

    const data = this.itemList.items.map(item => this.mappingService.mapItemToExcelRow(item));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Listado');

    const excelFileName = 'Listado.xlsx';
    XLSX.writeFile(workbook, excelFileName);
  }

}
