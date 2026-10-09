import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import {
  mailOutline, sendOutline, arrowBackOutline,
  checkmarkCircleOutline, alertCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon]
})
export class ForgotPasswordPage {
  email = '';
  isLoading = false;
  isEmailSent = false;
  toastMessage = '';
  toastVisible = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({ mailOutline, sendOutline, arrowBackOutline, checkmarkCircleOutline, alertCircleOutline });
  }

  async onResetPassword() {
    if (!this.email.trim()) {
      this.showToast('Veuillez renseigner votre adresse email.');
      return;
    }

    this.isLoading = true;
    this.toastVisible = false;
    this.cdr.detectChanges();

    try {
      await this.authService.resetPassword(this.email.trim());
      this.isEmailSent = true;
    } catch (err: any) {
      this.showToast(err.message || 'Erreur lors de la réinitialisation.');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.toastVisible = true;
    this.cdr.detectChanges();
    // Auto-masquage après 4 s
    setTimeout(() => {
      this.toastVisible = false;
      this.cdr.detectChanges();
    }, 4000);
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}
