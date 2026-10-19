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
    addIcons({
      mailOutline, sendOutline, arrowBackOutline,
      checkmarkCircleOutline, alertCircleOutline
    });
  }

  async onResetPassword() {
    const cleanEmail = (this.email || '').trim();
    if (!cleanEmail) {
      this.showToast('Please enter your account email.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      this.showToast('Please enter a valid email address.');
      return;
    }

    this.isLoading = true;
    this.toastVisible = false;
    this.cdr.detectChanges();

    try {
      await this.authService.resetPassword(cleanEmail);
      this.isEmailSent = true;
    } catch (err: any) {
      this.showToast(err.message || 'Error sending password reset email.');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.toastVisible = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.toastVisible = false;
      this.cdr.detectChanges();
    }, 4000);
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}
