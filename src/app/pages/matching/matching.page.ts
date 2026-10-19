import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonIcon, IonRefresher, IonRefresherContent, IonSkeletonText
} from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { MovieService } from '../../services/movie.service';
import { MatchingService, MatchResult } from '../../services/matching.service';
import { UserProfile } from '../../models/user.model';
import { Movie } from '../../models/movie.model';
import { combineLatest, Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  filmOutline, sparklesOutline, chevronForwardOutline,
  refreshOutline, heartOutline, sadOutline, informationCircleOutline,
  flameOutline, flame, starOutline, star, checkmarkCircleOutline,
  peopleOutline, personOutline
} from 'ionicons/icons';

export type MatchFilterType = 'all' | 'high' | 'super';

@Component({
  selector: 'app-matching',
  templateUrl: './matching.page.html',
  styleUrls: ['./matching.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonIcon, IonRefresher, IonRefresherContent, IonSkeletonText
  ]
})
export class MatchingPage implements OnInit, OnDestroy {
  currentUser: UserProfile | null = null;
  allUsers: UserProfile[] = [];
  allMovies: Movie[] = [];
  allMatches: MatchResult[] = [];
  filteredMatches: MatchResult[] = [];

  isLoading = true;
  hasNoFavorites = false;

  selectedFilter: MatchFilterType = 'super';

  private sub!: Subscription;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private movieService: MovieService,
    private matchingService: MatchingService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      filmOutline, sparklesOutline, chevronForwardOutline,
      refreshOutline, heartOutline, sadOutline, informationCircleOutline,
      flameOutline, flame, starOutline, star, checkmarkCircleOutline,
      peopleOutline, personOutline
    });
  }

  ngOnInit() {
    this.loadData();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  loadData() {
    this.isLoading = true;
    this.sub?.unsubscribe();

    this.sub = combineLatest([
      this.authService.currentUser$,
      this.userService.getAllUsers(),
      this.movieService.getAllMovies()
    ]).subscribe(([user, users, movies]) => {
      if (user === null) {
        return;
      }

      // If user is Admin, matching is not for them; redirect to dashboard
      if (user.role === 'admin') {
        this.router.navigate(['/tabs/dashboard']);
        return;
      }

      this.currentUser = user;
      this.allUsers = users || [];
      this.allMovies = movies || [];
      this.isLoading = false;

      this.computeMatches();
      this.cdr.detectChanges();
    });
  }

  computeMatches() {
    if (!this.currentUser) return;

    const favs = this.currentUser.favorites || [];
    if (favs.length === 0) {
      this.hasNoFavorites = true;
      this.allMatches = [];
      this.filteredMatches = [];
      return;
    }

    this.hasNoFavorites = false;

    // Strictly real users from Firestore (excluding self, admins and deactivated accounts)
    const candidateUsers = (this.allUsers || []).filter(u =>
      u.uid !== this.currentUser?.uid &&
      u.email !== this.currentUser?.email &&
      u.active !== false &&
      u.role !== 'admin'
    );

    this.allMatches = this.matchingService.findMatches(
      this.currentUser,
      candidateUsers,
      this.allMovies,
      0,
      false
    );

    this.applyFilter();
  }

  setFilter(filter: MatchFilterType) {
    this.selectedFilter = filter;
    this.applyFilter();
  }

  applyFilter() {
    if (this.selectedFilter === 'super') {
      this.filteredMatches = this.allMatches.filter(m => Math.round(m.percentage) >= 75);
    } else if (this.selectedFilter === 'high') {
      this.filteredMatches = this.allMatches.filter(m => Math.round(m.percentage) >= 50);
    } else {
      this.filteredMatches = this.allMatches;
    }
    this.cdr.detectChanges();
  }

  getBadgeClass(percentage: number): string {
    const val = Math.round(percentage);
    if (val >= 75) return 'badge-super';
    if (val >= 50) return 'badge-high';
    return 'badge-medium';
  }

  getAffinityLabel(percentage: number): string {
    const val = Math.round(percentage);
    if (val >= 80) return 'Soulmate Match';
    if (val >= 75) return 'Super Soulmate';
    if (val >= 50) return 'High Affinity';
    return 'Taste Match';
  }

  doRefresh(event: any) {
    this.sub?.unsubscribe();
    this.loadData();
    setTimeout(() => event.target.complete(), 1000);
  }

  onPosterError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&q=60';
  }

  viewProfile(match: MatchResult) {
    this.router.navigate(['/tabs/match-profile', match.user.uid], {
      state: { match }
    });
  }

  goToMovies() {
    this.router.navigate(['/tabs/movies']);
  }
}
