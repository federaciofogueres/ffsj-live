import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CookieService } from 'ngx-cookie-service';
import { Subject, takeUntil } from 'rxjs';
import { AuthService, FfsjAlertService } from '../../../lib/ffsj-web-components';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterModule,
    NgbModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  userLogged: boolean = false;
  userAdmin: boolean = false;
  private unsubscribe$ = new Subject<void>();
  protected idPleno = -1;

  constructor(
    protected router: Router,
    protected authService: AuthService,
    private cookieService: CookieService,
    private ffsjAlertService: FfsjAlertService
  ) { }

  ngOnInit() {
    this.userLogged = this.authService.isLoggedIn();
    this.authService.loginStatusObservable.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe({
      next: (loggedIn: boolean) => {
        this.ffsjAlertService.success('Bienvenid@! ');
        this.userLogged = loggedIn;
        this.userAdmin = this.authService.getCargos().some((cargo: any) => cargo.idCargo === 16);
      }
    });
  }

  redirectToPleno() {
    this.getIdPleno();
    if (this.idPleno > 0) {
      this.router.navigateByUrl('plenos/' + this.idPleno);
    } else {
      this.router.navigateByUrl('plenos');
    }
  }

  getIdPleno() {
    this.idPleno = this.cookieService.get('idPleno') ? parseInt(this.cookieService.get('idPleno')) : -1;
  }

  logout() {
    this.authService.logout();
    this.router.navigateByUrl('');
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}