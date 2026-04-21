import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { HomeComponent } from './home.component';
import { IRealTimeEvent } from '../../model/real-time-config.model';
import { FirebaseStorageService } from '../../services/storage.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let realtimeData$: BehaviorSubject<any>;

  beforeEach(async () => {
    realtimeData$ = new BehaviorSubject<any>(null);

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        {
          provide: FirebaseStorageService,
          useValue: {
            listenToRealtimeData: jasmine.createSpy('listenToRealtimeData'),
            realtimeData$
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load event info from realtime data', () => {
    const event: IRealTimeEvent = {
      title: 'Bellea 2025',
      horario: '20:00',
      presentadores: [
        { nombre: 'Ana', info: 'Presentadora', src: 'ana.jpg' },
        { nombre: 'Luis', info: 'Presentador', src: 'luis.jpg' }
      ],
      eventos: ['Entrada', 'Entrega']
    };

    realtimeData$.next({ event });

    expect(component.eventInfo).toEqual(event);
  });

  it('should toggle protagonists visibility', () => {
    expect(component.showProtagonists).toBeFalse();

    component.toggleProtagonists();
    expect(component.showProtagonists).toBeTrue();

    component.toggleProtagonists();
    expect(component.showProtagonists).toBeFalse();
  });
});
