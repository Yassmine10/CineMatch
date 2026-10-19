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

  selectedFilter: MatchFilterType = 'all';

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

    // Filter real users from Firestore (excluding self and inactive)
    const otherUsers = (this.allUsers || []).filter(u =>
      u.uid !== this.currentUser?.uid &&
      u.email !== this.currentUser?.email &&
      u.active !== false &&
      u.role !== 'admin'
    );

    let candidateUsers = [...otherUsers];
    if (candidateUsers.length < 3) {
      const demoUsers = this.getDemoCinephiles(favs, this.allMovies);
      for (const demo of demoUsers) {
        if (!candidateUsers.some(u => u.uid === demo.uid)) {
          candidateUsers.push(demo);
        }
      }
    }

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

  private getDemoCinephiles(currentFavs: string[], allMovies: Movie[]): UserProfile[] {
    if (allMovies.length === 0) return [];
    const movieIds = allMovies.map(m => m.id);
    const count = currentFavs.length;

    const demo1Favs = Array.from(new Set([
      ...currentFavs.slice(0, Math.max(1, Math.ceil(count * 0.85))),
      ...movieIds.slice(0, 2)
    ]));

    const demo2Favs = Array.from(new Set([
      ...currentFavs.slice(0, Math.max(1, Math.ceil(count * 0.65))),
      ...movieIds.slice(2, 5)
    ]));

    const demo3Favs = Array.from(new Set([
      ...currentFavs.slice(0, Math.max(1, Math.ceil(count * 0.50))),
      ...movieIds.slice(5, 8)
    ]));

    const demo4Favs = Array.from(new Set([
      ...currentFavs.slice(0, Math.max(1, Math.ceil(count * 0.35))),
      ...movieIds.slice(8, 12)
    ]));

    return [
      {
        uid: 'demo_sophie',
        nom: 'Laurent',
        prenom: 'Sophie',
        age: 26,
        email: 'sophie.laurent@cinematch.io',
        phoneNumber: '+33 6 45 28 91 03',
        photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80',
        role: 'user',
        active: true,
        favorites: demo1Favs,
        createdAt: new Date().toISOString()
      },
      {
        uid: 'demo_lucas',
        nom: 'Mercier',
        prenom: 'Lucas',
        age: 28,
        email: 'lucas.mercier@cinematch.io',
        phoneNumber: '+33 6 72 19 84 55',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
        role: 'user',
        active: true,
        favorites: demo2Favs,
        createdAt: new Date().toISOString()
      },
      {
        uid: 'demo_camille',
        nom: 'Chen',
        prenom: 'Camille',
        age: 24,
        email: 'camille.chen@cinematch.io',
        phoneNumber: '+33 6 11 88 43 90',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
        role: 'user',
        active: true,
        favorites: demo3Favs,
        createdAt: new Date().toISOString()
      },
      {
        uid: 'demo_alexandre',
        nom: 'Dumas',
        prenom: 'Alexandre',
        age: 31,
        email: 'alexandre.dumas@cinematch.io',
        phoneNumber: '+33 6 83 49 10 27',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80',
        role: 'user',
        active: true,
        favorites: demo4Favs,
        createdAt: new Date().toISOString()
      }
    ];
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
