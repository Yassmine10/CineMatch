import { Injectable } from '@angular/core';
import { UserProfile } from '../models/user.model';
import { Movie } from '../models/movie.model';

/**
 * Seuil de correspondance minimum (strictement supérieur).
 * Un taux de 75 % pile est EXCLU — seuls les taux > 75 % sont retenus.
 */
export const MATCH_THRESHOLD = 75;

/**
 * Résultat d'un matching entre l'utilisateur courant et un autre utilisateur.
 */
export interface MatchResult {
  user: UserProfile;
  /**
   * Taux Jaccard brut (non arrondi) pour la comparaison interne.
   * Utiliser Math.round(percentage) pour l'affichage.
   */
  percentage: number;
  commonMovieIds: string[];
  commonMovies: Movie[];
}

@Injectable({
  providedIn: 'root'
})
export class MatchingService {

  /**
   * Calcule le taux de similarité (indice de Jaccard) entre deux listes d'ids de films.
   *
   * Formule : taux = |A ∩ B| / |A ∪ B| × 100
   *
   * Exemple chiffré :
   *   A = ['m1','m2','m3','m4','m5']   (5 films)
   *   B = ['m1','m2','m3','m4','m6']   (5 films)
   *   A ∩ B = {m1,m2,m3,m4}  → taille = 4
   *   A ∪ B = {m1,m2,m3,m4,m5,m6} → taille = 6
   *   taux = 4/6 × 100 ≈ 66.67 %
   *
   * @param a Liste d'ids de films de l'utilisateur A (dédoublonnée)
   * @param b Liste d'ids de films de l'utilisateur B (dédoublonnée)
   * @returns Nombre entre 0 et 100 (non arrondi)
   */
  calculateSimilarity(a: any[], b: any[]): number {
    if (!a || !b || a.length === 0 || b.length === 0) {
      return 0;
    }

    const setA = new Set(a.filter(id => id != null).map(id => String(id).trim()));
    const setB = new Set(b.filter(id => id != null).map(id => String(id).trim()));

    if (setA.size === 0 || setB.size === 0) return 0;

    // Intersection : |A ∩ B|
    const intersection = new Set([...setA].filter(id => setB.has(id)));

    // Union : |A ∪ B|
    const union = new Set([...setA, ...setB]);

    if (union.size === 0) return 0;

    return (intersection.size / union.size) * 100;
  }

  /**
   * Retourne les ids de films communs aux deux listes (après dédoublonnage).
   */
  getCommonMovies(a: any[], b: any[]): string[] {
    if (!a || !b || a.length === 0 || b.length === 0) return [];
    const setB = new Set(b.filter(id => id != null).map(id => String(id).trim()));
    return [...new Set(a.filter(id => id != null).map(id => String(id).trim()))].filter(id => setB.has(id));
  }

  /**
   * Normalise les IDs de favoris en clés canoniques (titres minuscules) si les films sont connus.
   * Gère aussi la correspondance entre IDs TMDB ('tmdb_550') et numériques ('550').
   */
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
   * Trouve tous les utilisateurs dont le taux de correspondance avec l'utilisateur
   * courant est STRICTEMENT supérieur à MATCH_THRESHOLD (75 %).
   *
   * Règles d'exclusion :
   * - L'utilisateur courant lui-même
   * - Les comptes désactivés (active === false)
   * - Les utilisateurs sans favoris
   * - Les taux ≤ threshold (75 % pile est exclu par défaut)
   *
   * @param currentUser Utilisateur connecté
   * @param allUsers    Tous les utilisateurs Firestore
   * @param movies      Catalogue complet de films
   * @param threshold   Seuil de filtrage (défaut: MATCH_THRESHOLD = 75)
   * @returns Liste triée du taux le plus élevé au plus faible
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

      // Exclure : soi-même (par uid ou email)
      if (
        (other.uid && currentUser.uid && other.uid === currentUser.uid) ||
        (other.email && currentUser.email && other.email === currentUser.email)
      ) {
        continue;
      }

      // Exclure : comptes désactivés
      if (other.active === false) {
        continue;
      }

      // Exclure : administrateurs (sauf si explicitement autorisé)
      if (excludeAdmins && otherRole === 'admin') {
        continue;
      }

      // Exclure : sans favoris
      const otherFavs = (other.favorites || []).filter(id => id != null);
      if (otherFavs.length === 0) continue;

      // 1. Calcul principal sur les IDs (pure formule Jaccard demandée)
      let percentage = this.calculateSimilarity(currentFavs, otherFavs);
      let commonMovieIds = this.getCommonMovies(currentFavs, otherFavs);

      // 2. Fallback intelligent par titre si les IDs diffèrent (ex: custom_xxx vs tmdb_xxx)
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

      // Seuil de correspondance (inclus à partir de 75 %)
      if (Math.round(percentage) < threshold) {
        continue;
      }

      // Résoudre les objets Movie complets avec objet fallback propre
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

    // Tri décroissant par pourcentage
    return results.sort((a, b) => b.percentage - a.percentage);
  }
}
