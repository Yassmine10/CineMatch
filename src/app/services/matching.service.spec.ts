import { describe, it, expect, beforeEach } from 'vitest';
import { MatchingService, MATCH_THRESHOLD } from './matching.service';
import { UserProfile } from '../models/user.model';
import { Movie } from '../models/movie.model';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeUser(uid: string, favorites: string[], active = true, role: 'user' | 'admin' = 'user'): UserProfile {
  return {
    uid,
    nom: 'Nom',
    prenom: 'Prénom',
    age: 25,
    email: `${uid}@test.com`,
    photo: '',
    role,
    active,
    favorites,
    createdAt: new Date().toISOString()
  };
}

function makeMovie(id: string): Movie {
  return { id, title: `Film ${id}`, year: 2024, genre: 'Action', overview: '', posterUrl: '', rating: 7, source: 'admin' };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('MatchingService', () => {
  let service: MatchingService;

  beforeEach(() => {
    service = new MatchingService();
  });

  // ── calculateSimilarity ──────────────────────────────────────────────────

  it('listes identiques → 100 %', () => {
    const ids = ['m1', 'm2', 'm3', 'm4'];
    expect(service.calculateSimilarity(ids, ids)).toBe(100);
  });

  it('listes disjointes → 0 %', () => {
    expect(service.calculateSimilarity(['m1', 'm2'], ['m3', 'm4'])).toBe(0);
  });

  it('liste A vide → 0 %', () => {
    expect(service.calculateSimilarity([], ['m1', 'm2'])).toBe(0);
  });

  it('liste B vide → 0 %', () => {
    expect(service.calculateSimilarity(['m1', 'm2'], [])).toBe(0);
  });

  it('deux listes vides → 0 %', () => {
    expect(service.calculateSimilarity([], [])).toBe(0);
  });

  it('4 films communs sur une union de 5 → 80 %', () => {
    // A = {m1,m2,m3,m4,m5}, B = {m1,m2,m3,m4}
    // intersection = {m1,m2,m3,m4} taille=4, union = {m1..m5} taille=5
    // taux = 4/5 × 100 = 80 %
    expect(service.calculateSimilarity(['m1', 'm2', 'm3', 'm4', 'm5'], ['m1', 'm2', 'm3', 'm4'])).toBe(80);
  });

  it('cas limite exactement 75 % (3 communs sur union de 4) → taux = 75', () => {
    // A = {m1,m2,m3}, B = {m1,m2,m3,m4}
    // intersection = 3, union = 4 → 3/4 × 100 = 75 %
    expect(service.calculateSimilarity(['m1', 'm2', 'm3'], ['m1', 'm2', 'm3', 'm4'])).toBe(75);
  });

  it('doublons dans une liste → ignorés (dédoublonnage)', () => {
    // A avec doublons = ['m1','m1','m2','m2'] → Set = {m1,m2}
    // B = {m1,m2} → intersection=2, union=2 → 100 %
    expect(service.calculateSimilarity(['m1', 'm1', 'm2', 'm2'], ['m1', 'm2'])).toBe(100);
  });

  // ── findMatches ──────────────────────────────────────────────────────────

  const myFavs = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8'];
  const allMovies: Movie[] = ['m1','m2','m3','m4','m5','m6','m7','m8','m9','m10'].map(makeMovie);

  it('exclut l\'utilisateur courant lui-même', () => {
    const me = makeUser('me', myFavs);
    const results = service.findMatches(me, [me], allMovies);
    expect(results.length).toBe(0);
  });

  it('exclut les comptes désactivés (même à 100 %)', () => {
    const me = makeUser('me', myFavs);
    const disabled = makeUser('disabled', myFavs, false);
    const results = service.findMatches(me, [me, disabled], allMovies);
    expect(results.length).toBe(0);
  });

  it('exclut les administrateurs', () => {
    const me = makeUser('me', myFavs);
    const admin = makeUser('admin1', myFavs, true, 'admin');
    const results = service.findMatches(me, [me, admin], allMovies);
    expect(results.length).toBe(0);
  });

  it('inclut 75 % (seuil atteint à partir de 75 %)', () => {
    const me = makeUser('me', ['m1', 'm2', 'm3']);
    // userC : intersection=3, union=4 → exactement 75 % → INCLUS
    const userC = makeUser('userC', ['m1', 'm2', 'm3', 'm4']);
    const results = service.findMatches(me, [me, userC], allMovies);
    expect(results.length).toBe(1);
    expect(results[0].user.uid).toBe('userC');
  });

  it('inclut les taux strictement supérieurs à 75 %', () => {
    const me = makeUser('me', myFavs);
    const userA = makeUser('userA', myFavs); // 100 %
    const results = service.findMatches(me, [me, userA], allMovies);
    expect(results.length).toBe(1);
    expect(results[0].user.uid).toBe('userA');
    expect(results[0].percentage).toBeGreaterThan(MATCH_THRESHOLD);
  });

  it('tri décroissant par pourcentage', () => {
    const me = makeUser('me', ['m1','m2','m3','m4','m5','m6','m7','m8']);
    // userA = 100 % : mêmes 8 films, union=8, intersection=8
    const userA = makeUser('userA', ['m1','m2','m3','m4','m5','m6','m7','m8']);
    // userB ≈ 88.9 % : 8 films communs, union=9
    const userB = makeUser('userB', ['m1','m2','m3','m4','m5','m6','m7','m8','m9']);
    const results = service.findMatches(me, [me, userB, userA], allMovies);
    expect(results[0].user.uid).toBe('userA');
    expect(results[1].user.uid).toBe('userB');
  });

  it('exclut les utilisateurs sans favoris', () => {
    const me = makeUser('me', myFavs);
    const noFavs = makeUser('noFavs', []);
    const results = service.findMatches(me, [me, noFavs], allMovies);
    expect(results.length).toBe(0);
  });
});
