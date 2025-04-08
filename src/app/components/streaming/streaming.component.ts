import { Component } from '@angular/core';
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
      `https://www.youtube.com/embed/${this.streaming.src}`
    );
  }

}
