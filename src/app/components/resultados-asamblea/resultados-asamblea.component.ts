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

  get ganador(): Candidatura | null {
    const votosAsignados = this.totalVotosActuales();
    const votosRestantes = this.votosEmitidos - votosAsignados;

    return this.candidaturas.find(c => {
      const votosCandidato = c.votes || 0;
      // Verificamos si hay algún rival que podría alcanzar o superar sus votos
      const algunRivalPuedeSuperar = this.candidaturas.some(rival => {
        if (rival === c) return false;
        const votosRivalActuales = rival.votes || 0;
        const votosRivalMaximos = votosRivalActuales + votosRestantes;
        return votosRivalMaximos >= votosCandidato;
      });

      return !algunRivalPuedeSuperar;
    }) || null;
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

    // Si ya ha ganado por mayoría absoluta
    if (votosActuales >= this.mayoriaAbsoluta) {
      return 0;
    }

    // Si no puede llegar nunca a la mayoría absoluta, calculamos por mayoría simple
    for (let extraVotos = 0; extraVotos <= votosRestantes; extraVotos++) {
      const votosParaCandidato = votosActuales + extraVotos;
      const votosRestantesSimulados = votosRestantes - extraVotos;

      // Calcular el máximo que podrían alcanzar los rivales
      const maxVotosRival = this.candidaturas
        .filter(r => r !== c)
        .map(r => (r.votes || 0) + votosRestantesSimulados)
        .reduce((a, b) => Math.max(a, b), 0);

      // Si el candidato supera a cualquier posible rival
      if (votosParaCandidato > maxVotosRival) {
        return extraVotos;
      }
    }

    // No puede asegurar victoria con los votos restantes
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
