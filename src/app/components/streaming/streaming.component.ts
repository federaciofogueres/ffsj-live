import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { IRealTimeStreaming } from '../../model/real-time-config.model';

@Component({
  selector: 'app-streaming',
  standalone: true,
  imports: [],
  templateUrl: './streaming.component.html',
  styleUrl: './streaming.component.scss'
})
export class StreamingComponent {

  public streaming: IRealTimeStreaming = {
    src: 'r0Cxiv2tTyk',
    title: 'Testing title',
    width: 0,
    height: 0,
    subtitle: 'Testing subtitle'
  };

  constructor(
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) private platformId: Object // Inyecta PLATFORM_ID
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  sourceURL() {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${this.streaming.src}?rel=0&modestbranding=1&playsinline=1`
    );
  }

  async loadData() {
    if (isPlatformBrowser(this.platformId)) { // Verifica si el código se ejecuta en el navegador
      const config = JSON.parse(localStorage.getItem('config') || '{}');
      this.streaming = config.streaming || this.streaming;
    } else {
      console.warn('localStorage no está disponible en este entorno.');
    }
  }

}
