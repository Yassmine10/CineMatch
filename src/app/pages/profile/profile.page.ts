import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonIcon, IonToast, IonLoading
} from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { MatchingService } from '../../services/matching.service';
import { UserProfile } from '../../models/user.model';
import { doc, getFirestore, updateDoc } from 'firebase/firestore';
import { addIcons } from 'ionicons';
import {
  logOutOutline, cameraOutline, mailOutline,
  heart, personOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonToast, IonLoading]
})
export class ProfilePage implements OnInit {
  user: UserProfile | null = null;
  matchCount = 0;
  isLoading = false;
  toastMessage = '';
  isToastOpen = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private matchingService: MatchingService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      logOutOutline, cameraOutline, mailOutline,
      heart, personOutline
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(currentUser => {
      this.user = currentUser;
      if (currentUser) {
        this.userService.getAllUsers().subscribe(allUsers => {
          const matches = this.matchingService.findMatches(currentUser, allUsers, []);
          this.matchCount = matches.length;
          this.cdr.detectChanges();
        });
      }
      this.cdr.detectChanges();
    });
  }

  get memberSinceYear(): string {
    if (!this.user?.createdAt) return '2024';
    try {
      const date = new Date(this.user.createdAt);
      return isNaN(date.getFullYear()) ? '2024' : date.getFullYear().toString();
    } catch {
      return '2024';
    }
  }

  async updatePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 50,
        width: 400,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt
      });

      if (image.base64String && this.user) {
        this.isLoading = true;
        this.cdr.detectChanges();

        const base64Url = `data:image/jpeg;base64,${image.base64String}`;
        const db = getFirestore();
        const userRef = doc(db, 'users', this.user.uid);
        await updateDoc(userRef, { photo: base64Url });

        this.user = { ...this.user, photo: base64Url };
        this.isLoading = false;
        this.showToast('Photo de profil mise à jour !');
        this.cdr.detectChanges();
      }
    } catch (err) {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
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
