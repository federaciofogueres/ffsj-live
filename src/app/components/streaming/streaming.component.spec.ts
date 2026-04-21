import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';

import { StreamingComponent } from './streaming.component';
import { FirebaseStorageService } from '../../services/storage.service';

describe('StreamingComponent', () => {
  let component: StreamingComponent;
  let fixture: ComponentFixture<StreamingComponent>;
  let realtimeData$: BehaviorSubject<any>;
  let sanitizer: DomSanitizer;

  beforeEach(async () => {
    realtimeData$ = new BehaviorSubject<any>(null);

    await TestBed.configureTestingModule({
      imports: [StreamingComponent],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: FirebaseStorageService,
          useValue: {
            listenToRealtimeData: jasmine.createSpy('listenToRealtimeData'),
            realtimeData$
          }
        }
      ]
    }).compileComponents();

    sanitizer = TestBed.inject(DomSanitizer);
    fixture = TestBed.createComponent(StreamingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build the expected youtube embed url', () => {
    component.streaming.src = 'abc123';

    const result = component.sourceURL();

    expect(sanitizer.sanitize(SecurityContext.RESOURCE_URL, result)).toBe(
      'https://www.youtube.com/embed/abc123?rel=0&modestbranding=1&playsinline=1'
    );
  });

  it('should load streaming config from realtime data', () => {
    const streaming = {
      src: 'xyz789',
      title: 'Nuevo streaming',
      width: 1920,
      height: 1080,
      subtitle: 'En directo'
    };

    realtimeData$.next({ streaming });

    expect(component.streaming).toEqual(streaming);
  });
});
