import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { getFirestore, doc, getDocFromServer, collection, addDoc, updateDoc, query, orderBy, limit, getDocs, setDoc, serverTimestamp, getDoc, deleteDoc } from "firebase/firestore";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import firebaseConfig from "../../firebase-applet-config.json";
import { PauvelResponse } from "../types";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

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
  return new Promise<{ user: User, profile: any }>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        const profile = await ensureUserDoc(user);
        resolve({ user, profile });
      } else {
        // We will no longer force anonymous sign in on boot, we'll wait for user login.
        resolve({ user: null as any, profile: null });
      }
    });
  });
}

export async function registerWithEmail(email: string, pass: string) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await sendEmailVerification(cred.user);
    await ensureUserDoc(cred.user);
    return cred.user;
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') throw new Error('El correo ya está en uso.');
    if (err.code === 'auth/weak-password') throw new Error('La contraseña es muy débil (mín. 6 caracteres).');
    handleFirestoreError(err, OperationType.WRITE, `users`);
    throw new Error('Error al registrarse. Revisa tus datos.');
  }
}

export async function loginWithEmail(email: string, pass: string) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    if (!cred.user.emailVerified) {
      throw new Error('NOT_VERIFIED');
    }
    const profile = await ensureUserDoc(cred.user);
    return { user: cred.user, profile };
  } catch (err: any) {
    if (err.message === 'NOT_VERIFIED') throw err;
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
      throw new Error('Correo o contraseña incorrectos.');
    }
    handleFirestoreError(err, OperationType.WRITE, `users`);
    throw new Error('Error al iniciar sesión.');
  }
}

export async function resendVerification() {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
}

export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const profile = await ensureUserDoc(result.user);
    return { user: result.user, profile };
  } catch (err) {
    if (err instanceof Error && err.message.includes('popup-closed-by-user')) {
      return null;
    }
    handleFirestoreError(err, OperationType.WRITE, `users`);
  }
}

export async function logOut() {
  await signOut(auth);
}

export async function updateUserProfile(uid: string, data: Partial<{ career: string, outfit: string, unlockedOutfits: string[], xp: number, level: number }>) {
  const userRef = doc(db, 'users', uid);
  try {
    const validData: any = { updatedAt: serverTimestamp() };
    if (data.career !== undefined) validData.career = data.career;
    if (data.outfit !== undefined) validData.outfit = data.outfit;
    if (data.xp !== undefined) validData.xp = data.xp;
    if (data.level !== undefined) validData.level = data.level;
    
    if (data.unlockedOutfits !== undefined) {
      const snap = await getDoc(userRef);
      const existingOutfits = snap.data()?.unlockedOutfits || ['default'];
      validData.unlockedOutfits = Array.from(new Set([...existingOutfits, ...data.unlockedOutfits]));
    }
    
    await updateDoc(userRef, validData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function addXP(uid: string, amount: number) {
  const userRef = doc(db, 'users', uid);
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) return;
    
    const data = snap.data();
    let { xp = 0, level = 1, unlockedOutfits = ['default'] } = data;
    
    xp += amount;
    
    const xpToNextLevel = level * 100;
    let leveledUp = false;
    let newItems: string[] = [];
    
    while (xp >= xpToNextLevel) {
      xp -= xpToNextLevel;
      level += 1;
      leveledUp = true;
      
      // Unlock outfits based on level thresholds
      if (level === 2 && !unlockedOutfits.includes('casual')) newItems.push('casual');
      if (level === 5 && !unlockedOutfits.includes('tech')) newItems.push('tech');
      if (level === 10 && !unlockedOutfits.includes('royal')) newItems.push('royal');
    }
    
    const updates: any = { xp, level, updatedAt: serverTimestamp() };
    if (newItems.length > 0) {
      updates.unlockedOutfits = Array.from(new Set([...unlockedOutfits, ...newItems]));
    }
    
    await updateDoc(userRef, updates);
    return { level, xp, leveledUp, newItems };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

async function ensureUserDoc(user: User) {
  const userRef = doc(db, 'users', user.uid);
  try {
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      const data = {
        uid: user.uid,
        email: user.email,
        isAnonymous: user.isAnonymous,
        career: '',
        xp: 0,
        level: 1,
        unlockedOutfits: ['default'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, data);
      return data;
    }
    const defaultData = {
      xp: 0,
      level: 1,
      unlockedOutfits: ['default'],
      ...userDoc.data()
    };
    return defaultData;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    } else {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
    return null;
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

// ALARMS CRUD
export async function getAlarms() {
  if (!auth.currentUser) return [];
  const ref = collection(db, 'users', auth.currentUser.uid, 'alarms');
  try {
    const q = query(ref, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, `users/${auth.currentUser.uid}/alarms`);
    return [];
  }
}

export async function addAlarm(data: any) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const ref = collection(db, 'users', auth.currentUser.uid, 'alarms');
  try {
    const docRef = await addDoc(ref, {
      userId: auth.currentUser.uid,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, `users/${auth.currentUser.uid}/alarms`);
  }
}

export async function updateAlarm(id: string, updates: any) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const ref = doc(db, 'users', auth.currentUser.uid, 'alarms', id);
  try {
    await updateDoc(ref, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `users/${auth.currentUser.uid}/alarms/${id}`);
  }
}

export async function deleteAlarm(id: string) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const ref = doc(db, 'users', auth.currentUser.uid, 'alarms', id);
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(ref);
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `users/${auth.currentUser.uid}/alarms/${id}`);
  }
}

// CLASSES CRUD
export async function getClasses() {
  if (!auth.currentUser) return [];
  const ref = collection(db, 'users', auth.currentUser.uid, 'classes');
  try {
    const q = query(ref, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, `users/${auth.currentUser.uid}/classes`);
    return [];
  }
}

export async function addClass(data: any) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const ref = collection(db, 'users', auth.currentUser.uid, 'classes');
  try {
    const docRef = await addDoc(ref, {
      userId: auth.currentUser.uid,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, `users/${auth.currentUser.uid}/classes`);
  }
}

export async function updateClass(id: string, updates: any) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const ref = doc(db, 'users', auth.currentUser.uid, 'classes', id);
  try {
    await updateDoc(ref, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `users/${auth.currentUser.uid}/classes/${id}`);
  }
}

export async function deleteClass(id: string) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const ref = doc(db, 'users', auth.currentUser.uid, 'classes', id);
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(ref);
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `users/${auth.currentUser.uid}/classes/${id}`);
  }
}

// PROJECTS CRUD
export async function getProjects() {
  if (!auth.currentUser) return [];
  const ref = collection(db, 'users', auth.currentUser.uid, 'projects');
  try {
    const q = query(ref, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, `users/${auth.currentUser.uid}/projects`);
    return [];
  }
}

export async function addProject(data: any) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const ref = collection(db, 'users', auth.currentUser.uid, 'projects');
  try {
    const docRef = await addDoc(ref, {
      userId: auth.currentUser.uid,
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, `users/${auth.currentUser.uid}/projects`);
  }
}

export async function toggleProjectComplete(id: string, isComplete: boolean) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const ref = doc(db, 'users', auth.currentUser.uid, 'projects', id);
  try {
    await updateDoc(ref, {
      isComplete,
      progress: isComplete ? 100 : 0,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `users/${auth.currentUser.uid}/projects/${id}`);
  }
}

export async function updateProjectProgress(id: string, progress: number) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const ref = doc(db, 'users', auth.currentUser.uid, 'projects', id);
  try {
    await updateDoc(ref, {
      progress,
      isComplete: progress >= 100,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `users/${auth.currentUser.uid}/projects/${id}`);
  }
}

// MESSAGES CRUD
export async function getMessages() {
  if (!auth.currentUser) return [];
  const ref = collection(db, 'users', auth.currentUser.uid, 'messages');
  try {
    const q = query(ref, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, `users/${auth.currentUser.uid}/messages`);
    return [];
  }
}

export async function addMessage(data: { role: 'user' | 'guide', text: string, mood?: string }) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const ref = collection(db, 'users', auth.currentUser.uid, 'messages');
  try {
    const messageDoc: any = {
      userId: auth.currentUser.uid,
      role: data.role,
      text: data.text,
      createdAt: serverTimestamp()
    };
    if (data.mood !== undefined) {
      messageDoc.mood = data.mood;
    }
    const docRef = await addDoc(ref, messageDoc);
    return docRef.id;
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, `users/${auth.currentUser.uid}/messages`);
  }
}

export async function clearChatHistory() {
  if (!auth.currentUser) return;
  const ref = collection(db, 'users', auth.currentUser.uid, 'messages');
  try {
    const snapshot = await getDocs(ref);
    const promises = snapshot.docs.map(docSnapshot => deleteDoc(docSnapshot.ref));
    await Promise.all(promises);
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `users/${auth.currentUser.uid}/messages`);
  }
}
export async function getCalendarTasks() {
  if (!auth.currentUser) return [];
  const ref = collection(db, 'users', auth.currentUser.uid, 'calendarTasks');
  try {
    const q = query(ref, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        date: data.date?.toDate ? data.date.toDate() : new Date() 
      };
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, `users/${auth.currentUser.uid}/calendarTasks`);
    return [];
  }
}

export async function addCalendarTask(data: any) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const ref = collection(db, 'users', auth.currentUser.uid, 'calendarTasks');
  try {
    const { Timestamp } = await import('firebase/firestore');
    const docRef = await addDoc(ref, {
      userId: auth.currentUser.uid,
      title: data.title,
      completed: data.completed,
      date: Timestamp.fromDate(data.date),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, `users/${auth.currentUser.uid}/calendarTasks`);
  }
}

export async function updateCalendarTask(id: string, updates: any) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const ref = doc(db, 'users', auth.currentUser.uid, 'calendarTasks', id);
  try {
    const updateData: any = { ...updates, updatedAt: serverTimestamp() };
    if (updates.date instanceof Date) {
      const { Timestamp } = await import('firebase/firestore');
      updateData.date = Timestamp.fromDate(updates.date);
    }
    await updateDoc(ref, updateData);
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `users/${auth.currentUser.uid}/calendarTasks/${id}`);
  }
}

export async function deleteCalendarTask(id: string) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const ref = doc(db, 'users', auth.currentUser.uid, 'calendarTasks', id);
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(ref);
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `users/${auth.currentUser.uid}/calendarTasks/${id}`);
  }
}

// MESSAGING (Push Notifications)
let messaging: any = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.warn("Firebase Messaging no está soportado en este navegador.", e);
}

export const requestNotificationPermission = async () => {
  if (!messaging) return null;
  try {
    console.log('Solicitando permiso de notificaciones...');
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Permiso concedido.');
      // Opcional: const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });
      try {
        const token = await getToken(messaging);
        console.log('FCM Token obtenido:', token);
        return token;
      } catch (tokenErr) {
        console.error('Error al obtener el FCM token. Si estás en una vista previa, abre la app en una nueva pestaña.', tokenErr);
        return null; // Aún permitimos devolviendo null, ya que el permiso sí se dio.
      }
    } else {
      console.log('Permiso de notificación denegado.');
      return null;
    }
  } catch (error) {
    console.error('Error al obtener permiso:', error);
    return null;
  }
};

export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};
