# Note sur les performances du matching

## Situation actuelle — Calcul côté client

Le matching est actuellement calculé **entièrement côté client** :

1. On charge **tous** les utilisateurs depuis Firestore avec `onSnapshot`
2. On calcule l'indice de Jaccard pour **chaque** utilisateur
3. On filtre et trie les résultats en mémoire

### Limite avec beaucoup d'utilisateurs

| Nb d'utilisateurs | Reads Firestore | Calculs Jaccard | Durée estimée |
|---|---|---|---|
| 100 | 100 docs | 100 | < 100 ms |
| 1 000 | 1 000 docs | 1 000 | < 500 ms |
| 10 000 | 10 000 docs | 10 000 | ≈ 2-5 s + coût réseau |
| 100 000 | 100 000 docs | 100 000 | ❌ inutilisable |

**Problèmes concrets :**
- **Coût Firestore** : chaque lecture d'un document est facturée. 10 000 utilisateurs = 10 000 reads à chaque ouverture de la page.
- **Temps de chargement** : télécharger 10 000 documents JSON sur mobile peut prendre plusieurs secondes.
- **Bande passante** : on télécharge les données de tous les utilisateurs (photos base64 incluses !) même si on n'en a besoin que de 5.
- **Calcul JS** : l'algorithme est O(n) en nombre d'utilisateurs, ce qui reste raisonnable, mais précédé d'un I/O O(n) qui domine.

---

## Amélioration recommandée — Cloud Function de pré-calcul

Au lieu de calculer en temps réel côté client, on **pré-calcule les matchs** et on les stocke dans Firestore.

### Architecture proposée

```
Firestore trigger : users/{uid} onWrite
        ↓
Cloud Function "recalculateMatches"
        ↓ (lit tous les users, calcule Jaccard, filtre > 75 %)
Stockage dans : matches/{uid}/results = [{ matchedUid, percentage, commonMovieIds }]
        ↓
Client lit uniquement matches/{currentUid}/results
        → 1 seul read Firestore au lieu de N
```

### Pseudo-code Cloud Function (non implémenté)

```typescript
// functions/src/recalculateMatches.ts
export const recalculateMatches = onDocumentWritten('users/{uid}', async (event) => {
  const changedUid = event.params.uid;
  const allUsersSnap = await db.collection('users').get();
  const allUsers = allUsersSnap.docs.map(d => d.data() as UserProfile);
  const changedUser = allUsers.find(u => u.uid === changedUid);
  if (!changedUser) return;

  // Recalculer uniquement pour l'utilisateur modifié
  const results = findMatches(changedUser, allUsers, []); // sans résolution movies
  await db.doc(`matches/${changedUid}`).set({ results, updatedAt: FieldValue.serverTimestamp() });
});
```

### Avantages

| Critère | Client-side actuel | Cloud Function pré-calcul |
|---|---|---|
| Reads Firestore par ouverture | N (tous les users) | 1 (son propre doc matches) |
| Coût pour 10 000 users | 10 000 reads | 1 read |
| Latence | Élevée (réseau + calcul) | Très faible (1 doc) |
| Fraîcheur | Temps réel | Légère latence (trigger async) |
| Complexité backend | Aucune | Moyenne |

### Alternative plus simple : index de fans

Ajouter un champ `matchScores: { [uid]: number }` directement dans le document utilisateur, mis à jour via Cloud Function. Le client lit juste `users/{myUid}` et a ses scores pré-calculés.
