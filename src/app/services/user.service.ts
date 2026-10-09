import { Injectable } from '@angular/core';
import { getFirestore, collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Observable, startWith } from 'rxjs';
import { UserProfile } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  getAllUsers(): Observable<UserProfile[]> {
    return new Observable<UserProfile[]>(subscriber => {
      const auth = getAuth();
      const db = getFirestore();

      let firestoreUnsub: (() => void) | null = null;

      const authUnsub = onAuthStateChanged(auth, (user) => {
        if (firestoreUnsub) {
          firestoreUnsub();
          firestoreUnsub = null;
        }

        if (user) {
          const usersRef = collection(db, 'users');
          firestoreUnsub = onSnapshot(
            usersRef,
            snapshot => {
              const users: UserProfile[] = [];
              snapshot.forEach(docSnap => {
                const data = docSnap.data() as UserProfile;
                users.push({
                  ...data,
                  uid: data.uid || docSnap.id,
                  favorites: data.favorites || [],
                  role: (data.role as string)?.trim() as 'admin' | 'user'
                });
              });
              subscriber.next(users);
            },
            err => {
              console.warn('Firestore users non accessible:', err.message);
              subscriber.next([]);
            }
          );
        } else {
          subscriber.next([]);
        }
      });

      return () => {
        authUnsub();
        if (firestoreUnsub) firestoreUnsub();
      };
    }).pipe(
      startWith([])
    );
  }

  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);
    return updateDoc(userRef, data as any);
  }

  async toggleUserActive(uid: string, active: boolean): Promise<void> {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);
    return updateDoc(userRef, { active });
  }

  async addFavorite(uid: string, movieId: string): Promise<void> {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);
    return updateDoc(userRef, {
      favorites: arrayUnion(movieId)
    });
  }

  async removeFavorite(uid: string, movieId: string): Promise<void> {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);
    return updateDoc(userRef, {
      favorites: arrayRemove(movieId)
    });
  }
}
