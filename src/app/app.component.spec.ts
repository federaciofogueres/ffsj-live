import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { AppComponent } from './app.component';
import { AuthService } from 'ffsj-web-components';
import { AuthFirebaseService } from './services/auth.service';
import { FirebaseStorageService } from './services/storage.service';

describe('AppComponent', () => {
  let realtimeData$: BehaviorSubject<any>;
  let firebaseStorageService: {
    listenToRealtimeData: jasmine.Spy;
    realtimeData$: BehaviorSubject<any>;
  };
  let authService: jasmine.SpyObj<AuthService>;
  let authFirebaseService: jasmine.SpyObj<AuthFirebaseService>;

  beforeEach(async () => {
    realtimeData$ = new BehaviorSubject<any>(null);
    firebaseStorageService = {
      listenToRealtimeData: jasmine.createSpy('listenToRealtimeData'),
      realtimeData$
    };
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['getCargos']);
    authFirebaseService = jasmine.createSpyObj<AuthFirebaseService>('AuthFirebaseService', [
      'ensureAuthenticated'
    ]);
    authFirebaseService.ensureAuthenticated.and.resolveTo();
    authService.getCargos.and.returnValue([]);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: FirebaseStorageService, useValue: firebaseStorageService },
        { provide: AuthService, useValue: authService },
        { provide: AuthFirebaseService, useValue: authFirebaseService }
      ]
    })
      .overrideComponent(AppComponent, {
        set: {
          template: '<main class="app-shell"></main>'
        }
      })
      .compileComponents();
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
    expect(compiled.querySelector('.app-shell')).toBeTruthy();
  });

  it('should subscribe to config after authentication and enable demo for public users', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    fixture.detectChanges();
    flushMicrotasks();
    realtimeData$.next({ event: { demo: true } });
    flushMicrotasks();
    fixture.detectChanges();

    expect(authFirebaseService.ensureAuthenticated).toHaveBeenCalled();
    expect(firebaseStorageService.listenToRealtimeData).toHaveBeenCalledWith('config');
    expect(app.loading).toBeFalse();
    expect(app.demo).toBeTrue();
  }));

  it('should disable demo mode for admins even when event is demo', fakeAsync(() => {
    authService.getCargos.and.returnValue([{ idCargo: 16 }] as any);
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    fixture.detectChanges();
    flushMicrotasks();
    realtimeData$.next({ event: { demo: true } });
    flushMicrotasks();

    expect(app.demo).toBeFalse();
  }));

  it('should disable demo mode when event is not marked as demo', fakeAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;

    fixture.detectChanges();
    flushMicrotasks();
    realtimeData$.next({ event: { demo: false } });
    flushMicrotasks();

    expect(app.demo).toBeFalse();
  }));
});
