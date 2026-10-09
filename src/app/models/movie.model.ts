export interface Movie {
  id: string;
  title: string;
  year: number | string;
  genre: string;
  overview: string;
  posterUrl: string;
  rating: number;
  source: 'tmdb' | 'admin';
}
