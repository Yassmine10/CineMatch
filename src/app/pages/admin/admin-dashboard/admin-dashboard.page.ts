import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonIcon
} from '@ionic/angular';
import { AuthService } from '../../../services/auth.service';
import { MovieService } from '../../../services/movie.service';
import { UserService } from '../../../services/user.service';
import { UserProfile } from '../../../models/user.model';
import { combineLatest } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  filmOutline, peopleOutline, checkmarkOutline, chevronForwardOutline,
  gridOutline, logOutOutline, heart
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon]
})
export class AdminDashboardPage implements OnInit {
  currentUser: UserProfile | null = null;
  totalMoviesCount = 0;
  totalUsersCount = 0;
  activeUsersCount = 0;
  activePercentage = 100;
  isLoading = true;

  constructor(
    private authService: AuthService,
    private movieService: MovieService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      filmOutline, peopleOutline, checkmarkOutline, chevronForwardOutline,
      gridOutline, logOutOutline, heart
    });
  }

  ngOnInit() {
    combineLatest([
      this.authService.currentUser$,
      this.movieService.getAllMovies(),
      this.userService.getAllUsers()
    ]).subscribe(([user, movies, users]) => {
      this.currentUser = user;
      this.totalMoviesCount = movies.length;

      // Filtrer les comptes utilisateurs réguliers (exclure les admins)
      const regularUsers = users.filter(u => (u.role as string)?.trim() !== 'admin');
      this.totalUsersCount = regularUsers.length;
      this.activeUsersCount = regularUsers.filter(u => u.active !== false).length;

      this.activePercentage = this.totalUsersCount > 0
        ? Math.round((this.activeUsersCount / this.totalUsersCount) * 100)
        : 100;

      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  get adminInitials(): string {
    if (this.currentUser?.prenom && this.currentUser?.nom) {
      return (this.currentUser.prenom[0] + this.currentUser.nom[0]).toUpperCase();
    }
    return 'AD';
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }

  async onLogout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }
}
