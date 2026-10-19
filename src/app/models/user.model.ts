export interface UserProfile {
  uid: string;
  nom: string;
  prenom: string;
  age: number;
  email: string;
  phoneNumber?: string;
  photo: string; // Base64 or URL
  role: 'user' | 'admin';
  active: boolean;
  favorites: string[]; // List of movie IDs
  createdAt: string;
}

