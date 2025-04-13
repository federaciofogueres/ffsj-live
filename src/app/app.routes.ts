import { Routes } from '@angular/router';
import { AdminComponent } from './components/admin/admin.component';
import { HomeComponent } from './components/home/home.component';
import { ItemComponent } from './components/item/item.component';
import { ListComponent } from './components/list/list.component';
import { LiveComponent } from './components/live/live.component';
import { LoginComponent } from './components/login/login.component';
import { StreamingComponent } from './components/streaming/streaming.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: 'admin', component: AdminComponent, canActivate: [AuthGuard] },
    { path: 'list', component: ListComponent },
    { path: 'list/:id', component: ItemComponent },
    { path: 'streaming', component: StreamingComponent },
    { path: 'live', component: LiveComponent },
    { path: 'login', component: LoginComponent },
    { path: '**', component: HomeComponent },
];
