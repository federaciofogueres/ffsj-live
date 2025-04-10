import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ItemComponent } from './components/item/item.component';
import { CandidataComponent } from './components/libro-candidatas/candidata/candidata.component';
import { LibroCandidatasComponent } from './components/libro-candidatas/libro-candidatas.component';
import { ListComponent } from './components/list/list.component';
import { LiveComponent } from './components/live/live.component';
import { LoginComponent } from './components/login/login.component';
import { StreamingComponent } from './components/streaming/streaming.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: 'list', component: ListComponent, canActivate: [AuthGuard] },
    { path: 'list/:id', component: ItemComponent, canActivate: [AuthGuard] },
    { path: 'libro', component: LibroCandidatasComponent, canActivate: [AuthGuard] },
    { path: 'candidatas/:id', component: CandidataComponent, canActivate: [AuthGuard] },
    { path: 'streaming', component: StreamingComponent, canActivate: [AuthGuard] },
    { path: 'live', component: LiveComponent, canActivate: [AuthGuard] },
    { path: 'login', component: LoginComponent },
    { path: '**', component: HomeComponent, canActivate: [AuthGuard] },
];
