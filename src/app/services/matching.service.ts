import { Injectable } from '@angular/core';
import { UserProfile } from '../models/user.model';
import { Movie } from '../models/movie.model';

export const MATCH_THRESHOLD = 75;
export interface MatchResult {
  user: UserProfile;
  percentage: number;
  commonMovieIds: string[];
  commonMovies: Movie[];
}

@Injectable({
  providedIn: 'root'
})
export class MatchingService {

  /**
   * @param a 
   * @param b 
   * @returns 
   */
  calculateSimilarity(a: any[], b: any[]): number {
    if (!a || !b || a.length === 0 || b.length === 0) {
      return 0;
    }

    const setA = new Set(a.filter(id => id != null).map(id => String(id).trim()));
    const setB = new Set(b.filter(id => id != null).map(id => String(id).trim()));

    if (setA.size === 0 || setB.size === 0) return 0;

    const intersection = new Set([...setA].filter(id => setB.has(id)));

    const union = new Set([...setA, ...setB]);

    if (union.size === 0) return 0;

    return (intersection.size / union.size) * 100;
  }
  getCommonMovies(a: any[], b: any[]): string[] {
    if (!a || !b || a.length === 0 || b.length === 0) return [];
    const setB = new Set(b.filter(id => id != null).map(id => String(id).trim()));
    return [...new Set(a.filter(id => id != null).map(id => String(id).trim()))].filter(id => setB.has(id));
  }

  private normalizeFavs(favIds: any[], movies: Movie[]): Set<string> {
    const canonical = new Set<string>();
    for (const rawId of new Set(favIds)) {
      if (rawId == null) continue;
      const idStr = String(rawId).trim();
      const rawNumeric = idStr.replace(/^tmdb_/, '');

      const movie = movies.find(m => {
        const mId = String(m.id).trim();
        const mNumeric = mId.replace(/^tmdb_/, '');
        return mId === idStr || (rawNumeric.length > 0 && mNumeric === rawNumeric);
      });

      if (movie && movie.title) {
        canonical.add(movie.title.trim().toLowerCase());
      } else {
        canonical.add(idStr.toLowerCase());
      }
    }
    return canonical;
  }

  /**
   *
   * @param currentUser 
   * @param allUsers    
   * @param movies      
   * @param threshold   
   * @returns 
   */
  findMatches(
    currentUser: UserProfile,
    allUsers: UserProfile[],
    movies: Movie[] = [],
    threshold: number = MATCH_THRESHOLD,
    excludeAdmins: boolean = true
  ): MatchResult[] {
    if (!currentUser || !currentUser.favorites || currentUser.favorites.length === 0) {
      return [];
    }

    const currentFavs = currentUser.favorites.filter(id => id != null);
    if (currentFavs.length === 0) return [];

    const results: MatchResult[] = [];

    for (const other of allUsers) {
      if (!other) continue;
      const otherRole = (other.role as string)?.trim();

      if (
        (other.uid && currentUser.uid && other.uid === currentUser.uid) ||
        (other.email && currentUser.email && other.email === currentUser.email)
      ) {
        continue;
      }
      if (other.active === false) {
        continue;
      }

      if (excludeAdmins && otherRole === 'admin') {
        continue;
      }

      const otherFavs = (other.favorites || []).filter(id => id != null);
      if (otherFavs.length === 0) continue;

      let percentage = this.calculateSimilarity(currentFavs, otherFavs);
      let commonMovieIds = this.getCommonMovies(currentFavs, otherFavs);
      if (movies && movies.length > 0) {
        const myCanonical = this.normalizeFavs(currentFavs, movies);
        const otherCanonical = this.normalizeFavs(otherFavs, movies);
        const intersection = new Set([...myCanonical].filter(k => otherCanonical.has(k)));
        const union = new Set([...myCanonical, ...otherCanonical]);

        if (union.size > 0) {
          const titlePercentage = (intersection.size / union.size) * 100;
          if (titlePercentage > percentage) {
            percentage = titlePercentage;
            commonMovieIds = [];
            for (const id of new Set(currentFavs)) {
              const idStr = String(id).trim();
              const movie = movies.find(m => String(m.id).trim() === idStr);
              const key = movie && movie.title ? movie.title.trim().toLowerCase() : idStr.toLowerCase();
              if (otherCanonical.has(key)) {
                commonMovieIds.push(idStr);
              }
            }
          }
        }
      }

      if (Math.round(percentage) < threshold) {
        continue;
      }
      const commonMovies: Movie[] = commonMovieIds.map(id => {
        const found = movies.find(m => String(m.id).trim() === String(id).trim());
        if (found) return found;
        return {
          id: String(id),
          title: `Film ${id}`,
          year: '',
          genre: 'CinéMatch',
          overview: '',
          posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&q=60',
          rating: 8.0,
          source: 'admin' as const
        };
      });

      results.push({
        user: other,
        percentage,
        commonMovieIds,
        commonMovies
      });
    }
    return results.sort((a, b) => b.percentage - a.percentage);
  }
}
