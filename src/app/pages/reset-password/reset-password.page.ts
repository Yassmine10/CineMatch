import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { getAuth, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { addIcons } from 'ionicons';
import {
  lockClosedOutline, eyeOutline, eyeOffOutline,
  checkmarkCircleOutline, alertCircleOutline,
  arrowBackOutline, keyOutline, checkmarkOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon]
})
export class ResetPasswordPage implements OnInit {
  oobCode: string | null = null;
  accountEmail: string | null = null;

  newPassword = '';
  confirmPassword = '';
  showNewPassword = false;
  showConfirmPassword = false;

  isVerifyingCode = true;
  isCodeValid = false;
  isSuccess = false;
  isLoading = false;

  toastMessage = '';
  toastVisible = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      lockClosedOutline, eyeOutline, eyeOffOutline,
      checkmarkCircleOutline, alertCircleOutline,
      arrowBackOutline, keyOutline, checkmarkOutline
    });
  }

  async ngOnInit() {
    // Extract oobCode from query parameters
    const urlParams = new URLSearchParams(window.location.search);
    this.oobCode = this.route.snapshot.queryParamMap.get('oobCode') ||
                   urlParams.get('oobCode');

    if (!this.oobCode) {
      this.isVerifyingCode = false;
      this.isCodeValid = false;
      this.cdr.detectChanges();
      return;
    }

    try {
      const auth = getAuth();
      const email = await verifyPasswordResetCode(auth, this.oobCode);
      this.accountEmail = email;
      this.isCodeValid = true;
    } catch (err: any) {
      console.warn('Invalid or expired password reset code:', err);
      this.isCodeValid = false;
    } finally {
      this.isVerifyingCode = false;
      this.cdr.detectChanges();
    }
  }

  async onConfirmNewPassword() {
    if (!this.newPassword) {
      this.showToast('Please enter your new password.');
      return;
    }

    if (this.newPassword.length < 6) {
      this.showToast('Password must be at least 6 characters.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.showToast('Passwords do not match. Please verify your entry.');
      return;
    }

    if (!this.oobCode) {
      this.showToast('Missing reset authorization code.');
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const auth = getAuth();
      await confirmPasswordReset(auth, this.oobCode, this.newPassword);
      this.isSuccess = true;
    } catch (err: any) {
      console.error('Password reset confirmation error:', err);
      this.showToast(err.message || 'Error updating password. The reset link may have expired.');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
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
}
