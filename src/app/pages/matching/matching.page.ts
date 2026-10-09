import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonIcon, IonRefresher, IonRefresherContent, IonSkeletonText
} from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { MovieService } from '../../services/movie.service';
import { MatchingService, MatchResult, MATCH_THRESHOLD } from '../../services/matching.service';
import { UserProfile } from '../../models/user.model';
import { Movie } from '../../models/movie.model';
import { combineLatest, Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  filmOutline, sparklesOutline, chevronForwardOutline,
  refreshOutline, heartOutline, sadOutline, informationCircleOutline
} from 'ionicons/icons';

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

  isLoading = true;
  hasNoFavorites = false;

  readonly threshold = MATCH_THRESHOLD;

  /** Permet d'afficher tous les utilisateurs (seuil 0%) pour tester facilement */
  testMode = false;

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
      refreshOutline, heartOutline, sadOutline, informationCircleOutline
    });
  }

  ngOnInit() {
    this.loadData();
  }

  ionViewWillEnter() {
    // Recharger à chaque fois que l'utilisateur bascule sur l'onglet Matching
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
      console.log('[CinéMatch Matching] combineLatest émis :', {
        currentUser: user?.email,
        totalUsersInFirestore: users?.length,
        totalMoviesInCatalog: movies?.length
      });

      // Si l'état auth n'a pas encore chargé, patienter
      if (user === null) {
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
      return;
    }

    this.hasNoFavorites = false;
    this.allMatches = this.matchingService.findMatches(
      this.currentUser,
      this.allUsers,
      this.allMovies,
      this.threshold,
      false
    );

    console.log('[CinéMatch Matching] Matchs calculés (seuil = ' + this.threshold + '%) :', this.allMatches);
  }

  toggleTestMode() {
    this.testMode = !this.testMode;
    this.computeMatches();
    this.cdr.detectChanges();
  }

  doRefresh(event: any) {
    this.sub?.unsubscribe();
    this.loadData();
    setTimeout(() => event.target.complete(), 1200);
  }

  /** Analyse diagnostique pour aider à comprendre pourquoi des utilisateurs ne matchent pas */
  get debugInfo(): { totalUsers: number; otherUsers: number; details: { name: string; email: string; score: number; commonCount: number; otherFavCount: number; reason: string }[] } {
    if (!this.currentUser) return { totalUsers: 0, otherUsers: 0, details: [] };

    const others = this.allUsers.filter(u =>
      (u.uid !== this.currentUser?.uid) &&
      (u.email !== this.currentUser?.email)
    );

    const myFavs = this.currentUser.favorites || [];

    const details = others.map(o => {
      const oFavs = o.favorites || [];
      const score = Math.round(this.matchingService.calculateSimilarity(myFavs, oFavs));
      const common = this.matchingService.getCommonMovies(myFavs, oFavs);

      let reason = '';
      if (o.active === false) {
        reason = 'Compte désactivé';
      } else if (oFavs.length === 0) {
        reason = 'Aucun film favori';
      } else if (score <= this.threshold) {
        reason = `Score (${score} %) ≤ ${this.threshold} %`;
      } else {
        reason = 'Eligible au match';
      }

      return {
        name: `${o.prenom || ''} ${o.nom || ''}`.trim() || o.email || 'Utilisateur',
        email: o.email || '',
        score,
        commonCount: common.length,
        otherFavCount: oFavs.length,
        reason
      };
    });

    return {
      totalUsers: this.allUsers.length,
      otherUsers: others.length,
      details
    };
  }

  /** Badge vert si ≥ 90 %, ambre sinon */
  getBadgeClass(percentage: number): string {
    return Math.round(percentage) >= 90 ? 'badge-green' : 'badge-amber';
  }

  getPosterFallback(): string {
    return 'assets/poster-placeholder.png';
  }

  onPosterError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&q=60';
  }

  getInitials(user: UserProfile): string {
    const p = (user.prenom || '').charAt(0).toUpperCase();
    const n = (user.nom || '').charAt(0).toUpperCase();
    return p + n || '?';
  }

  viewProfile(match: MatchResult) {
    this.router.navigate(['/match-profile', match.user.uid], {
      state: { match }
    });
  }

  goToMovies() {
    this.router.navigate(['/tabs/movies']);
  }
}
