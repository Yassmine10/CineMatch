import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent, IonToast, IonLoading, IonIcon
} from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import {
  mailOutline, lockClosedOutline, chevronForwardOutline,
  heart, eyeOutline, eyeOffOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent, IonToast, IonLoading, IonIcon]
})
export class LoginPage {
  email = '';
  password = '';
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
      mailOutline, lockClosedOutline, chevronForwardOutline,
      heart, eyeOutline, eyeOffOutline
    });
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  async onLogin() {
    const cleanEmail = (this.email || '').trim();
    const cleanPassword = (this.password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      this.showToast('Please fill in both email and password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      this.showToast('Please enter a valid email address.');
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();
    try {
      const profile = await this.authService.login(cleanEmail, cleanPassword);
      this.isLoading = false;
      this.cdr.detectChanges();
      
      const role = (profile.role as string)?.trim();
      if (role === 'admin') {
        this.router.navigate(['/tabs/dashboard']);
      } else {
        this.router.navigate(['/tabs/movies']);
      }
    } catch (err: any) {
      this.isLoading = false;
      this.cdr.detectChanges();
      this.showToast(err.message || 'Login failed. Please check your credentials.');
    }
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
    this.cdr.detectChanges();
  }
}
