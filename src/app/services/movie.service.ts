import { Injectable, inject } from '@angular/core';
import { getFirestore, collection, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Observable, combineLatest, map, switchMap, of, startWith, from } from 'rxjs';
import { Movie } from '../models/movie.model';
import { TmdbService } from './tmdb.service';

@Injectable({
  providedIn: 'root'
})
export class MovieService {
  private tmdbService = inject(TmdbService);

  getAdminMovies(): Observable<Movie[]> {
    return new Observable<Movie[]>(subscriber => {
      const auth = getAuth();
      const db = getFirestore();

      let firestoreUnsub: (() => void) | null = null;

      const authUnsub = onAuthStateChanged(auth, (user) => {
        if (firestoreUnsub) {
          firestoreUnsub();
          firestoreUnsub = null;
        }

        if (user) {
          const moviesRef = collection(db, 'movies');
          firestoreUnsub = onSnapshot(
            moviesRef,
            snapshot => {
              const movies: Movie[] = [];
              snapshot.forEach(docSnap => {
                const data = docSnap.data() as Movie;
                movies.push({ ...data, id: data.id || docSnap.id });
              });
              subscriber.next(movies);
            },
            err => {
              console.warn('Firestore movies non accessible:', err.message);
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

  getAllMovies(): Observable<Movie[]> {
    return combineLatest([this.getAdminMovies(), this.tmdbService.getPopularMovies()]).pipe(
      map(([adminMovies, tmdbMovies]) => {
        const combined: Movie[] = [];
        const seenTitles = new Set<string>();

        for (const movie of adminMovies) {
          const normalizedTitle = (movie.title || '').trim().toLowerCase();
          if (normalizedTitle && !seenTitles.has(normalizedTitle)) {
            seenTitles.add(normalizedTitle);
            combined.push(movie);
          }
        }
        for (const movie of tmdbMovies) {
          const normalizedTitle = (movie.title || '').trim().toLowerCase();
          if (normalizedTitle && !seenTitles.has(normalizedTitle)) {
            seenTitles.add(normalizedTitle);
            combined.push(movie);
          }
        }

        return combined;
      })
    );
  }

  getMovieById(id: string): Observable<Movie | undefined> {
    if (id.startsWith('tmdb_')) {
      return this.getAllMovies().pipe(
        map(movies => movies.find(m => m.id === id))
      );
    }

    return new Observable<Movie | undefined>(subscriber => {
      const db = getFirestore();
      const movieRef = doc(db, 'movies', id);
      getDoc(movieRef).then(snap => {
        if (snap.exists()) {
          subscriber.next({ id: snap.id, ...snap.data() } as Movie);
        } else {
          subscriber.next(undefined);
        }
        subscriber.complete();
      }).catch(() => {
        subscriber.next(undefined);
        subscriber.complete();
      });
    });
  }

  async addMovie(movie: Omit<Movie, 'id' | 'source'>): Promise<void> {
    const db = getFirestore();
    const newId = 'custom_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6);
    const movieRef = doc(db, 'movies', newId);
    const newMovie: Movie = {
      ...movie,
      id: newId,
      source: 'admin'
    };
    return setDoc(movieRef, newMovie);
  }

  async importMultipleMovies(movies: (Omit<Movie, 'id' | 'source'> & { id?: string })[]): Promise<number> {
    const db = getFirestore();
    const { getDocs } = await import('firebase/firestore');
    const existingSnap = await getDocs(collection(db, 'movies'));
    const existingTitles = new Set(
      existingSnap.docs.map(d => ((d.data() as Movie).title || '').trim().toLowerCase())
    );

    let imported = 0;
    for (const m of movies) {
      const titleNorm = (m.title || '').trim().toLowerCase();
      if (!titleNorm || existingTitles.has(titleNorm)) {
        continue; 
      }

      existingTitles.add(titleNorm);
      const newId = 'custom_' + Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6);
      const movieRef = doc(db, 'movies', newId);
      const newMovie: Movie = {
        title: m.title,
        year: m.year,
        genre: m.genre,
        overview: m.overview,
        posterUrl: m.posterUrl,
        rating: m.rating,
        id: newId,
        source: 'admin'
      };
      await setDoc(movieRef, newMovie);
      imported++;
    }
    return imported;
  }

  async removeFirestoreDuplicates(): Promise<number> {
    const db = getFirestore();
    const moviesRef = collection(db, 'movies');
    const { getDocs, deleteDoc } = await import('firebase/firestore');
    const snapshot = await getDocs(moviesRef);

    const seen = new Set<string>();
    let deletedCount = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as Movie;
      const title = (data.title || '').trim().toLowerCase();
      if (!title || seen.has(title)) {
        await deleteDoc(docSnap.ref);
        deletedCount++;
      } else {
        seen.add(title);
      }
    }
    return deletedCount;
  }

  async updateMovie(id: string, movie: Partial<Movie>): Promise<void> {
    const db = getFirestore();
    const movieRef = doc(db, 'movies', id);
    const { updateDoc } = await import('firebase/firestore');
    return updateDoc(movieRef, movie as any);
  }

  async deleteMovie(id: string): Promise<void> {
    const db = getFirestore();
    const movieRef = doc(db, 'movies', id);
    const { deleteDoc } = await import('firebase/firestore');
    return deleteDoc(movieRef);
  }
}
