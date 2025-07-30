import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { Candidatura } from '../../model/candidatura.model';
import { FirebaseStorageService } from '../../services/storage.service';

@Component({
  selector: 'app-resultados-asamblea',
  standalone: true,
  imports: [
    CommonModule
  ],
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
        this.title = data.votaciones.title
        this.candidaturas = data.votaciones.candidaturas || [];
        this.totalVotos = this.candidaturas.reduce((acc, c) => acc + c.votes, 0);
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
    const ordenadas = this.candidaturasOrdenadas;
    if (ordenadas.length === 0) return null;
    const top = ordenadas[0];
    return top.votes >= this.mayoriaAbsoluta ? top : null;
  }

  porcentajeSobreMaximo(c: Candidatura): number {
    return c.maxVotes > 0 ? (c.votes / c.maxVotes) * 100 : 0;
  }

  color(votos: number): string {
    const p = this.porcentaje(votos);
    if (p >= 50) return '#27ae60'; // verde
    if (p >= 25) return '#f1c40f'; // amarillo
    if (p >= 10) return '#e67e22'; // naranja
    return '#e74c3c';              // rojo
  }

  colorPorPorcentaje(p: number): string {
    if (p >= 75) return '#27ae60'; // verde
    if (p >= 50) return '#f1c40f'; // amarillo
    if (p >= 25) return '#e67e22'; // naranja
    return '#e74c3c';              // rojo
  }

}
