// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment, arrayUnion, collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Replace with your Firebase config or use environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "DEMO_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

let app, auth, db, storage, googleProvider;
let isFirebaseAvailable = false;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();
  isFirebaseAvailable = firebaseConfig.apiKey !== "DEMO_KEY";
} catch (e) {
  console.warn('Firebase not configured, running in demo mode');
}

export { auth, db, storage, googleProvider, isFirebaseAvailable };

// Auth functions
export const signInWithGoogle = async () => {
  if (!isFirebaseAvailable) return null;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await createOrUpdateUser(result.user);
    return result.user;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const signOutUser = async () => {
  if (!isFirebaseAvailable) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
  }
};

export const onAuthChange = (callback) => {
  if (!isFirebaseAvailable) return () => {};
  return onAuthStateChanged(auth, callback);
};

// User functions
export const createOrUpdateUser = async (user) => {
  if (!isFirebaseAvailable) return;
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      displayName: user.displayName || 'Cyber Player',
      email: user.email,
      avatarId: 0,
      xp: 0,
      level: 1,
      hearts: 3,
      maxHearts: 3,
      badges: [],
      streak: { lastDate: null, count: 0 },
      totalQuizzes: 0,
      totalCorrect: 0,
      createdAt: serverTimestamp(),
    });
  }
};

export const getUserData = async (uid) => {
  if (!isFirebaseAvailable) return null;
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null;
  } catch (e) {
    console.error('getUserData error:', e);
    return null;
  }
};

export const updateUserXP = async (uid, xpGained, newLevel) => {
  if (!isFirebaseAvailable) return;
  const userRef = doc(db, 'users', uid);
  const updates = { xp: increment(xpGained) };
  if (newLevel) updates.level = newLevel;
  await updateDoc(userRef, updates);
};

export const updateUserHearts = async (uid, hearts) => {
  if (!isFirebaseAvailable) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { hearts });
};

export const addBadge = async (uid, badge) => {
  if (!isFirebaseAvailable) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { badges: arrayUnion(badge) });
};

export const updateAvatar = async (uid, avatarId) => {
  if (!isFirebaseAvailable) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { avatarId });
};

// Quiz history
export const saveQuizSession = async (uid, sessionData) => {
  if (!isFirebaseAvailable) return null;
  try {
    const ref = await addDoc(collection(db, 'quizSessions'), {
      uid,
      ...sessionData,
      timestamp: serverTimestamp(),
    });
    await updateDoc(doc(db, 'users', uid), {
      totalQuizzes: increment(1),
      totalCorrect: increment(sessionData.correctCount || 0),
    });
    return ref.id;
  } catch (e) {
    console.error('saveQuizSession error:', e);
    return null;
  }
};

export const getQuizHistory = async (uid, limitCount = 10) => {
  if (!isFirebaseAvailable) return [];
  try {
    const q = query(
      collection(db, 'quizSessions'),
      where('uid', '==', uid),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('getQuizHistory error:', e);
    return [];
  }
};
