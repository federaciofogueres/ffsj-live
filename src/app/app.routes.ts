import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ListComponent } from './components/list/list.component';
import { LiveComponent } from './components/live/live.component';
import { StreamingComponent } from './components/streaming/streaming.component';

export const routes: Routes = [
    { path: 'list', component: ListComponent },
    { path: 'streaming', component: StreamingComponent },
    { path: 'live', component: LiveComponent },
    { path: '**', component: HomeComponent },
];
