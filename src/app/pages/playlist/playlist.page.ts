import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonIcon, IonItemSliding, IonItemOptions,
  IonItemOption, IonSpinner
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
    CommonModule, IonContent, IonIcon, IonItemSliding,
    IonItemOptions, IonItemOption, IonSpinner
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

  loadFavorites(favIds: string[]) {
    this.isLoading = true;
    this.movieService.getAllMovies().subscribe(allMovies => {
      this.favoriteMovies = allMovies.filter(m => favIds.includes(m.id));
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  async removeFavorite(movieId: string, event?: Event, slidingItem?: IonItemSliding) {
    if (event) event.stopPropagation();
    if (!this.currentUser) return;
    if (slidingItem) await slidingItem.close();
    await this.userService.removeFavorite(this.currentUser.uid, movieId);
    this.favoriteMovies = this.favoriteMovies.filter(m => m.id !== movieId);
    this.cdr.detectChanges();
  }

  openDetail(movie: Movie) {
    this.router.navigate(['/movie-detail', movie.id]);
  }

  goToMovies() {
    this.router.navigate(['/tabs/movies']);
  }
}
