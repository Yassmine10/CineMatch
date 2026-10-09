import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { gridOutline, filmOutline, peopleOutline, personOutline } from 'ionicons/icons';

@Component({
  selector: 'app-admin-tabs',
  templateUrl: './admin-tabs.page.html',
  styleUrls: ['./admin-tabs.page.scss'],
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel]
})
export class AdminTabsPage {
  constructor() {
    addIcons({ gridOutline, filmOutline, peopleOutline, personOutline });
  }
}
