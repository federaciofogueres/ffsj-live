import { Component, HostListener } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IRealTimeStreaming } from '../../model/real-time-streaming.model';
import { FirebaseStorageService } from '../../services/storage.service';

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
    height: 0
  };

  safeUrl!: SafeResourceUrl;
  public fullScreen: boolean = false;

  constructor(
    private firebaseStorageService: FirebaseStorageService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    const config = await this.firebaseStorageService.getRealtimeData('config');
    this.streaming = config.streaming;
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${this.streaming.src}?rel=0&modestbranding=1&playsinline=1`
    );
  }

  @HostListener('window:resize', ['$event'])
  onResize(): void {
    const isLandscape = window.innerWidth > window.innerHeight;

    if (isLandscape) {
      this.enterFullscreen();
    } else {
      this.exitFullscreen();
    }
  }

  enterFullscreen(): void {
    this.fullScreen = true;
    const iframe = document.querySelector('iframe');
    if (iframe) {
      // Verifica la compatibilidad con la API de pantalla completa
      if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
      } else if ((iframe as any).webkitRequestFullscreen) { // Safari
        (iframe as any).webkitRequestFullscreen();
      } else if ((iframe as any).mozRequestFullScreen) { // Firefox
        (iframe as any).mozRequestFullScreen();
      } else if ((iframe as any).msRequestFullscreen) { // IE/Edge
        (iframe as any).msRequestFullscreen();
      } else {
        console.warn('Fullscreen API is not supported in this browser.');
      }
    }
  }

  exitFullscreen(): void {
    this.fullScreen = false;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) { // Safari
      (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) { // Firefox
      (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) { // IE/Edge
      (document as any).msExitFullscreen();
    } else {
      console.warn('Fullscreen API is not supported in this browser.');
    }
  }

}
