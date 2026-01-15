import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment,
  DocumentSnapshot,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { ArtPiece, User, SummaryStats, ArtFormData } from '../../types';

// ============ ART PIECES ============

export const getArtPieces = async (
  pageSize = 20,
  lastDoc: DocumentSnapshot | null = null,
  publishedOnly = true
) => {
  let q = query(
    collection(db, 'artPieces'),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );

  if (publishedOnly) {
    q = query(
      collection(db, 'artPieces'),
      where('isPublished', '==', true),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
  }

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  return {
    docs: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArtPiece)),
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
  };
};

export const getAllArtPieces = async (): Promise<ArtPiece[]> => {
  const q = query(collection(db, 'artPieces'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ArtPiece));
};

export const getArtPieceById = async (id: string): Promise<ArtPiece | null> => {
  const docRef = doc(db, 'artPieces', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as ArtPiece;
  }
  return null;
};

export const addArtPiece = async (
  data: ArtFormData & { imageUrls: string[]; uploadedBy: string }
): Promise<string> => {
  const docRef = await addDoc(collection(db, 'artPieces'), {
    ...data,
    date: new Date().toLocaleDateString('ko-KR'),
    likes: 0,
    views: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  await updateStats({ totalArtPieces: increment(1) });

  return docRef.id;
};

export const updateArtPiece = async (
  id: string,
  data: Partial<ArtFormData & { imageUrls: string[] }>
): Promise<void> => {
  const docRef = doc(db, 'artPieces', id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const deleteArtPiece = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'artPieces', id));
  await updateStats({ totalArtPieces: increment(-1) });
};

export const incrementViews = async (artId: string): Promise<void> => {
  const docRef = doc(db, 'artPieces', artId);
  await updateDoc(docRef, { views: increment(1) });
  await updateStats({ totalViews: increment(1) });
};

export const incrementLikes = async (artId: string): Promise<void> => {
  const docRef = doc(db, 'artPieces', artId);
  await updateDoc(docRef, { likes: increment(1) });
  await updateStats({ totalLikes: increment(1) });
};

export const decrementLikes = async (artId: string): Promise<void> => {
  const docRef = doc(db, 'artPieces', artId);
  await updateDoc(docRef, { likes: increment(-1) });
  await updateStats({ totalLikes: increment(-1) });
};

// ============ USERS ============

export const getAllUsers = async (): Promise<User[]> => {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as User);
};

export const updateUserRole = async (uid: string, role: string): Promise<void> => {
  const docRef = doc(db, 'users', uid);
  await updateDoc(docRef, { role });
};

// ============ STATS ============

export const getStats = async (): Promise<SummaryStats | null> => {
  const docRef = doc(db, 'stats', 'summary');
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as SummaryStats;
  }
  return null;
};

export const updateStats = async (data: Record<string, any>): Promise<void> => {
  const docRef = doc(db, 'stats', 'summary');
  await updateDoc(docRef, {
    ...data,
    lastUpdated: serverTimestamp()
  });
};

export const initializeStats = async (): Promise<void> => {
  const docRef = doc(db, 'stats', 'summary');
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    await updateDoc(docRef, {
      totalArtPieces: 0,
      totalUsers: 0,
      totalViews: 0,
      totalLikes: 0,
      lastUpdated: serverTimestamp()
    });
  }
};
