import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonToast, IonLoading, IonIcon } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import {
  cameraOutline, chevronBackOutline, mailOutline,
  lockClosedOutline, chevronForwardOutline, personOutline,
  eyeOutline, eyeOffOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonToast, IonLoading, IonIcon]
})
export class RegisterPage {
  nom = '';
  prenom = '';
  age: number | null = null;
  email = '';
  password = '';
  photoBase64 = '';
  showPassword = false;

  isLoading = false;
  toastMessage = '';
  isToastOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      cameraOutline, chevronBackOutline, mailOutline,
      lockClosedOutline, chevronForwardOutline, personOutline,
      eyeOutline, eyeOffOutline
    });
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  goBack() {
    this.router.navigate(['/login']);
  }

  async takePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 50,
        width: 400,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt
      });
      if (image.base64String) {
        this.photoBase64 = `data:image/jpeg;base64,${image.base64String}`;
        this.cdr.detectChanges();
      }
    } catch (err) {
      console.log('Capture photo annulée ou non supportée sur navigateur', err);
    }
  }

  async onRegister() {
    if (!this.nom.trim() || !this.prenom.trim() || !this.age || !this.email.trim() || !this.password) {
      this.showToast('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (this.age <= 0) {
      this.showToast('L\'âge doit être supérieur à 0.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email.trim())) {
      this.showToast('Veuillez saisir une adresse email valide.');
      return;
    }

    if (this.password.length < 6) {
      this.showToast('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();
    try {
      await this.authService.register(this.email.trim(), this.password, {
        nom: this.nom.trim(),
        prenom: this.prenom.trim(),
        age: Number(this.age),
        photo: this.photoBase64 || 'https://ionicframework.com/docs/img/demos/avatar.ionic.png'
      });
      this.isLoading = false;
      this.showToast('🎉 Compte créé avec succès ! Bienvenue sur CinéMatch.');
      this.cdr.detectChanges();
      setTimeout(() => {
        this.router.navigate(['/tabs/movies']);
      }, 1000);
    } catch (err: any) {
      this.isLoading = false;
      this.cdr.detectChanges();
      this.showToast(err.message || 'Erreur lors de l\'inscription.');
    }
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
    this.cdr.detectChanges();
  }
}
