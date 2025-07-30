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

    return this.candidaturas.filter(c => {
      const votosActuales = c.votes || 0;

      // Si no puede ser superado por ningún rival en ningún caso → ganador
      const puedeSerSuperado = this.candidaturas.some(rival => {
        if (rival === c) return false;
        const votosRival = rival.votes || 0;

        // Rival con todos los votos posibles
        const maxRival = votosRival + votosRestantes;

        return maxRival > votosActuales;
      });

      return !puedeSerSuperado;
    });
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

    const maxVotosActuales = Math.max(...this.candidaturas.map(r => r.votes || 0));

    // Ya ha ganado si está empatado en cabeza y no quedan votos
    if (votosActuales === maxVotosActuales && votosRestantes === 0) {
      return 0;
    }

    // Si no puede alcanzar el empate, no puede ganar
    if (votosActuales + votosRestantes < maxVotosActuales) {
      return -1;
    }

    // Probar todos los votos posibles que podría recibir (de 0 a votosRestantes)
    for (let extraVotos = 0; extraVotos <= votosRestantes; extraVotos++) {
      const totalCandidato = votosActuales + extraVotos;
      const votosRestantesSimulados = votosRestantes - extraVotos;

      // Calcular cuántos votos podrían tener los demás en el peor caso
      const maxPosibleRival = Math.max(
        ...this.candidaturas
          .filter(r => r !== c)
          .map(r => (r.votes || 0) + votosRestantesSimulados)
      );

      // Si con estos votos puede ganar o empatar sin que lo superen después
      if (totalCandidato > maxPosibleRival) {
        return extraVotos;
      }

      // Si hay empate pero nadie puede superarlo después => también gana
      if (totalCandidato === maxPosibleRival) {
        const puedeRomperEmpate = this.candidaturas
          .filter(r => r !== c)
          .some(r => {
            const votosRival = r.votes || 0;
            const maxRival = votosRival + votosRestantesSimulados;
            return maxRival > totalCandidato;
          });

        if (!puedeRomperEmpate) {
          return extraVotos;
        }
      }
    }

    return -1; // No hay escenario donde pueda ganar
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
