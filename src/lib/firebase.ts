import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, doc, getDocFromServer, collection, addDoc, updateDoc, query, orderBy, limit, getDocs, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { PauvelResponse } from "../types";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 1. Initialize logic
export async function initializeUser() {
  return new Promise<User>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        await ensureUserDoc(user);
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          await ensureUserDoc(cred.user);
          resolve(cred.user);
        } catch (err) {
          reject(err);
        }
      }
    });
  });
}

async function ensureUserDoc(user: User) {
  const userRef = doc(db, 'users', user.uid);
  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        isAnonymous: user.isAnonymous,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    } else {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  }
}

// 2. Data logic
export async function savePlan(energia: string, animo: string, prompt: string, planData: PauvelResponse) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const plansRef = collection(db, 'users', auth.currentUser.uid, 'plans');
  try {
    const docRef = await addDoc(plansRef, {
      userId: auth.currentUser.uid,
      energia,
      animo,
      prompt: prompt.slice(0, 5000),
      data: planData,
      completedTasks: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, `users/${auth.currentUser.uid}/plans`);
  }
}

export async function updatePlanTasks(planId: string, completedTasks: number[]) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const planRef = doc(db, 'users', auth.currentUser.uid, 'plans', planId);
  try {
    await updateDoc(planRef, {
      completedTasks,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `users/${auth.currentUser.uid}/plans/${planId}`);
  }
}

export async function getLatestPlan() {
  if (!auth.currentUser) return null;
  const plansRef = collection(db, 'users', auth.currentUser.uid, 'plans');
  try {
    const q = query(plansRef, orderBy('createdAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as any;
    }
    return null;
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, `users/${auth.currentUser.uid}/plans`);
    return null;
  }
}
