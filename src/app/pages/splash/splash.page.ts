import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronForwardOutline, heart } from 'ionicons/icons';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon]
})
export class SplashPage {
  constructor(private router: Router) {
    addIcons({ chevronForwardOutline, heart });
  }

  onGetStarted() {
    localStorage.setItem('cinematch_has_seen_splash', 'true');
    this.router.navigate(['/login']);
  }
}
