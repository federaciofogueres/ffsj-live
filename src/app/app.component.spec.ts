import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from 'ffsj-web-components';
import { AuthFirebaseService } from './services/auth.service';
import { FirebaseStorageService } from './services/storage.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        {
          provide: FirebaseStorageService,
          useValue: {
            listenToRealtimeData: () => {},
            realtimeData$: of({ event: { demo: true } })
          }
        },
        {
          provide: AuthService,
          useValue: {
            getCargos: () => []
          }
        },
        {
          provide: AuthFirebaseService,
          useValue: {
            ensureAuthenticated: () => Promise.resolve()
          }
        }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'ffsj-live' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('ffsj-live');
  });

  it('should render the root shell', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeTruthy();
  });
});
