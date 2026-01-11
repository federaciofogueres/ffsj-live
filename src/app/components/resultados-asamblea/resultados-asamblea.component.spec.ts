import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { FirebaseStorageService } from '../../services/storage.service';
import { ResultadosAsambleaComponent } from './resultados-asamblea.component';

describe('ResultadosAsambleaComponent', () => {
  let realtimeSubject: BehaviorSubject<any>;
  let storageMock: { realtimeData$: any; emit: (data: any) => void };

  beforeEach(() => {
    realtimeSubject = new BehaviorSubject<any>(null);
    storageMock = {
      realtimeData$: realtimeSubject.asObservable(),
      emit: (data: any) => realtimeSubject.next(data)
    };

    TestBed.configureTestingModule({
      imports: [ResultadosAsambleaComponent],
      providers: [{ provide: FirebaseStorageService, useValue: storageMock }]
    });
  });

  it('uses a default title when no data is available', () => {
    const fixture = TestBed.createComponent(ResultadosAsambleaComponent);
    const component = fixture.componentInstance;

    expect(component.title()).toBe('Sin votaciones');
    expect(component.candidaturas().length).toBe(0);
  });

  it('computes winners and ordering from realtime data', () => {
    const fixture = TestBed.createComponent(ResultadosAsambleaComponent);
    const component = fixture.componentInstance;

    storageMock.emit({
      votaciones: {
        title: 'Asamblea',
        totalVotes: 10,
        winnersCount: 1,
        voteOptions: 1,
        candidaturas: [
          { label: 'A', votes: 6, maxVotes: 10 },
          { label: 'B', votes: 2, maxVotes: 10 },
          { label: 'C', votes: 0, maxVotes: 10 }
        ]
      }
    });

    fixture.detectChanges();

    expect(component.ganadores().map(g => g.label)).toEqual(['A']);
    expect(component.topCandidaturas()[0].label).toBe('A');
    expect(component.topCandidaturas().map(c => c.label)).toEqual(['A', 'B', 'C']);
  });

  it('computes the minimum victory threshold when there is no winner', () => {
    const fixture = TestBed.createComponent(ResultadosAsambleaComponent);
    const component = fixture.componentInstance;

    storageMock.emit({
      votaciones: {
        title: 'Asamblea',
        totalVotes: 10,
        winnersCount: 1,
        voteOptions: 1,
        candidaturas: [
          { label: 'A', votes: 4, maxVotes: 10 },
          { label: 'B', votes: 4, maxVotes: 10 }
        ]
      }
    });

    fixture.detectChanges();

    expect(component.ganadores().length).toBe(0);
    expect(component.umbralMinimoDeVictoria()).toBe(5);
  });

  it('caps winners when each candidate can receive at most one vote per ballot', () => {
    const fixture = TestBed.createComponent(ResultadosAsambleaComponent);
    const component = fixture.componentInstance;

    storageMock.emit({
      votaciones: {
        title: 'Asamblea',
        totalVotes: 90,
        winnersCount: 1,
        voteOptions: 3,
        candidaturas: [
          { label: 'A', votes: 90, maxVotes: 90 },
          { label: 'B', votes: 80, maxVotes: 90 },
          { label: 'C', votes: 10, maxVotes: 90 }
        ]
      }
    });

    fixture.detectChanges();

    expect(component.ganadores().map(g => g.label)).toEqual(['A']);
  });

  it('derives display labels for jurado candidaturas', () => {
    const fixture = TestBed.createComponent(ResultadosAsambleaComponent);
    const component = fixture.componentInstance;

    storageMock.emit({
      votaciones: {
        title: 'Asamblea',
        totalVotes: 2,
        winnersCount: 1,
        voteOptions: 1,
        candidaturas: [
          {
            type: 'jurado',
            votes: 1,
            maxVotes: 2,
            jurado: { nombre: 'Laura', foguera: 'Centro', imagen: '' }
          }
        ]
      }
    });

    fixture.detectChanges();

    expect(component.candidaturasVM()[0].displayLabel).toBe('Laura - Centro');
  });
});
