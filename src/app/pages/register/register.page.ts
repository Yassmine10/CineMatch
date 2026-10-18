import { Component, ChangeDetectorRef, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonToast, IonLoading, IonIcon } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import {
  cameraOutline, camera, images, chevronBackOutline, mailOutline,
  lockClosedOutline, chevronForwardOutline, personOutline,
  eyeOutline, eyeOffOutline, closeOutline, videocamOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonToast, IonLoading, IonIcon]
})
export class RegisterPage implements OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  nom = '';
  prenom = '';
  age: number | null = null;
  email = '';
  password = '';
  photoBase64 = '';
  showPassword = false;

  isPhotoPickerOpen = false;
  isCameraActive = false;
  mediaStream: MediaStream | null = null;

  isLoading = false;
  toastMessage = '';
  isToastOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      cameraOutline, camera, images, chevronBackOutline, mailOutline,
      lockClosedOutline, chevronForwardOutline, personOutline,
      eyeOutline, eyeOffOutline, closeOutline, videocamOutline
    });
  }

  ngOnDestroy() {
    this.closeLiveCamera();
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  goBack() {
    this.router.navigate(['/login']);
  }

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

  // Real-Time Live Camera stream (Web & Mobile)
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
          this.photoBase64 = `data:image/jpeg;base64,${image.base64String}`;
          this.cdr.detectChanges();
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
      this.photoBase64 = base64Url;
      this.cdr.detectChanges();
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

  onFileSelected(event: any) {
    const file = event?.target?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showToast('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.photoBase64 = reader.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  async onRegister() {
    const cleanEmail = this.email.trim();
    const cleanNom = this.nom.trim();
    const cleanPrenom = this.prenom.trim();
    const ageVal = this.age ? Number(this.age) : 25;

    if (!cleanNom || !cleanPrenom || !cleanEmail || !this.password) {
      this.showToast('Please fill in all required fields.');
      return;
    }

    if (this.password.length < 6) {
      this.showToast('Password must be at least 6 characters long.');
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      await this.authService.register(cleanEmail, this.password, {
        nom: cleanNom,
        prenom: cleanPrenom,
        age: ageVal,
        photo: this.photoBase64
      });
      this.isLoading = false;
      this.cdr.detectChanges();

      this.showToast('Account created successfully! Welcome to CinéMatch.');
      this.router.navigate(['/tabs/movies']);
    } catch (err: any) {
      this.isLoading = false;
      this.cdr.detectChanges();
      this.showToast(err.message || 'Registration failed. Please check the entered information.');
    }
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
    this.cdr.detectChanges();
  }
}
