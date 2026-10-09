import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular';
import { MovieService } from '../../services/movie.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Movie } from '../../models/movie.model';
import { UserProfile } from '../../models/user.model';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline, heart, heartOutline, star,
  checkmarkOutline, chevronForwardOutline, addOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-movie-detail',
  templateUrl: './movie-detail.page.html',
  styleUrls: ['./movie-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner]
})
export class MovieDetailPage implements OnInit {
  movie: Movie | null = null;
  currentUser: UserProfile | null = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private movieService: MovieService,
    private userService: UserService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      chevronBackOutline,
      heart,
      heartOutline,
      star,
      checkmarkOutline,
      chevronForwardOutline,
      addOutline
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.movieService.getMovieById(id).subscribe(movie => {
        if (movie) {
          this.movie = movie;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    } else {
      this.isLoading = false;
    }

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.cdr.detectChanges();
    });
  }

  isFavorite(): boolean {
    return !!(this.movie && this.currentUser?.favorites?.includes(this.movie.id));
  }

  async toggleFavorite() {
    if (!this.movie || !this.currentUser) return;

    if (this.isFavorite()) {
      await this.userService.removeFavorite(this.currentUser.uid, this.movie.id);
    } else {
      await this.userService.addFavorite(this.currentUser.uid, this.movie.id);
    }
    this.cdr.detectChanges();
  }

  get movieTags(): string[] {
    if (!this.movie) return ['Cinéma', 'Passion'];
    const genre = (this.movie.genre || '').toLowerCase();
    if (genre.includes('science') || genre.includes('fiction') || genre.includes('espace')) {
      return ['Épique', 'Émotion', 'Espace'];
    }
    if (genre.includes('action') || genre.includes('aventure')) {
      return ['Intense', 'Adrénaline', 'Spectaculaire'];
    }
    if (genre.includes('drame') || genre.includes('romance')) {
      return ['Émotion', 'Profond', 'Touchant'];
    }
    if (genre.includes('comédie')) {
      return ['Rire', 'Détente', 'Feel-Good'];
    }
    if (genre.includes('thriller') || genre.includes('crime') || genre.includes('mystère')) {
      return ['Suspense', 'Mystère', 'Captivant'];
    }
    if (genre.includes('animation')) {
      return ['Magie', 'Aventure', 'Famille'];
    }
    return ['Culte', 'Incontournable', 'Cinéma'];
  }

  get estimatedRuntime(): string {
    if (!this.movie) return '2 h 15 min';
    // Durée estimée ou formatée
    const title = this.movie.title.toLowerCase();
    if (title.includes('interstellar') || title.includes('interstellaire')) return '2 h 49 min';
    if (title.includes('dark knight') || title.includes('batman')) return '2 h 32 min';
    if (title.includes('fight club')) return '2 h 19 min';
    if (title.includes('pulp fiction')) return '2 h 34 min';
    if (title.includes('inception')) return '2 h 28 min';
    return '2 h 10 min';
  }

  onImgError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80';
  }

  goBack() {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/tabs/movies']);
    }
  }

  goToPlaylist() {
    this.router.navigate(['/tabs/playlist']);
  }
}
