import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from 'ffsj-web-components';

import { ListComponent } from './list.component';
import { IRealTimeConfigModel, IRealTimeItem } from '../../model/real-time-config.model';
import { FirebaseStorageService } from '../../services/storage.service';

describe('ListComponent', () => {
  let component: ListComponent;
  let fixture: ComponentFixture<ListComponent>;
  let realtimeData$: BehaviorSubject<any>;

  beforeEach(async () => {
    realtimeData$ = new BehaviorSubject<any>(null);

    await TestBed.configureTestingModule({
      imports: [ListComponent],
      providers: [
        provideRouter([]),
        {
          provide: FirebaseStorageService,
          useValue: {
            listenToRealtimeData: jasmine.createSpy('listenToRealtimeData'),
            realtimeData$
          }
        },
        {
          provide: AuthService,
          useValue: {
            getCargos: jasmine.createSpy('getCargos').and.returnValue([])
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function createItem(id: string, nombre: string, asociacion: string): IRealTimeItem {
    return {
      id,
      informacionPersonal: {
        dni: '00000000A',
        nombre,
        fechaNacimiento: '2000-01-01',
        ciudad: 'Alicante',
        email: `${id}@example.com`,
        telefono: '600000000',
        edad: '25',
        tipoCandidata: 'adulta'
      },
      vidaEnFogueres: {
        asociacion_order: 1,
        asociacion_label: asociacion,
        asociacion,
        anyosFiesta: 10,
        curriculum: 'Curriculum'
      },
      academico: {
        formacion: 'Universidad',
        situacionLaboral: 'Trabajando',
        observaciones: '',
        aficiones: ''
      },
      documentacion: {
        autorizacionFoguera: '',
        compromisoDisponibilidad: '',
        derechosAutor: '',
        dniEscaneado: '',
        fotoBelleza: '',
        fotoCalle: ''
      },
      responsables: {}
    };
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load items and filter keys from realtime config', () => {
    const config: IRealTimeConfigModel = {
      list: {
        title: 'Candidatas',
        items: [
          createItem('1', 'Lucia', 'Bola de Oro'),
          createItem('2', 'Rosa', 'Carolinas Altas')
        ],
        searching: 'Buscar',
        filterKeys: ['informacionPersonal.nombre', 'vidaEnFogueres.asociacion_label']
      }
    };

    realtimeData$.next(config);

    expect(component.config).toEqual(config);
    expect(component.items).toEqual(config.list!.items);
    expect(component.filteredItems).toEqual(config.list!.items);
    expect(component.filterKeys).toEqual(config.list!.filterKeys);
    expect(component.loading).toBeFalse();
  });

  it('should filter items using nested keys', () => {
    realtimeData$.next({
      list: {
        title: 'Candidatas',
        items: [
          createItem('1', 'Lucia', 'Bola de Oro'),
          createItem('2', 'Rosa', 'Carolinas Altas')
        ],
        searching: 'Buscar',
        filterKeys: ['informacionPersonal.nombre', 'vidaEnFogueres.asociacion_label']
      }
    });

    component.filterItems({
      target: { value: 'carolinas' }
    } as unknown as Event);

    expect(component.filteredItems).toEqual([
      createItem('2', 'Rosa', 'Carolinas Altas')
    ]);
  });

  it('should keep all items when filter is empty', () => {
    const items = [createItem('1', 'Lucia', 'Bola de Oro'), createItem('2', 'Rosa', 'Carolinas Altas')];

    realtimeData$.next({
      list: {
        title: 'Candidatas',
        items,
        searching: 'Buscar',
        filterKeys: ['informacionPersonal.nombre']
      }
    });

    component.filterItems({
      target: { value: '' }
    } as unknown as Event);

    expect(component.filteredItems).toEqual(items);
  });
});
