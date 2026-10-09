import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Movie } from '../models/movie.model';

@Injectable({
  providedIn: 'root'
})
export class TmdbService {
  private http = inject(HttpClient);

  // Catalogue complet de films cultes prêts à l'import
  private readonly predefinedCatalog: Movie[] = [
    {
      id: 'tmdb_27205',
      title: 'Inception',
      year: '2010',
      genre: 'Science-Fiction',
      overview: 'Un voleur qui extrait des secrets des rêves des autres se voit offrir une chance de retrouver sa vie passée en implantant une idée dans l\'esprit d\'un héritier.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
      rating: 8.4,
      source: 'tmdb'
    },
    {
      id: 'tmdb_157336',
      title: 'Interstellar',
      year: '2014',
      genre: 'Science-Fiction',
      overview: 'Une équipe d\'explorateurs voyage à travers un trou de ver dans l\'espace pour assurer la survie de l\'humanité face à une Terre mourante.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      rating: 8.4,
      source: 'tmdb'
    },
    {
      id: 'tmdb_550',
      title: 'Fight Club',
      year: '1999',
      genre: 'Drame',
      overview: 'Un employé de bureau insomniaque et un vendeur de savon charismatique forment un club de combat clandestin qui devient un mouvement anarchiste.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      rating: 8.4,
      source: 'tmdb'
    },
    {
      id: 'tmdb_155',
      title: 'The Dark Knight',
      year: '2008',
      genre: 'Action',
      overview: 'Batman s\'associe au procureur Harvey Dent pour démanteler le crime organisé à Gotham, mais fait face au Joker, un criminel machiavélique.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
      rating: 9.0,
      source: 'tmdb'
    },
    {
      id: 'tmdb_680',
      title: 'Pulp Fiction',
      year: '1994',
      genre: 'Thriller',
      overview: 'Les vies de deux hommes de main, d\'un boxeur et d\'un couple de braqueurs s\'entrecroisent dans une série d\'incidents loufoques et violents.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
      rating: 8.5,
      source: 'tmdb'
    },
    {
      id: 'tmdb_603',
      title: 'Matrix',
      year: '1999',
      genre: 'Science-Fiction',
      overview: 'Un hacker découvre par de mystérieux rebelles que la réalité n\'est qu\'une simulation créée par des machines pour asservir l\'humanité.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
      rating: 8.2,
      source: 'tmdb'
    },
    {
      id: 'tmdb_872585',
      title: 'Oppenheimer',
      year: '2023',
      genre: 'Histoire',
      overview: 'L\'histoire du physicien J. Robert Oppenheimer et de son rôle dans la direction du Projet Manhattan pour concevoir la première bombe atomique.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
      rating: 8.1,
      source: 'tmdb'
    },
    {
      id: 'tmdb_693134',
      title: 'Dune : Deuxième Partie',
      year: '2024',
      genre: 'Science-Fiction',
      overview: 'Paul Atréides s\'unit à Chani et aux Fremen tout en menant une révolte contre les conspirateurs qui ont détruit sa famille.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
      rating: 8.2,
      source: 'tmdb'
    },
    {
      id: 'tmdb_496243',
      title: 'Parasite',
      year: '2019',
      genre: 'Comédie Noire',
      overview: 'Toute la famille de Ki-taek est au chômage et s\'intéresse au train de vie de la richissime famille Park. Une symbiose inattendue s\'installe.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
      rating: 8.5,
      source: 'tmdb'
    },
    {
      id: 'tmdb_299534',
      title: 'Avengers: Endgame',
      year: '2019',
      genre: 'Action',
      overview: 'Après les événements dévastateurs causés par Thanos, les Avengers restants doivent se rassembler une dernière fois pour rétablir l\'ordre dans l\'univers.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
      rating: 8.3,
      source: 'tmdb'
    },
    {
      id: 'tmdb_569094',
      title: 'Spider-Man: Across the Spider-Verse',
      year: '2023',
      genre: 'Animation',
      overview: 'Miles Morales est catapulté à travers le multivers, où il rencontre une équipe de Spider-Héros chargée de protéger l\'existence même du multivers.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
      rating: 8.4,
      source: 'tmdb'
    },
    {
      id: 'tmdb_98',
      title: 'Gladiator',
      year: '2000',
      genre: 'Action',
      overview: 'Le général romain Maximus est trahi par l\'ambitieux Commode et réduit en esclavage. Devenu gladiateur, il cherche vengeance.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/eh252qFzQcba34aL5sL0FzE4m2Y.jpg',
      rating: 8.2,
      source: 'tmdb'
    },
    {
      id: 'tmdb_597',
      title: 'Titanic',
      year: '1997',
      genre: 'Romance',
      overview: 'Deux jeunes passagers issus de classes sociales différentes tombent amoureux à bord du luxueux et funeste paquebot Titanic.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg',
      rating: 7.9,
      source: 'tmdb'
    },
    {
      id: 'tmdb_354912',
      title: 'Coco',
      year: '2017',
      genre: 'Animation',
      overview: 'Malgré le bannissement de la musique dans sa famille, Miguel rêve de devenir musicien et se retrouve propulsé dans le Pays des Morts.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/eKi8dIrr8voobbaGzDpe8w0PVbC.jpg',
      rating: 8.2,
      source: 'tmdb'
    },
    {
      id: 'tmdb_475557',
      title: 'Joker',
      year: '2019',
      genre: 'Thriller',
      overview: 'À Gotham City, Arthur Fleck, un comédien de stand-up raté et méprisé, bascule lentement dans la folie pour devenir une icône du chaos.',
      posterUrl: 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg',
      rating: 8.2,
      source: 'tmdb'
    }
  ];

  getPopularMovies(): Observable<Movie[]> {
    if (!environment.tmdbApiKey || environment.tmdbApiKey === 'VOTRE_CLE_API_TMDB') {
      return of(this.predefinedCatalog);
    }
    const url = `${environment.tmdbBaseUrl}/movie/popular?api_key=${environment.tmdbApiKey}&language=fr-FR`;
    return this.http.get<any>(url).pipe(
      map(res => res.results.map((m: any) => this.formatTmdbMovie(m))),
      catchError(() => of(this.predefinedCatalog))
    );
  }

  getPresetCatalog(): Movie[] {
    return [...this.predefinedCatalog];
  }

  searchMovies(query: string): Observable<Movie[]> {
    const q = query.trim().toLowerCase();
    if (!q) return of([]);

    if (!environment.tmdbApiKey || environment.tmdbApiKey === 'VOTRE_CLE_API_TMDB') {
      const results = this.predefinedCatalog.filter(m =>
        m.title.toLowerCase().includes(q) ||
        m.genre.toLowerCase().includes(q) ||
        m.overview.toLowerCase().includes(q)
      );
      return of(results);
    }

    const url = `${environment.tmdbBaseUrl}/search/movie?api_key=${environment.tmdbApiKey}&language=fr-FR&query=${encodeURIComponent(query)}`;
    return this.http.get<any>(url).pipe(
      map(res => res.results.map((m: any) => this.formatTmdbMovie(m))),
      catchError(() => {
        return of(this.predefinedCatalog.filter(m => m.title.toLowerCase().includes(q)));
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
