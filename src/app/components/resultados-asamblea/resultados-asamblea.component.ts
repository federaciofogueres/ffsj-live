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
      }
    });
    this.loading = false;
  }

  get candidaturasOrdenadas() {
    return [...this.candidaturas].sort((a, b) => b.votes - a.votes);
  }

  porcentaje(votos: number): number {
    return this.totalVotos > 0 ? (votos / this.totalVotos) * 100 : 0;
  }

  color(votos: number): string {
    const p = this.porcentaje(votos);
    if (p >= 75) return '#27ae60'; // verde
    if (p >= 50) return '#f1c40f'; // amarillo
    if (p >= 25) return '#e67e22'; // naranja
    return '#e74c3c';              // rojo
  }

}
