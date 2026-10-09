import { Injectable } from '@angular/core';
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, sendPasswordResetEmail, User
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, DocumentSnapshot } from 'firebase/firestore';
import { Observable, BehaviorSubject } from 'rxjs';
import { UserProfile } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  currentUser$: Observable<UserProfile | null> = this.currentUserSubject.asObservable();

  constructor() {
    const auth = getAuth();
    const db = getFirestore();

    onAuthStateChanged(auth, (authUser: User | null) => {
      if (authUser) {
        const userDocRef = doc(db, 'users', authUser.uid);
        onSnapshot(userDocRef, (snap: DocumentSnapshot) => {
          if (snap.exists()) {
            const raw = snap.data() as UserProfile;
            const profile: UserProfile = {
              ...raw,
              uid: raw.uid || authUser.uid,
              favorites: raw.favorites || [],
              role: (raw.role as string)?.trim() as 'admin' | 'user'
            };
            this.currentUserSubject.next(profile);
          } else {
            this.currentUserSubject.next(null);
          }
        }, () => {
          this.currentUserSubject.next(null);
        });
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  get currentUserId(): string | null {
    const auth = getAuth();
    return auth.currentUser?.uid || null;
  }

  async register(email: string, pass: string, profileData: Omit<UserProfile, 'uid' | 'email' | 'role' | 'active' | 'favorites' | 'createdAt'>): Promise<void> {
    const auth = getAuth();
    const db = getFirestore();

    const creds = await createUserWithEmailAndPassword(auth, email, pass);
    const newUser: UserProfile = {
      uid: creds.user.uid,
      email,
      ...profileData,
      role: 'user',
      active: true,
      favorites: [],
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', creds.user.uid), newUser);
    this.currentUserSubject.next(newUser);
  }

  async login(email: string, pass: string): Promise<UserProfile> {
    const auth = getAuth();
    const db = getFirestore();

    try {
      const creds = await signInWithEmailAndPassword(auth, email, pass);
      const userDocRef = doc(db, 'users', creds.user.uid);

      const snap = await getDoc(userDocRef);

      let profile: UserProfile;

      if (!snap.exists()) {
        // Profil Firestore absent → le créer automatiquement (compte créé via console Firebase)
        profile = {
          uid: creds.user.uid,
          email: creds.user.email || email,
          nom: email.split('@')[0],
          prenom: '',
          age: 0,
          photo: 'https://ionicframework.com/docs/img/demos/avatar.ionic.png',
          role: 'user',
          active: true,
          favorites: [],
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, profile);
      } else {
        const raw = snap.data() as UserProfile;
        // Nettoyer les espaces éventuels sur le rôle
        profile = { ...raw, role: (raw.role as string)?.trim() as 'admin' | 'user' };
      }

      if (profile.active === false) {
        await signOut(auth);
        throw new Error("Votre compte a été désactivé par l'administrateur.");
      }

      this.currentUserSubject.next(profile);
      return profile;
    } catch (err: any) {
      console.error('[AuthService] Login error code:', err.code, '| message:', err.message);
      const authErrors = [
        'auth/invalid-credential',
        'auth/user-not-found',
        'auth/wrong-password',
        'auth/invalid-email',
        'auth/INVALID_LOGIN_CREDENTIALS',
        'auth/invalid-login-credentials'
      ];
      if (authErrors.includes(err.code) || err.status === 400) {
        throw new Error('Email ou mot de passe incorrect.');
      }
      throw err;
    }
  }

  async resetPassword(email: string): Promise<void> {
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        throw new Error('Aucun compte n\'est associé à cet email.');
      } else if (err.code === 'auth/invalid-email') {
        throw new Error('Adresse email invalide.');
      }
      throw new Error(err.message || 'Erreur lors de l\'envoi de l\'email de réinitialisation.');
    }
  }

  async logout(): Promise<void> {
    const auth = getAuth();
    await signOut(auth);
    this.currentUserSubject.next(null);
  }
}
