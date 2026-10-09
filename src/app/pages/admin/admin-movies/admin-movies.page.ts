import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonIcon, IonToast, IonLoading, IonSpinner, IonModal
} from '@ionic/angular';
import { MovieService } from '../../../services/movie.service';
import { TmdbService } from '../../../services/tmdb.service';
import { AuthService } from '../../../services/auth.service';
import { Movie } from '../../../models/movie.model';
import { UserProfile } from '../../../models/user.model';
import { addIcons } from 'ionicons';
import {
  add, addCircleOutline, chevronForwardOutline, filmOutline,
  searchOutline, star, trashOutline, cloudDownloadOutline,
  closeOutline, checkmarkCircleOutline, heart, sparklesOutline,
  createOutline, checkmarkOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-movies',
  templateUrl: './admin-movies.page.html',
  styleUrls: ['./admin-movies.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonIcon, IonToast, IonLoading,
    IonSpinner, IonModal
  ]
})
export class AdminMoviesPage implements OnInit {
  currentUser: UserProfile | null = null;
  adminMovies: Movie[] = [];
  filteredMovies: Movie[] = [];
  searchQuery = '';

  // Modal d'ajout / import avec onglets
  isAddModalOpen = false;
  modalTab: 'tmdb' | 'manual' = 'tmdb';

  // Recherche dans la modal TMDB
  modalSearchQuery = '';
  modalSearchResults: Movie[] = [];
  isModalSearching = false;
  presetCatalog: Movie[] = [];

  // Formulaire manuel
  title = '';
  year: number | null = null;
  genre = '';
  overview = '';
  posterUrl = '';
  rating: number | null = null;

  isLoading = false;
  loadingMessage = 'Traitement en cours...';
  toastMessage = '';
  isToastOpen = false;

  constructor(
    private movieService: MovieService,
    private tmdbService: TmdbService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      add, addCircleOutline, chevronForwardOutline, filmOutline,
      searchOutline, star, trashOutline, cloudDownloadOutline,
      closeOutline, checkmarkCircleOutline, heart, sparklesOutline,
      createOutline, checkmarkOutline
    });
  }

  ngOnInit() {
    this.presetCatalog = this.tmdbService.getPresetCatalog();
    this.modalSearchResults = this.presetCatalog;

    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.cdr.detectChanges();
    });

    this.movieService.getAllMovies().subscribe(movies => {
      this.adminMovies = movies;
      this.filterCatalogue();
      this.cdr.detectChanges();
    });

    // Nettoyage automatique silencieux des éventuels doublons existants
    this.movieService.removeFirestoreDuplicates().then(count => {
      if (count > 0) {
        console.log(`[Auto-Clean] ${count} doublon(s) de film nettoyé(s) dans Firestore.`);
      }
    });
  }

  get adminInitials(): string {
    if (this.currentUser?.prenom && this.currentUser?.nom) {
      return (this.currentUser.prenom[0] + this.currentUser.nom[0]).toUpperCase();
    }
    return 'AD';
  }

  async cleanDuplicates() {
    this.isLoading = true;
    this.loadingMessage = 'Nettoyage des doublons...';
    this.cdr.detectChanges();

    try {
      const deleted = await this.movieService.removeFirestoreDuplicates();
      if (deleted > 0) {
        this.showToast(`✨ ${deleted} film(s) en doublon supprimé(s) avec succès !`);
      } else {
        this.showToast('✅ Aucun film en doublon détecté dans la base.');
      }
    } catch (err: any) {
      this.showToast('Erreur lors du nettoyage des doublons.');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  filterCatalogue() {
    if (!this.searchQuery.trim()) {
      this.filteredMovies = this.adminMovies;
    } else {
      const q = this.searchQuery.toLowerCase().trim();
      this.filteredMovies = this.adminMovies.filter(m =>
        m.title.toLowerCase().includes(q) ||
        (m.genre && m.genre.toLowerCase().includes(q))
      );
    }
    this.cdr.detectChanges();
  }

  openAddModal() {
    this.isAddModalOpen = true;
    this.modalSearchQuery = '';
    this.modalSearchResults = this.presetCatalog;
    this.cdr.detectChanges();
  }

  closeAddModal() {
    this.isAddModalOpen = false;
    this.cdr.detectChanges();
  }

  onModalSearch() {
    if (!this.modalSearchQuery.trim()) {
      this.modalSearchResults = this.presetCatalog;
      return;
    }
    this.isModalSearching = true;
    this.tmdbService.searchMovies(this.modalSearchQuery).subscribe({
      next: (results) => {
        this.modalSearchResults = results;
        this.isModalSearching = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isModalSearching = false;
        this.cdr.detectChanges();
      }
    });
  }

  async onImportSingleMovie(movie: Movie) {
    this.isLoading = true;
    this.loadingMessage = `Import de "${movie.title}"...`;
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
      this.isLoading = false;
      this.showToast(`✅ "${movie.title}" importé dans le catalogue !`);
    } catch (err: any) {
      this.isLoading = false;
      this.showToast("Erreur lors de l'import du film.");
    }
    this.cdr.detectChanges();
  }

  async onImportAllPreset() {
    this.isLoading = true;
    this.loadingMessage = 'Import de tout le catalogue en cours...';
    this.cdr.detectChanges();

    try {
      const count = await this.movieService.importMultipleMovies(this.presetCatalog);
      this.isLoading = false;
      this.isAddModalOpen = false;
      this.showToast(`🎉 ${count} films cultes importés avec succès !`);
    } catch (err: any) {
      this.isLoading = false;
      this.showToast("Erreur lors de l'import groupé.");
    }
    this.cdr.detectChanges();
  }

  async onAddManualMovie() {
    if (!this.title.trim() || !this.year || !this.genre.trim() || !this.overview.trim() || !this.posterUrl.trim() || this.rating === null) {
      this.showToast('Veuillez remplir tous les champs du film.');
      return;
    }

    this.isLoading = true;
    this.loadingMessage = 'Enregistrement du film...';
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
      this.isLoading = false;
      this.showToast('✅ Film ajouté avec succès !');
      this.resetForm();
      this.isAddModalOpen = false;
    } catch (err: any) {
      this.isLoading = false;
      this.showToast("Erreur lors de l'ajout du film.");
    }
    this.cdr.detectChanges();
  }

  async onDeleteMovie(movie: Movie, event: Event) {
    event.stopPropagation();
    if (confirm(`Voulez-vous supprimer "${movie.title}" du catalogue ?`)) {
      try {
        await this.movieService.deleteMovie(movie.id);
        this.showToast(`Film "${movie.title}" supprimé.`);
      } catch (err: any) {
        this.showToast('Erreur lors de la suppression.');
      }
    }
  }

  setModalTab(tab: 'tmdb' | 'manual') {
    this.modalTab = tab;
    this.cdr.detectChanges();
  }

  onImgError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80';
  }

  openDetail(movie: Movie) {
    this.router.navigate(['/movie-detail', movie.id]);
  }

  isAlreadyImported(title: string): boolean {
    const norm = (title || '').trim().toLowerCase();
    return this.adminMovies.some(m => (m.title || '').trim().toLowerCase() === norm);
  }

  resetForm() {
    this.title = '';
    this.year = null;
    this.genre = '';
    this.overview = '';
    this.posterUrl = '';
    this.rating = null;
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }

  async onLogout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
    this.cdr.detectChanges();
  }
}
