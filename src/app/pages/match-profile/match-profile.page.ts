import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { MovieService } from '../../services/movie.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { MatchingService, MatchResult } from '../../services/matching.service';
import { UserProfile } from '../../models/user.model';
import { Movie } from '../../models/movie.model';
import { addIcons } from 'ionicons';
import { arrowBackOutline, filmOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-match-profile',
  templateUrl: './match-profile.page.html',
  styleUrls: ['./match-profile.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon]
})
export class MatchProfilePage implements OnInit {
  /** Utilisateur dont on consulte le profil */
  matchUser: UserProfile | null = null;
  /** Utilisateur courant connecté */
  currentUser: UserProfile | null = null;
  /** Tous les films du catalogue */
  allMovies: Movie[] = [];
  /** Films favoris du matchUser (objets complets) */
  userMovies: Movie[] = [];
  /** Ids des films en commun (pré-calculé depuis la navigation state ou recalculé) */
  commonMovieIds: Set<string> = new Set();

  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private authService: AuthService,
    private movieService: MovieService,
    private matchingService: MatchingService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ arrowBackOutline, filmOutline, checkmarkCircleOutline });

    // Récupérer le state passé depuis la page matching (optionnel)
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { match?: MatchResult } | undefined;
    if (state?.match) {
      this.matchUser = state.match.user;
      this.commonMovieIds = new Set(state.match.commonMovieIds);
      if (state.match.commonMovies?.length) {
        this.userMovies = state.match.commonMovies;
      }
    }
  }

  ngOnInit() {
    const uid = this.route.snapshot.paramMap.get('uid');
    if (!uid) {
      this.goBack();
      return;
    }

    combineLatest([
      this.authService.currentUser$,
      this.userService.getAllUsers(),
      this.movieService.getAllMovies()
    ]).subscribe(([currentUser, allUsers, allMovies]) => {
      this.currentUser = currentUser;
      this.allMovies = allMovies;

      // Si allUsers est encore vide (chargement en cours), ne pas éjecter l'utilisateur
      if (allUsers.length === 0 && !this.matchUser) {
        return;
      }

      const found = allUsers.find(u => u.uid === uid) || this.matchUser;
      if (!found) {
        if (allUsers.length > 0) {
          this.goBack();
        }
        return;
      }
      this.matchUser = found;

      // Si les commonMovieIds ne viennent pas du state, les recalculer
      if (this.commonMovieIds.size === 0 && currentUser?.favorites?.length) {
        const ids = this.matchingService.getCommonMovies(
          currentUser.favorites,
          found.favorites || []
        );
        this.commonMovieIds = new Set(ids);
      }

      // Résoudre les films favoris de matchUser en objets complets (avec fallback propre)
      this.userMovies = (found.favorites || [])
        .map(id => {
          const m = allMovies.find(movie => movie.id === id);
          if (m) return m;
          return {
            id,
            title: `Film (${id})`,
            year: '',
            genre: 'Favori',
            overview: '',
            posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&q=60',
            rating: 8.0,
            source: 'admin' as const
          };
        });

      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  isCommon(movieId: string): boolean {
    return this.commonMovieIds.has(movieId);
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

  goBack() {
    this.router.navigate(['/tabs/matching']);
  }
}
