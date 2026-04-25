import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { AuthService } from "ffsj-web-components";
import { CensoService } from "../services/censo.service";

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private readonly adminCargoId = 16;

  constructor(
    private authService: AuthService,
    private router: Router,
    private censoService: CensoService
  ) { }

  canActivate(): boolean {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }

    const token = this.authService.getToken();
    this.censoService.configuration.accessToken = token;

    const isAdmin = this.authService
      .getCargos()
      .some((cargo: { idCargo: number }) => cargo.idCargo === this.adminCargoId);

    if (!isAdmin) {
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }

}
