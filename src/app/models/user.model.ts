export interface UserProfile {
  uid: string;
  nom: string;
  prenom: string;
  age: number;
  email: string;
  photo: string; // Base64
  role: 'user' | 'admin';
  active: boolean;
  favorites: string[]; // List of movie IDs
  createdAt: string;
}
