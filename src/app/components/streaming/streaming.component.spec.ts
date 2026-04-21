import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { StreamingComponent } from './streaming.component';
import { FirebaseStorageService } from '../../services/storage.service';

describe('StreamingComponent', () => {
  let component: StreamingComponent;
  let fixture: ComponentFixture<StreamingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StreamingComponent],
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
    
    fixture = TestBed.createComponent(StreamingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
