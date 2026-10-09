import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonToggle, IonIcon, IonToast, IonSpinner
} from '@ionic/angular';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { UserProfile } from '../../../models/user.model';
import { combineLatest } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  heart, searchOutline, logOutOutline, personOutline,
  checkmarkCircleOutline, closeCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.page.html',
  styleUrls: ['./admin-users.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonToggle,
    IonIcon,
    IonToast,
    IonSpinner
  ]
})
export class AdminUsersPage implements OnInit {
  currentUser: UserProfile | null = null;
  allUsers: UserProfile[] = [];
  filteredUsers: UserProfile[] = [];
  searchQuery = '';
  selectedFilter: 'all' | 'active' | 'inactive' = 'all';
  isLoading = true;

  toastMessage = '';
  isToastOpen = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      heart,
      searchOutline,
      logOutOutline,
      personOutline,
      checkmarkCircleOutline,
      closeCircleOutline
    });
  }

  ngOnInit() {
    combineLatest([
      this.authService.currentUser$,
      this.userService.getAllUsers()
    ]).subscribe(([user, users]) => {
      this.currentUser = user;
      // Exclure les comptes admin de la liste de modération
      this.allUsers = users.filter(u => (u.role as string)?.trim() !== 'admin');
      this.isLoading = false;
      this.applyFilter();
      this.cdr.detectChanges();
    });
  }

  get totalUsersCount(): number {
    return this.allUsers.length;
  }

  get activeUsersCount(): number {
    return this.allUsers.filter(u => u.active !== false).length;
  }

  get inactiveUsersCount(): number {
    return this.allUsers.filter(u => u.active === false).length;
  }

  get adminInitials(): string {
    if (this.currentUser?.prenom && this.currentUser?.nom) {
      return (this.currentUser.prenom[0] + this.currentUser.nom[0]).toUpperCase();
    }
    return 'AD';
  }

  setFilter(filter: 'all' | 'active' | 'inactive') {
    this.selectedFilter = filter;
    this.applyFilter();
  }

  onSearchChange() {
    this.applyFilter();
  }

  applyFilter() {
    const q = this.searchQuery.trim().toLowerCase();

    this.filteredUsers = this.allUsers.filter(u => {
      // 1. Filtrage statut (Actifs / Désactivés)
      const isActive = u.active !== false;
      if (this.selectedFilter === 'active' && !isActive) return false;
      if (this.selectedFilter === 'inactive' && isActive) return false;

      // 2. Filtrage recherche (Nom, Prénom, Email)
      if (q.length > 0) {
        const fullName = `${u.prenom || ''} ${u.nom || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        return fullName.includes(q) || email.includes(q);
      }

      return true;
    });
  }

  async onToggleActive(user: UserProfile, event: any) {
    const newStatus = event.detail.checked;
    // Mise à jour optimiste locale
    user.active = newStatus;
    try {
      await this.userService.toggleUserActive(user.uid, newStatus);
      this.showToast(`${user.prenom} ${user.nom} : compte ${newStatus ? 'activé' : 'désactivé'}`);
    } catch (err: any) {
      // Revert en cas d'erreur
      user.active = !newStatus;
      this.showToast('Erreur lors de la mise à jour du statut.');
    }
    this.applyFilter();
    this.cdr.detectChanges();
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }

  async onLogout() {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.isToastOpen = true;
    this.cdr.detectChanges();
  }
}
