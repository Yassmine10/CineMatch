import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonIcon, IonSpinner
} from '@ionic/angular';
import { MovieService } from '../../services/movie.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { Movie } from '../../models/movie.model';
import { UserProfile } from '../../models/user.model';
import { addIcons } from 'ionicons';
import { heart, heartOutline, star, searchOutline } from 'ionicons/icons';

@Component({
  selector: 'app-movies',
  templateUrl: './movies.page.html',
  styleUrls: ['./movies.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonIcon, IonSpinner
  ]
})
export class MoviesPage implements OnInit {
  movies: Movie[] = [];
  filteredMovies: Movie[] = [];
  searchQuery = '';
  selectedCategory = 'Tous';
  categories: string[] = [
    'Tous', 'Action', 'Comédie', 'Drame', 'Science-Fiction', 'Animation', 'Thriller', 'Romance'
  ];

  currentUser: UserProfile | null = null;
  isLoading = true;

  constructor(
    private movieService: MovieService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ heart, heartOutline, star, searchOutline });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.cdr.detectChanges();
    });

    this.movieService.getAllMovies().subscribe(movies => {
      this.movies = movies;
      this.isLoading = false;
      this.filterMovies();
      this.cdr.detectChanges();
    });
  }

  get greeting(): string {
    const hour = new Date().getHours();
    const salutation = hour >= 18 || hour < 5 ? 'BONSOIR' : 'BONJOUR';
    const name = this.currentUser?.prenom ? `, ${this.currentUser.prenom.toUpperCase()}` : '';
    return `${salutation}${name}`;
  }

  selectCategory(category: string) {
    if (this.selectedCategory === category && category !== 'Tous') {
      this.selectedCategory = 'Tous';
    } else {
      this.selectedCategory = category;
    }
    this.filterMovies();
  }

  filterMovies() {
    let list = this.movies;

    if (this.selectedCategory !== 'Tous') {
      const cat = this.selectedCategory.toLowerCase();
      list = list.filter(m => m.genre && m.genre.toLowerCase().includes(cat));
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(m =>
        m.title.toLowerCase().includes(q) ||
        (m.genre && m.genre.toLowerCase().includes(q)) ||
        (m.overview && m.overview.toLowerCase().includes(q))
      );
    }

    this.filteredMovies = list;
    this.cdr.detectChanges();
  }

  isFavorite(movieId: string): boolean {
    return this.currentUser?.favorites?.includes(movieId) || false;
  }

  async toggleFavorite(movie: Movie, event: Event) {
    event.stopPropagation();
    if (!this.currentUser) return;

    if (this.isFavorite(movie.id)) {
      await this.userService.removeFavorite(this.currentUser.uid, movie.id);
    } else {
      await this.userService.addFavorite(this.currentUser.uid, movie.id);
    }
    this.cdr.detectChanges();
  }

  get userInitials(): string {
    if (this.currentUser?.prenom && this.currentUser?.nom) {
      return (this.currentUser.prenom[0] + this.currentUser.nom[0]).toUpperCase();
    }
    if (this.currentUser?.prenom) {
      return this.currentUser.prenom.substring(0, 2).toUpperCase();
    }
    return 'CM';
  }

  onAvatarError() {
    if (this.currentUser) {
      this.currentUser = { ...this.currentUser, photo: '' };
      this.cdr.detectChanges();
    }
  }

  onPosterError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80';
  }

  openDetail(movie: Movie) {
    this.router.navigate(['/movie-detail', movie.id]);
  }

  goToProfile() {
    this.router.navigate(['/tabs/profile']);
  }
}
