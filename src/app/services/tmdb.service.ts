import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Movie } from '../models/movie.model';

@Injectable({
  providedIn: 'root'
})
export class TmdbService {
  private http = inject(HttpClient);

  /**
   * Fetch popular/trending movies live from The Movie Database (TMDB) API
   */
  getPopularMovies(): Observable<Movie[]> {
    if (!environment.tmdbApiKey) {
      return of([]);
    }
    const url = `${environment.tmdbBaseUrl}/movie/popular?api_key=${environment.tmdbApiKey}&language=fr-FR`;
    return this.http.get<any>(url).pipe(
      map(res => (res.results || []).map((m: any) => this.formatTmdbMovie(m))),
      catchError(err => {
        console.error('TMDB API Error:', err);
        return of([]);
      })
    );
  }

  /**
   * Search movies live via TMDB API by query
   */
  searchMovies(query: string): Observable<Movie[]> {
    const q = query.trim();
    if (!q || !environment.tmdbApiKey) return of([]);

    const url = `${environment.tmdbBaseUrl}/search/movie?api_key=${environment.tmdbApiKey}&language=fr-FR&query=${encodeURIComponent(q)}`;
    return this.http.get<any>(url).pipe(
      map(res => (res.results || []).map((m: any) => this.formatTmdbMovie(m))),
      catchError(err => {
        console.error('TMDB Search Error:', err);
        return of([]);
      })
    );
  }

  private formatTmdbMovie(m: any): Movie {
    return {
      id: `tmdb_${m.id}`,
      title: m.title || m.original_title || 'Sans titre',
      year: m.release_date ? m.release_date.substring(0, 4) : 'N/A',
      genre: this.getGenreName(m.genre_ids?.[0]) || 'Film',
      overview: m.overview || 'Aucun synopsis disponible.',
      posterUrl: m.poster_path ? `${environment.tmdbImageBaseUrl}${m.poster_path}` : 'https://image.tmdb.org/t/p/w500/oYuLEW9W0bKGuh9A9WmOi9B8XHM.jpg',
      rating: m.vote_average ? Number(m.vote_average.toFixed(1)) : 7.5,
      source: 'tmdb'
    };
  }

  private getGenreName(id?: number): string {
    const genres: Record<number, string> = {
      28: 'Action',
      12: 'Aventure',
      16: 'Animation',
      35: 'Comédie',
      80: 'Crime',
      99: 'Documentaire',
      18: 'Drame',
      10751: 'Famille',
      14: 'Fantastique',
      36: 'Histoire',
      27: 'Horreur',
      10402: 'Musique',
      9648: 'Mystère',
      10749: 'Romance',
      878: 'Science-Fiction',
      53: 'Thriller',
      10752: 'Guerre',
      37: 'Western'
    };
    return id && genres[id] ? genres[id] : 'Cinéma';
  }
}
