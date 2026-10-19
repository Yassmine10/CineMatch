export interface UserProfile {
  uid: string;
  nom: string;
  prenom: string;
  age: number;
  email: string;
  phoneNumber?: string;
  photo: string; 
  role: 'user' | 'admin';
  active: boolean;
  favorites: string[]; 
  createdAt: string;
}

