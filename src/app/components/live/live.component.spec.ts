import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { LiveComponent } from './live.component';
import { IRealTimeLive, createDefaultLiveInfo } from '../../model/real-time-config.model';
import { FirebaseStorageService } from '../../services/storage.service';

describe('LiveComponent', () => {
  let component: LiveComponent;
  let fixture: ComponentFixture<LiveComponent>;
  let realtimeData$: BehaviorSubject<any>;

  beforeEach(async () => {
    realtimeData$ = new BehaviorSubject<any>(null);

    await TestBed.configureTestingModule({
      imports: [LiveComponent],
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

    fixture = TestBed.createComponent(LiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load live info from realtime data', () => {
    const live: IRealTimeLive = {
      ...createDefaultLiveInfo(),
      titulo: 'Directo',
      descripcion: 'Emision principal',
      imagenes: ['img-1.jpg'],
      tipo: 'belleza'
    };

    realtimeData$.next({ live });

    expect(component.liveInfo).toEqual(live);
    expect(component.loading).toBeFalse();
  });

  it('should open and close the image modal state', () => {
    component.openImage('img-1.jpg');
    expect(component.selectedImage).toBe('img-1.jpg');

    component.closeImage();
    expect(component.selectedImage).toBeNull();
  });
});
