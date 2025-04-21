import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'ffsj-web-components';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit, OnDestroy {
  userLogged: boolean = false;
  private unsubscribe$ = new Subject<void>();

  constructor(
    protected router: Router,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.userLogged = this.authService.isLoggedIn();
    this.authService.loginStatusObservable.pipe(
      takeUntil(this.unsubscribe$)
    ).subscribe({
      next: (loggedIn: boolean) => {
        this.userLogged = loggedIn;
      }
    });
  }

  redirectTo(url: string) {
    this.router.navigate([url]);
  }

  ngOnDestroy() {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}