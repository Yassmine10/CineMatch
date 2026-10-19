import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonIcon, IonToast, IonLoading
} from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { MovieService } from '../../services/movie.service';
import { MatchingService } from '../../services/matching.service';
import { UserProfile } from '../../models/user.model';
import { doc, getFirestore, updateDoc } from 'firebase/firestore';
import { getAuth, updatePassword } from 'firebase/auth';
import { addIcons } from 'ionicons';
import {
  logOutOutline, cameraOutline, camera, images, mailOutline,
  heart, personOutline, chevronForwardOutline, callOutline,
  lockClosedOutline, eyeOutline, eyeOffOutline, saveOutline,
  keyOutline, checkmarkCircleOutline, sparklesOutline,
  shieldCheckmarkOutline, closeOutline, refreshOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonToast, IonLoading]
})
export class ProfilePage implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('videoPlayer') videoPlayer?: ElementRef<HTMLVideoElement>;

  user: UserProfile | null = null;
  matchCount = 0;

  // Admin stats
  totalMoviesCount = 0;
  totalUsersCount = 0;
  activeUsersCount = 0;

  // Bottom Sheet Photo Picker
  isPhotoPickerOpen = false;

  // Real-Time Live Camera
  isCameraActive = false;
  mediaStream: MediaStream | null = null;

  isLoading = false;
  toastMessage = '';
  isToastOpen = false;

  // Personal details form
  editPrenom = '';
  editNom = '';
  editPhoneNumber = '';
  editAge = 18;
  isSavingProfile = false;

  // Password update form
  newPassword = '';
  confirmPassword = '';
  showNewPassword = false;
  showConfirmPassword = false;
  isUpdatingPassword = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private movieService: MovieService,
    private matchingService: MatchingService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      logOutOutline, cameraOutline, camera, images, mailOutline,
      heart, personOutline, chevronForwardOutline, callOutline,
      lockClosedOutline, eyeOutline, eyeOffOutline, saveOutline,
      keyOutline, checkmarkCircleOutline, sparklesOutline,
      shieldCheckmarkOutline, closeOutline, refreshOutline
    });
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(currentUser => {
      this.user = currentUser;
      if (currentUser) {
        this.editPrenom = currentUser.prenom || '';
        this.editNom = currentUser.nom || '';
        this.editPhoneNumber = currentUser.phoneNumber || '';
        this.editAge = currentUser.age || 18;

        if (currentUser.role === 'admin') {
          this.movieService.getAllMovies().subscribe(movies => {
            this.totalMoviesCount = movies.length;
            this.cdr.detectChanges();
          });
          this.userService.getAllUsers().subscribe(users => {
            const regularUsers = users.filter(u => (u.role as string)?.trim() !== 'admin');
            this.totalUsersCount = regularUsers.length;
            this.activeUsersCount = regularUsers.filter(u => u.active !== false).length;
            this.cdr.detectChanges();
          });
        } else {
          this.userService.getAllUsers().subscribe(allUsers => {
            const matches = this.matchingService.findMatches(currentUser, allUsers, []);
            this.matchCount = matches.length;
            this.cdr.detectChanges();
          });
        }
      }
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.closeLiveCamera();
  }

  get isAdmin(): boolean {
    return (this.user?.role as string)?.trim() === 'admin';
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

  async saveProfileDetails() {
    if (!this.user) return;

    if (!this.editPrenom.trim() || !this.editNom.trim()) {
      this.showToast('First and last name are required.');
      return;
    }

    if (!this.isAdmin && (this.editAge < 12 || this.editAge > 120)) {
      this.showToast('Please enter a valid age between 12 and 120.');
      return;
    }

    this.isSavingProfile = true;
    this.cdr.detectChanges();

    try {
      const updateData: Partial<UserProfile> = {
        prenom: this.editPrenom.trim(),
        nom: this.editNom.trim(),
        phoneNumber: this.editPhoneNumber.trim(),
        age: Number(this.editAge)
      };

      await this.userService.updateUserProfile(this.user.uid, updateData);

      this.user = {
        ...this.user,
        ...updateData
      };

      this.showToast('Profile information saved successfully!');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      this.showToast(err.message || 'Error updating profile.');
    } finally {
      this.isSavingProfile = false;
      this.cdr.detectChanges();
    }
  }

  async updateUserPassword() {
    if (!this.newPassword) {
      this.showToast('Please enter a new password.');
      return;
    }

    if (this.newPassword.length < 6) {
      this.showToast('Password must be at least 6 characters long.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.showToast('Passwords do not match.');
      return;
    }

    const auth = getAuth();
    if (!auth.currentUser) {
      this.showToast('You must be signed in to change your password.');
      return;
    }

    this.isUpdatingPassword = true;
    this.cdr.detectChanges();

    try {
      await updatePassword(auth.currentUser, this.newPassword);
      this.newPassword = '';
      this.confirmPassword = '';
      this.showToast('Password updated successfully!');
    } catch (err: any) {
      console.error('Error updating password:', err);
      if (err.code === 'auth/requires-recent-login') {
        this.showToast('Security check: please sign in again to update your password.');
      } else {
        this.showToast(err.message || 'Error updating password.');
      }
    } finally {
      this.isUpdatingPassword = false;
      this.cdr.detectChanges();
    }
  }

  async sendResetEmail() {
    if (!this.user?.email) return;

    try {
      this.isLoading = true;
      this.cdr.detectChanges();
      await this.authService.resetPassword(this.user.email);
      this.showToast(`Reset email sent to ${this.user.email}!`);
    } catch (err: any) {
      this.showToast(err.message || 'Error sending reset email.');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  // ─── PHOTO ACTIONS ──────────────────────────────────────────

  openPhotoPicker() {
    this.isPhotoPickerOpen = true;
    this.cdr.detectChanges();
  }

  closePhotoPicker() {
    this.isPhotoPickerOpen = false;
    this.cdr.detectChanges();
  }

  chooseFromGallery() {
    this.closePhotoPicker();
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.click();
    }
  }

  // Real-Time Live Webcam / Device Camera
  async startLiveCamera() {
    this.closePhotoPicker();

    // Check if running on native mobile device via Capacitor
    if ((window as any).Capacitor?.isNativePlatform()) {
      try {
        const image = await Camera.getPhoto({
          quality: 75,
          width: 600,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera
        });
        if (image?.base64String) {
          await this.savePhoto(`data:image/jpeg;base64,${image.base64String}`);
        }
        return;
      } catch (err) {
        console.warn('Native camera cancelled or error:', err);
        return;
      }
    }

    // Web / Desktop / Mobile Browser: Use live webcam media stream
    try {
      this.isCameraActive = true;
      this.cdr.detectChanges();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } }
      });
      this.mediaStream = stream;

      setTimeout(() => {
        if (this.videoPlayer?.nativeElement) {
          this.videoPlayer.nativeElement.srcObject = stream;
          this.videoPlayer.nativeElement.play();
        }
      }, 150);
    } catch (err: any) {
      console.error('Camera stream access error:', err);
      this.isCameraActive = false;
      this.showToast('Camera access denied or camera not available on this device.');
      this.cdr.detectChanges();
    }
  }

  captureSnapshot() {
    if (!this.videoPlayer?.nativeElement) return;
    const video = this.videoPlayer.nativeElement;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Url = canvas.toDataURL('image/jpeg', 0.85);
      this.closeLiveCamera();
      this.savePhoto(base64Url);
    }
  }

  closeLiveCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.isCameraActive = false;
    this.cdr.detectChanges();
  }

  async savePhoto(base64Url: string) {
    if (!this.user) return;
    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', this.user.uid);
      await updateDoc(userRef, { photo: base64Url });
      this.user = { ...this.user, photo: base64Url };
      this.showToast('Profile photo updated successfully!');
    } catch (e: any) {
      console.error('Error saving photo:', e);
      this.showToast('Error saving profile photo.');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async onFileSelected(event: any) {
    const file = event?.target?.files?.[0];
    if (!file || !this.user) return;

    if (!file.type.startsWith('image/')) {
      this.showToast('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Url = reader.result as string;
      await this.savePhoto(base64Url);
    };
    reader.readAsDataURL(file);
  }

  async onLogout() {
    this.closeLiveCamera();
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
    this.cdr.detectChanges();
  }
}
