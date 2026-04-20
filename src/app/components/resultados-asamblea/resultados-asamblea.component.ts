import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Candidatura } from '../../model/candidatura.model';
import { IRealTimeVotacion } from '../../model/real-time-config.model';
import { FirebaseStorageService } from '../../services/storage.service';

@Component({
  selector: 'app-resultados-asamblea',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resultados-asamblea.component.html',
  styleUrl: './resultados-asamblea.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultadosAsambleaComponent {
  private readonly firebaseStorageService = inject(FirebaseStorageService);
  private readonly realtimeData = toSignal(this.firebaseStorageService.realtimeData$, { initialValue: null });

  readonly votacionesList = computed(() =>
    normalizeVotaciones(this.realtimeData()?.votaciones)
  );
  readonly selectedVotacionId = signal<string>('');
  readonly selectedVotacion = computed(() =>
    this.votacionesList().find(v => v.id === this.selectedVotacionId()) ?? this.votacionesList()[0]
  );

  readonly title = computed(() => this.selectedVotacion()?.title ?? 'Sin votaciones');
  readonly candidaturas = computed<Candidatura[]>(() => this.selectedVotacion()?.candidaturas ?? []);
  readonly totalPapeletas = computed(() => this.selectedVotacion()?.totalVotes ?? 0);
  readonly winnersCount = computed(() => Math.max(1, this.selectedVotacion()?.winnersCount ?? 1));
  readonly voteOptions = computed(() => Math.max(1, this.selectedVotacion()?.voteOptions ?? 1));
  readonly blankVotes = computed(() => this.selectedVotacion()?.blankVotes ?? 0);
  readonly nullVotes = computed(() => this.selectedVotacion()?.nullVotes ?? 0);
  readonly totalVotosPosibles = computed(() => this.totalPapeletas() * this.voteOptions());

  private readonly totalVotosActuales = computed(() =>
    this.candidaturas().reduce((acc, c) => acc + (c.votes || 0), 0)
  );

  readonly mayoriaAbsoluta = computed(() => Math.floor(this.totalVotosPosibles() / 2) + 1);

  readonly ganadores = computed(() =>
    calcGanadores(
      this.candidaturas(),
      this.totalVotosPosibles(),
      this.totalVotosActuales() + this.blankVotes() + this.nullVotes(),
      this.winnersCount(),
      this.totalPapeletas()
    )
  );

  readonly candidaturasVM = computed<CandidaturaVM[]>(() => {
    const candidaturas = this.candidaturas();
    const votosEmitidos = this.totalVotosPosibles();
    const votosAsignados = this.totalVotosActuales() + this.blankVotes() + this.nullVotes();
    const ganadores = this.ganadores();
    const maxVotos = Math.max(0, ...candidaturas.map(c => c.votes || 0));
    const ganadoresSet = new Set(ganadores.map(g => candidaturaKey(g)));
    const winnersCount = this.winnersCount();

    return candidaturas.map(c => ({
      ...c,
      key: candidaturaKey(c),
      displayLabel: candidaturaDisplayLabel(c),
      porcentaje: calcPorcentaje(c.votes || 0, votosEmitidos),
      color: calcColor(maxVotos, c.votes || 0),
      votosNecesarios: calcVotosNecesarios(
        c,
        candidaturas,
        votosEmitidos,
        votosAsignados,
        winnersCount,
        this.totalPapeletas()
      ),
      esGanador: ganadoresSet.has(candidaturaKey(c))
    }));
  });

  readonly candidaturasOrdenadas = computed(() =>
    [...this.candidaturasVM()].sort((a, b) => (b.votes || 0) - (a.votes || 0))
  );

  readonly maxVotosNecesariosParaGanar = computed(() => {
    const max = Math.max(
      0,
      ...this.candidaturasVM()
        .map(c => c.votosNecesarios)
        .filter(n => n > 0)
    );
    return max;
  });

  readonly umbralMinimoDeVictoria = computed(() => {
    const values = this.candidaturasVM().map(c => {
      return c.votosNecesarios === -1 ? Infinity : (c.votes || 0) + c.votosNecesarios;
    });
    const min = Math.min(...values);
    return Number.isFinite(min) ? min : 0;
  });

  readonly topCandidaturas = computed(() => this.candidaturasOrdenadas().slice(0, 3));
  readonly otrasCandidaturas = computed(() => this.candidaturasOrdenadas().slice(3));
  readonly ganadoresVM = computed(() => this.candidaturasVM().filter(c => c.esGanador));

  constructor() {
    effect(() => {
      const list = this.votacionesList();
      if (!list.length) {
        this.selectedVotacionId.set('');
        return;
      }
      const current = this.selectedVotacionId();
      if (!current || !list.some(v => v.id === current)) {
        this.selectedVotacionId.set(list[0].id);
      }
    }, { allowSignalWrites: true });
  }

  selectVotacion(id: string) {
    this.selectedVotacionId.set(id);
  }
}

interface CandidaturaVM extends Candidatura {
  key: string;
  displayLabel: string;
  porcentaje: number;
  color: string;
  votosNecesarios: number;
  esGanador: boolean;
}

function calcGanadores(
  candidaturas: Candidatura[],
  votosEmitidos: number,
  votosAsignados: number,
  winnersCount: number,
  totalPapeletas: number
): Candidatura[] {
  if (!candidaturas.length) return [];

  if (winnersCount >= candidaturas.length) {
    return candidaturas;
  }

  const votosRestantes = Math.max(0, votosEmitidos - votosAsignados);

  return candidaturas.filter(c =>
    isGuaranteedWinner(c, candidaturas, votosRestantes, winnersCount, totalPapeletas)
  );
}

function calcVotosNecesarios(
  candidatura: Candidatura,
  candidaturas: Candidatura[],
  votosEmitidos: number,
  votosAsignados: number,
  winnersCount: number,
  totalPapeletas: number
): number {
  const votosActuales = candidatura.votes || 0;
  const votosRestantes = Math.max(0, votosEmitidos - votosAsignados);
  const maxExtra = Math.max(0, totalPapeletas - votosActuales);
  const maxExtraAplicable = Math.min(votosRestantes, maxExtra);

  for (let extraVotos = 0; extraVotos <= maxExtraAplicable; extraVotos++) {
    const totalCandidato = votosActuales + extraVotos;
    const votosRestantesSimulados = votosRestantes - extraVotos;
    const rivals = candidaturas.filter(r => r !== candidatura).map(r => r.votes || 0);

    if (isGuaranteedWinnerForVotes(
      totalCandidato,
      rivals,
      votosRestantesSimulados,
      winnersCount,
      totalPapeletas
    )) {
      return extraVotos;
    }
  }

  return -1;
}

function calcPorcentaje(votos: number, votosEmitidos: number): number {
  return votosEmitidos > 0 ? (votos / votosEmitidos) * 100 : 0;
}

function calcColor(maxVotos: number, votos: number): string {
  if (maxVotos <= 0) return '#e74c3c';

  const p = (votos / maxVotos) * 100;
  if (p >= 90) return '#27ae60';
  if (p >= 70) return '#2ecc71';
  if (p >= 50) return '#f1c40f';
  if (p >= 30) return '#e67e22';
  return '#e74c3c';
}

function candidaturaDisplayLabel(candidatura: Candidatura): string {
  const type = candidatura.type || 'simple';

  if (type === 'jurado') {
    const nombre = candidatura.jurado?.nombre?.trim() || '';
    const foguera = candidatura.jurado?.foguera?.trim() || '';
    if (nombre && foguera) return `${nombre} - ${foguera}`;
    return nombre || foguera || 'Jurado';
  }

  if (type === 'multiple') {
    const label = (candidatura.label || (candidatura as any).nombre || '').trim();
    if (label) return label;
    const firstField = candidatura.fields?.[0];
    if (firstField?.value !== undefined && firstField?.value !== null && String(firstField.value).trim() !== '') {
      return String(firstField.value);
    }
    return 'Opción múltiple';
  }

  const legacyLabel = (candidatura as any).nombre || '';
  return candidatura.label?.trim() || legacyLabel || 'Candidatura';
}

function candidaturaKey(candidatura: Candidatura): string {
  const type = candidatura.type || 'simple';

  if (type === 'jurado') {
    const nombre = candidatura.jurado?.nombre || '';
    const foguera = candidatura.jurado?.foguera || '';
    return `jurado:${nombre}:${foguera}`;
  }

  if (type === 'multiple') {
    const label = candidatura.label || (candidatura as any).nombre || '';
    const fields = (candidatura.fields || [])
      .map(f => `${f.key}:${f.value}`)
      .join('|');
    return `multiple:${label}:${fields}`;
  }

  const legacyLabel = (candidatura as any).nombre || '';
  return `simple:${candidatura.label || legacyLabel || ''}`;
}

function normalizeVotaciones(
  votaciones: IRealTimeVotacion[] | IRealTimeVotacion | undefined
): IRealTimeVotacion[] {
  if (!votaciones) return [];
  if (Array.isArray(votaciones)) {
    return votaciones.map(v => ({ ...v, id: v.id || generateVotacionId(v.title) }));
  }
  return [{ ...votaciones, id: votaciones.id || generateVotacionId(votaciones.title) }];
}

function generateVotacionId(title: string): string {
  const base = (title || 'votacion').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${base}-${Date.now()}`;
}

function isGuaranteedWinner(
  candidatura: Candidatura,
  candidaturas: Candidatura[],
  votosRestantes: number,
  winnersCount: number,
  totalPapeletas: number
): boolean {
  const votosActuales = candidatura.votes || 0;
  const rivals = candidaturas.filter(r => r !== candidatura).map(r => r.votes || 0);

  return isGuaranteedWinnerForVotes(
    votosActuales,
    rivals,
    votosRestantes,
    winnersCount,
    totalPapeletas
  );
}

function isGuaranteedWinnerForVotes(
  votosActuales: number,
  votosRivales: number[],
  votosRestantes: number,
  winnersCount: number,
  totalPapeletas: number
): boolean {
  const neededVotes: number[] = [];
  let rivalesPorEncima = 0;

  for (const v of votosRivales) {
    if (v >= votosActuales + 1) {
      rivalesPorEncima += 1;
      continue;
    }

    const maxExtra = Math.max(0, totalPapeletas - v);
    const necesarios = votosActuales + 1 - v;
    if (necesarios <= maxExtra) {
      neededVotes.push(necesarios);
    }
  }

  neededVotes.sort((a, b) => a - b);

  let restantes = votosRestantes;

  for (const needed of neededVotes) {
    if (needed <= restantes) {
      restantes -= needed;
      rivalesPorEncima += 1;
      continue;
    }

    break;
  }

  return rivalesPorEncima < winnersCount;
}
