import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Candidatura } from '../../model/candidatura.model';
import { FirebaseStorageService } from '../../services/storage.service';

@Component({
  selector: 'app-resultados-asamblea',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resultados-asamblea.component.html',
  styleUrl: './resultados-asamblea.component.scss'
})
export class ResultadosAsambleaComponent {
  candidaturas$!: Observable<Candidatura[]>;
  candidaturas: Candidatura[] = [];
  title: string = 'Sin votaciones';
  totalVotos = 0;
  votosEmitidos = 0;
  loading: boolean = false;

  constructor(
    private firebaseStorageService: FirebaseStorageService
  ) { }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.firebaseStorageService.realtimeData$.subscribe((data) => {
      if (data) {
        console.log(data);
        this.title = data.votaciones.title;
        this.candidaturas = data.votaciones.candidaturas || [];
        this.totalVotos = this.totalVotosActuales();
        this.votosEmitidos = data.votaciones.totalVotes || 0;
      }
    });
    this.loading = false;
  }

  get candidaturasOrdenadas() {
    return [...this.candidaturas].sort((a, b) => b.votes - a.votes);
  }

  porcentaje(votos: number): number {
    return this.votosEmitidos > 0 ? (votos / this.votosEmitidos) * 100 : 0;
  }

  get mayoriaAbsoluta(): number {
    return Math.floor(this.votosEmitidos / 2) + 1;
  }

  get ganadores(): Candidatura[] {
    if (!this.candidaturas || this.candidaturas.length === 0) return [];

    const votosAsignados = this.totalVotosActuales();
    const votosRestantes = this.votosEmitidos - votosAsignados;

    const maxVotos = Math.max(...this.candidaturas.map(c => c.votes || 0));
    const empatados = this.candidaturas.filter(c => (c.votes || 0) === maxVotos);

    // Si hay más de un empatado y aún quedan votos por contar, el empate puede romperse
    if (empatados.length > 1 && votosRestantes > 0) {
      return [];
    }

    // Ver si algún otro candidato aún puede superar o empatar al actual líder
    const maxPotencialOtro = this.candidaturas
      .filter(c => (c.votes || 0) < maxVotos)
      .map(c => (c.votes || 0) + votosRestantes)
      .reduce((max, val) => Math.max(max, val), 0);

    if (maxPotencialOtro >= maxVotos) {
      return [];
    }

    return empatados;
  }







  esGanador(c: Candidatura): boolean {
    return this.ganadores.some(g => g.label === c.label);
  }

  porcentajeSobreMaximo(c: Candidatura): number {
    return c.maxVotes > 0 ? (c.votes / c.maxVotes) * 100 : 0;
  }

  color(votos: number): string {
    const maxVotos = Math.max(...this.candidaturas.map(c => c.votes || 0));
    const p = (votos / maxVotos) * 100;

    if (p >= 90) return '#27ae60'; // verde fuerte
    if (p >= 70) return '#2ecc71'; // verde claro
    if (p >= 50) return '#f1c40f'; // amarillo
    if (p >= 30) return '#e67e22'; // naranja
    return '#e74c3c';              // rojo
  }


  colorPorPorcentaje(p: number): string {
    if (p >= 75) return '#27ae60';
    if (p >= 50) return '#f1c40f';
    if (p >= 25) return '#e67e22';
    return '#e74c3c';
  }

  votosNecesariosParaGanar(c: Candidatura): number {
    const votosActuales = c.votes || 0;
    const votosAsignados = this.totalVotosActuales();
    const votosRestantes = this.votosEmitidos - votosAsignados;

    const maxVotos = Math.max(...this.candidaturas.map(cand => cand.votes || 0));

    // Si no puede alcanzar el máximo, ni siquiera empatando
    if (votosActuales + votosRestantes < maxVotos) return -1;

    // Si ya está por encima de todos y nadie puede empatarle
    const puedeEmpatar = this.candidaturas.some(r => {
      if (r === c) return false;
      const rVotos = r.votes || 0;
      return rVotos + votosRestantes >= votosActuales;
    });

    if (!puedeEmpatar) return 0;

    // Si puede empatar o superar, buscamos el mínimo número de votos que aseguran victoria
    for (let extraVotos = 1; extraVotos <= votosRestantes; extraVotos++) {
      const posiblesVotos = votosActuales + extraVotos;
      const rivalesPuedenIgualar = this.candidaturas.some(r => {
        if (r === c) return false;
        const rVotos = r.votes || 0;
        return rVotos + (votosRestantes - extraVotos) >= posiblesVotos;
      });

      if (!rivalesPuedenIgualar) return extraVotos;
    }

    // No puede asegurarlo con ningún reparto
    return -1;
  }

  totalVotosActuales(): number {
    return this.candidaturas.reduce((acc, c) => acc + (c.votes || 0), 0);
  }

  get maxVotosNecesariosParaGanar(): number {
    return Math.max(
      ...this.candidaturas
        .map(c => this.votosNecesariosParaGanar(c))
        .filter(n => n > 0)
    );
  }

  get umbralMinimoDeVictoria(): number {
    return Math.min(
      ...this.candidaturas
        .map(c => {
          const necesarios = this.votosNecesariosParaGanar(c);
          return necesarios === -1 ? Infinity : (c.votes || 0) + necesarios;
        })
    );
  }


}
