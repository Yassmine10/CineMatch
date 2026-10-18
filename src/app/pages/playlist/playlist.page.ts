import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonIcon, IonSpinner
} from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { MovieService } from '../../services/movie.service';
import { UserService } from '../../services/user.service';
import { Movie } from '../../models/movie.model';
import { UserProfile } from '../../models/user.model';
import { addIcons } from 'ionicons';
import {
  trashOutline, filmOutline, star, peopleOutline, heart
} from 'ionicons/icons';

@Component({
  selector: 'app-playlist',
  templateUrl: './playlist.page.html',
  styleUrls: ['./playlist.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonContent, IonIcon, IonSpinner
  ]
})
export class PlaylistPage implements OnInit {
  favoriteMovies: Movie[] = [];
  currentUser: UserProfile | null = null;
  isLoading = true;

  constructor(
    private authService: AuthService,
    private movieService: MovieService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      trashOutline, filmOutline, star, peopleOutline, heart
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user && user.favorites && user.favorites.length > 0) {
        this.loadFavorites(user.favorites);
      } else {
        this.favoriteMovies = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  ionViewWillEnter() {
    if (this.currentUser && this.currentUser.favorites && this.currentUser.favorites.length > 0) {
      this.loadFavorites(this.currentUser.favorites);
    } else if (this.currentUser) {
      this.favoriteMovies = [];
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  loadFavorites(favIds: string[]) {
    this.isLoading = true;
    const cleanIds = (favIds || []).map(id => String(id).trim());

    if (cleanIds.length === 0) {
      this.favoriteMovies = [];
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.movieService.getAllMovies().subscribe({
      next: (allMovies) => {
        // Match robustly whether id is numeric '550' or tmdb prefixed 'tmdb_550'
        this.favoriteMovies = allMovies.filter(m => {
          const mId = String(m.id).trim();
          const mNum = mId.replace(/^tmdb_/, '');
          return cleanIds.some(favId => {
            const fNum = favId.replace(/^tmdb_/, '');
            return favId === mId || (mNum.length > 0 && fNum === mNum);
          });
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Error fetching movies for playlist:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  async removeFavorite(movieId: string, event?: Event) {
    if (event) event.stopPropagation();
    if (!this.currentUser) return;

    // Optimistic UI update
    this.favoriteMovies = this.favoriteMovies.filter(m => m.id !== movieId);
    this.currentUser.favorites = (this.currentUser.favorites || []).filter(id => id !== movieId);
    this.cdr.detectChanges();

    try {
      await this.userService.removeFavorite(this.currentUser.uid, movieId);
    } catch (e) {
      console.warn('Error removing favorite from Firestore:', e);
    }
  }

  onPosterError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80';
  }

  openDetail(movie: Movie) {
    this.router.navigate(['/movie-detail', movie.id]);
  }

  goToMovies() {
    this.router.navigate(['/tabs/movies']);
  }
}

