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
      }
    });
    this.loading = false;
    // this.candidaturas$ = this.votacionesService.getCandidaturas().pipe(
    //   map(candidaturas => {
    //     this.totalVotos = candidaturas.reduce((acc, c) => acc + c.votes, 0);
    //     return candidaturas.sort((a, b) => b.votes - a.votes);
    //   })
    // );
  }

  porcentaje(votos: number): number {
    return this.totalVotos > 0 ? (votos / this.totalVotos) * 100 : 0;
  }
}
