import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonIcon, IonToast, IonLoading
} from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { MovieService } from '../../../services/movie.service';
import { UserProfile } from '../../../models/user.model';
import { combineLatest } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  heart, cameraOutline, mailOutline, shieldCheckmarkOutline,
  logOutOutline, personOutline, filmOutline, peopleOutline,
  checkmarkCircleOutline, keyOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-profile',
  templateUrl: './admin-profile.page.html',
  styleUrls: ['./admin-profile.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonToast,
    IonLoading
  ]
})
export class AdminProfilePage implements OnInit {
  user: UserProfile | null = null;
  totalMoviesCount = 0;
  totalUsersCount = 0;
  activeUsersCount = 0;

  isLoading = false;
  toastMessage = '';
  isToastOpen = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private movieService: MovieService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      heart,
      cameraOutline,
      mailOutline,
      shieldCheckmarkOutline,
      logOutOutline,
      personOutline,
      filmOutline,
      peopleOutline,
      checkmarkCircleOutline,
      keyOutline
    });
  }

  ngOnInit() {
    combineLatest([
      this.authService.currentUser$,
      this.movieService.getAllMovies(),
      this.userService.getAllUsers()
    ]).subscribe(([user, movies, users]) => {
      this.user = user;
      this.totalMoviesCount = movies.length;
      const regularUsers = users.filter(u => (u.role as string)?.trim() !== 'admin');
      this.totalUsersCount = regularUsers.length;
      this.activeUsersCount = regularUsers.filter(u => u.active !== false).length;
      this.cdr.detectChanges();
    });
  }

  get adminInitials(): string {
    if (this.user?.prenom && this.user?.nom) {
      return (this.user.prenom[0] + this.user.nom[0]).toUpperCase();
    }
    return 'AD';
  }

  async updatePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt
      });

      if (image.base64String && this.user) {
        this.isLoading = true;
        const photoData = `data:image/${image.format};base64,${image.base64String}`;
        await this.userService.updateUserProfile(this.user.uid, { photo: photoData });
        this.showToast('Photo de profil mise à jour !');
      }
    } catch (err: any) {
      if (err?.message !== 'User cancelled photos app') {
        console.warn('Camera cancel or error:', err);
      }
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async onLogout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
    this.cdr.detectChanges();
  }
}
