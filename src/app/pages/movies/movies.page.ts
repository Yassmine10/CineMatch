import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonIcon, IonSpinner, IonModal, IonToast, IonLoading
} from '@ionic/angular';
import { MovieService } from '../../services/movie.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { TmdbService } from '../../services/tmdb.service';
import { Movie } from '../../models/movie.model';
import { UserProfile } from '../../models/user.model';
import { addIcons } from 'ionicons';
import {
  heart, heartOutline, star, searchOutline,
  add, addCircle, addCircleOutline, trashOutline, trash,
  createOutline, create, sparklesOutline, cloudDownloadOutline,
  closeOutline, chevronForwardOutline, checkmarkCircleOutline,
  checkmarkOutline, refreshOutline, filmOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-movies',
  templateUrl: './movies.page.html',
  styleUrls: ['./movies.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonIcon,
    IonSpinner, IonModal, IonToast, IonLoading
  ]
})
export class MoviesPage implements OnInit {
  movies: Movie[] = [];
  filteredMovies: Movie[] = [];
  searchQuery = '';
  selectedCategory = 'All';
  categories: string[] = [
    'All', 'Action', 'Comedy', 'Drama', 'Sci-Fi', 'Animation', 'Thriller', 'Romance'
  ];

  currentUser: UserProfile | null = null;
  isAdmin = false;
  isLoading = true;

  //Add movie
  isAddModalOpen = false;
  modalTab: 'tmdb' | 'manual' = 'tmdb';
  modalSearchQuery = '';
  modalSearchResults: Movie[] = [];
  isModalSearching = false;

  // manual add 
  title = '';
  year: number | string | null = null;
  genre = '';
  overview = '';
  posterUrl = '';
  rating: number | null = null;

  // edit movie
  isEditModalOpen = false;
  selectedMovieForEdit: Movie | null = null;
  editTitle = '';
  editYear: number | string | null = null;
  editGenre = '';
  editOverview = '';
  editPosterUrl = '';
  editRating: number | null = null;

  // delete movie
  isDeleteModalOpen = false;
  movieToDelete: Movie | null = null;

  loadingMessage = 'Processing...';
  isActionLoading = false;
  toastMessage = '';
  isToastOpen = false;

  constructor(
    private movieService: MovieService,
    private userService: UserService,
    private authService: AuthService,
    private tmdbService: TmdbService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      heart, heartOutline, star, searchOutline,
      add, addCircle, addCircleOutline, trashOutline, trash,
      createOutline, create, sparklesOutline, cloudDownloadOutline,
      closeOutline, chevronForwardOutline, checkmarkCircleOutline,
      checkmarkOutline, refreshOutline, filmOutline
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = user?.role === 'admin';
      this.cdr.detectChanges();
    });

    this.movieService.getAllMovies().subscribe(movies => {
      this.movies = movies;
      this.isLoading = false;
      this.filterMovies();
      this.cdr.detectChanges();
    });

    //delete duplicates
    this.movieService.removeFirestoreDuplicates().then(count => {
      if (count > 0) {
        console.log(`[Auto-Clean] ${count} duplicate movies cleaned.`);
      }
    });
  }

  get greeting(): string {
    const hour = new Date().getHours();
    const salutation = hour >= 18 || hour < 5 ? 'GOOD EVENING' : hour >= 12 ? 'GOOD AFTERNOON' : 'GOOD MORNING';
    const name = this.currentUser?.prenom ? `, ${this.currentUser.prenom.toUpperCase()}` : '';
    return `${salutation}${name}`;
  }

  get userInitials(): string {
    if (this.currentUser?.prenom && this.currentUser?.nom) {
      return (this.currentUser.prenom[0] + this.currentUser.nom[0]).toUpperCase();
    }
    if (this.currentUser?.prenom) {
      return this.currentUser.prenom.substring(0, 2).toUpperCase();
    }
    return this.isAdmin ? 'AD' : 'CM';
  }

  selectCategory(category: string) {
    if (this.selectedCategory === category && category !== 'All') {
      this.selectedCategory = 'All';
    } else {
      this.selectedCategory = category;
    }
    this.filterMovies();
  }

  filterMovies() {
    let list = this.movies;

    if (this.selectedCategory !== 'All') {
      const cat = this.selectedCategory.toLowerCase();
      list = list.filter(m => {
        const g = (m.genre || '').toLowerCase();
        if (cat === 'comedy') return g.includes('comedy') || g.includes('comédie');
        if (cat === 'drama') return g.includes('drama') || g.includes('drame');
        if (cat === 'sci-fi') return g.includes('sci') || g.includes('science');
        return g.includes(cat);
      });
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

  // user Favorites
  isFavorite(movieId: string): boolean {
    return this.currentUser?.favorites?.includes(movieId) || false;
  }

  async toggleFavorite(movie: Movie, event: Event) {
    event.stopPropagation();
    if (!this.currentUser) return;

    if (this.isFavorite(movie.id)) {
      this.currentUser.favorites = (this.currentUser.favorites || []).filter(id => id !== movie.id);
      this.cdr.detectChanges();
      await this.userService.removeFavorite(this.currentUser.uid, movie.id);
    } else {
      this.currentUser.favorites = [...(this.currentUser.favorites || []), movie.id];
      this.cdr.detectChanges();
      await this.userService.addFavorite(this.currentUser.uid, movie.id);
    }
  }

  // Admin add
  openAddModal() {
    this.isAddModalOpen = true;
    this.modalSearchQuery = '';
    this.modalSearchResults = [];
    this.isModalSearching = true;
    this.cdr.detectChanges();

    this.tmdbService.getPopularMovies().subscribe(results => {
      this.modalSearchResults = results || [];
      this.isModalSearching = false;
      this.cdr.detectChanges();
    });
  }

  closeAddModal() {
    this.isAddModalOpen = false;
    this.cdr.detectChanges();
  }

  setModalTab(tab: 'tmdb' | 'manual') {
    this.modalTab = tab;
    this.cdr.detectChanges();
  }

  onModalSearch() {
    if (!this.modalSearchQuery.trim()) {
      this.isModalSearching = true;
      this.tmdbService.getPopularMovies().subscribe(results => {
        this.modalSearchResults = results || [];
        this.isModalSearching = false;
        this.cdr.detectChanges();
      });
      return;
    }
    this.isModalSearching = true;
    this.tmdbService.searchMovies(this.modalSearchQuery).subscribe({
      next: (results) => {
        this.modalSearchResults = results || [];
        this.isModalSearching = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isModalSearching = false;
        this.cdr.detectChanges();
      }
    });
  }

  isAlreadyImported(title: string): boolean {
    const norm = (title || '').trim().toLowerCase();
    return this.movies.some(m => (m.title || '').trim().toLowerCase() === norm);
  }

  async onImportSingleMovie(movie: Movie) {
    this.isActionLoading = true;
    this.loadingMessage = `Importing "${movie.title}"...`;
    this.cdr.detectChanges();

    try {
      await this.movieService.addMovie({
        title: movie.title,
        year: movie.year,
        genre: movie.genre,
        overview: movie.overview,
        posterUrl: movie.posterUrl,
        rating: movie.rating
      });
      this.isActionLoading = false;
      this.showToast(` "${movie.title}" imported successfully!`);
    } catch (err: any) {
      this.isActionLoading = false;
      this.showToast('Error importing movie.');
    }
    this.cdr.detectChanges();
  }

  async onImportAllPreset() {
    this.isActionLoading = true;
    this.loadingMessage = 'Importing movies from TMDB API...';
    this.cdr.detectChanges();

    this.tmdbService.getPopularMovies().subscribe(async (popularMovies) => {
      try {
        if (popularMovies && popularMovies.length > 0) {
          const count = await this.movieService.importMultipleMovies(popularMovies);
          this.isActionLoading = false;
          this.isAddModalOpen = false;
          this.showToast(` ${count} movies imported from TMDB API!`);
        } else {
          this.isActionLoading = false;
          this.showToast('No movies retrieved from TMDB.');
        }
      } catch (err: any) {
        this.isActionLoading = false;
        this.showToast('Error during batch import.');
      }
      this.cdr.detectChanges();
    });
  }

  async onAddManualMovie() {
    if (!this.title.trim() || !this.year || !this.genre.trim() || !this.overview.trim() || !this.posterUrl.trim() || this.rating === null) {
      this.showToast('Please fill in all movie fields.');
      return;
    }

    this.isActionLoading = true;
    this.loadingMessage = 'Saving movie...';
    this.cdr.detectChanges();

    try {
      await this.movieService.addMovie({
        title: this.title.trim(),
        year: this.year,
        genre: this.genre.trim(),
        overview: this.overview.trim(),
        posterUrl: this.posterUrl.trim(),
        rating: Number(this.rating)
      });
      this.isActionLoading = false;
      this.showToast(' Movie created successfully!');
      this.resetForm();
      this.isAddModalOpen = false;
    } catch (err: any) {
      this.isActionLoading = false;
      this.showToast('Error creating movie.');
    }
    this.cdr.detectChanges();
  }

  resetForm() {
    this.title = '';
    this.year = null;
    this.genre = '';
    this.overview = '';
    this.posterUrl = '';
    this.rating = null;
  }

  // edit 
  openEditModal(movie: Movie, event: Event) {
    event.stopPropagation();
    this.selectedMovieForEdit = movie;
    this.editTitle = movie.title;
    this.editYear = movie.year;
    this.editGenre = movie.genre;
    this.editOverview = movie.overview || '';
    this.editPosterUrl = movie.posterUrl || '';
    this.editRating = movie.rating;
    this.isEditModalOpen = true;
    this.cdr.detectChanges();
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.selectedMovieForEdit = null;
    this.cdr.detectChanges();
  }

  async onSaveMovieEdit() {
    if (!this.selectedMovieForEdit) return;
    if (!this.editTitle.trim() || !this.editYear || !this.editGenre.trim()) {
      this.showToast('Please fill in required fields (Title, Year, Genre).');
      return;
    }

    this.isActionLoading = true;
    this.loadingMessage = 'Updating movie details...';
    this.cdr.detectChanges();

    try {
      await this.movieService.updateMovie(this.selectedMovieForEdit.id, {
        title: this.editTitle.trim(),
        year: Number(this.editYear),
        genre: this.editGenre.trim(),
        overview: this.editOverview.trim(),
        posterUrl: this.editPosterUrl.trim() || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80',
        rating: this.editRating !== null ? Number(this.editRating) : 7.0
      });
      this.isActionLoading = false;
      this.isEditModalOpen = false;
      this.showToast(` "${this.editTitle}" updated successfully!`);
    } catch (err: any) {
      this.isActionLoading = false;
      this.showToast('Error updating movie.');
    }
    this.cdr.detectChanges();
  }

  //delete
  openDeleteModal(movie: Movie, event: Event) {
    event.stopPropagation();
    this.movieToDelete = movie;
    this.isDeleteModalOpen = true;
    this.cdr.detectChanges();
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.movieToDelete = null;
    this.cdr.detectChanges();
  }

  async confirmDeleteMovie() {
    if (!this.movieToDelete) return;
    const movie = this.movieToDelete;
    this.isDeleteModalOpen = false;
    this.isActionLoading = true;
    this.loadingMessage = `Deleting "${movie.title}"...`;
    this.cdr.detectChanges();

    try {
      await this.movieService.deleteMovie(movie.id);
      this.isActionLoading = false;
      this.showToast(` "${movie.title}" removed from catalog.`);
    } catch (err: any) {
      this.isActionLoading = false;
      this.showToast('Error deleting movie.');
    } finally {
      this.movieToDelete = null;
      this.cdr.detectChanges();
    }
  }

  async cleanDuplicates() {
    this.isActionLoading = true;
    this.loadingMessage = 'Cleaning duplicates...';
    this.cdr.detectChanges();

    try {
      const deleted = await this.movieService.removeFirestoreDuplicates();
      if (deleted > 0) {
        this.showToast(` ${deleted} duplicate movie(s) removed!`);
      } else {
        this.showToast(' No duplicate movies detected.');
      }
    } catch (err: any) {
      this.showToast('Error cleaning duplicate movies.');
    } finally {
      this.isActionLoading = false;
      this.cdr.detectChanges();
    }
  }

  openDetail(movie: Movie) {
    this.router.navigate(['/movie-detail', movie.id]);
  }

  goToProfile() {
    this.router.navigate(['/tabs/profile']);
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }

  onPosterError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80';
  }

  onAvatarError() {
    if (this.currentUser) {
      this.currentUser = { ...this.currentUser, photo: '' };
      this.cdr.detectChanges();
    }
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
    this.cdr.detectChanges();
  }
}
