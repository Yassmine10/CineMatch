import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { UserProfile } from '../../models/user.model';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  homeOutline, heartOutline, peopleOutline, personOutline,
  filmOutline, gridOutline, sparklesOutline, shieldCheckmarkOutline, heart
} from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [CommonModule, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel]
})
export class TabsPage implements OnInit, OnDestroy {
  currentUser: UserProfile | null = null;
  isAdmin = false;
  private sub!: Subscription;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      homeOutline, heartOutline, peopleOutline, personOutline,
      filmOutline, gridOutline, sparklesOutline, shieldCheckmarkOutline, heart
    });
  }

  ngOnInit() {
    this.sub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = user?.role === 'admin';
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
