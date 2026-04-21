import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { LiveComponent } from './live.component';
import { FirebaseStorageService } from '../../services/storage.service';

describe('LiveComponent', () => {
  let component: LiveComponent;
  let fixture: ComponentFixture<LiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveComponent],
      providers: [
        {
          provide: FirebaseStorageService,
          useValue: {
            listenToRealtimeData: () => {},
            realtimeData$: of(null)
          }
        }
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
