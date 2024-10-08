import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, QueryConstraint } from 'firebase/firestore';
import { db } from '../firebase';

export function useFirestore<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) {
  const [documents, setDocuments] = useState<T[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, collectionName), ...constraints);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const results: T[] = [];
        snapshot.docs.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() } as T);
        });
        setDocuments(results);
        setError(null);
      },
      (err) => {
        console.error(`Error fetching ${collectionName}:`, err);
        setError(`Error fetching ${collectionName}. Please try again.`);
      }
    );

    return () => unsubscribe();
  }, [collectionName]);

  return { documents, error };
}