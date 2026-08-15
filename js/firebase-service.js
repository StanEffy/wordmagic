/**
 * WordMagic Firebase Cloud Service
 * Integrates official Firebase v10+ Web SDK for Authentication (Google / Email) and Cloud Firestore real-time sync.
 */

// Import modern modular Firebase SDK from official Google CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  signInAnonymously
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  writeBatch,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

import { storage } from './storage.js';

export const firebaseConfig = {
  apiKey: "AIzaSyABC3WGdIX3f_mC1QXGL7FZlStlsrarz50",
  authDomain: "writer-95653.firebaseapp.com",
  projectId: "writer-95653",
  storageBucket: "writer-95653.firebasestorage.app",
  messagingSenderId: "483189405263",
  appId: "1:483189405263:web:0c0b85db4c84bece719c3a"
};

class FirebaseService {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.currentUser = null;
    this.authCallbacks = [];
    this.isInitialized = false;

    this.init();
  }

  init() {
    try {
      this.app = initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);
      this.isInitialized = true;

      // Listen for auth state changes
      onAuthStateChanged(this.auth, (user) => {
        this.currentUser = user;
        this.notifyAuthChange(user);
        if (user) {
          console.log(`[Firebase] Авторизован пользователь: ${user.displayName || user.email || user.uid}`);
          // Trigger cloud sync
          this.syncWithFirestore();
        } else {
          console.log('[Firebase] Пользователь не авторизован (локальный режим)');
        }
      });
    } catch (err) {
      console.warn('[Firebase] Ошибка инициализации Firebase SDK:', err);
    }
  }

  onAuthChange(cb) {
    this.authCallbacks.push(cb);
    if (this.currentUser !== undefined) {
      cb(this.currentUser);
    }
  }

  notifyAuthChange(user) {
    this.authCallbacks.forEach(cb => {
      try { cb(user); } catch (e) { console.error(e); }
    });
  }

  // --- Authentication Operations ---

  async signInWithGoogle() {
    if (!this.auth) throw new Error('Firebase Auth не инициализирован');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(this.auth, provider);
      return result.user;
    } catch (err) {
      console.error('[Firebase] Ошибка входа через Google:', err);
      throw err;
    }
  }

  async signInAsGuest() {
    if (!this.auth) throw new Error('Firebase Auth не инициализирован');
    try {
      const result = await signInAnonymously(this.auth);
      return result.user;
    } catch (err) {
      console.error('[Firebase] Ошибка гостевого входа:', err);
      throw err;
    }
  }

  async logOut() {
    if (!this.auth) return;
    try {
      await signOut(this.auth);
    } catch (err) {
      console.error('[Firebase] Ошибка выхода:', err);
      throw err;
    }
  }

  // --- Cloud Firestore Real-Time Two-Way Synchronization ---

  async syncWithFirestore(onProgress) {
    if (!this.db || !this.currentUser) {
      return { success: false, error: 'Требуется авторизация в Firebase' };
    }

    const uid = this.currentUser.uid;
    const userRef = doc(this.db, 'users', uid);

    if (onProgress) onProgress('Связь с Cloud Firestore...');

    try {
      // 1. Pull Remote Projects from Firestore
      if (onProgress) onProgress('Получение книг из облака...');
      const projectsCol = collection(userRef, 'projects');
      const projSnap = await getDocs(projectsCol);
      const remoteProjects = [];
      projSnap.forEach(d => remoteProjects.push(d.data()));

      // 2. Pull Remote Documents / Chapters
      if (onProgress) onProgress('Получение глав из облака...');
      const docsCol = collection(userRef, 'documents');
      const docsSnap = await getDocs(docsCol);
      const remoteDocs = [];
      docsSnap.forEach(d => remoteDocs.push(d.data()));

      // 3. Pull Remote Daily Logs
      const logsDoc = await getDoc(doc(userRef, 'meta', 'dailyLogs'));
      const remoteDailyLogs = logsDoc.exists() ? (logsDoc.data().logs || {}) : {};

      // 4. Merge Remote -> Local
      const localProjects = storage.getProjects();
      for (const rp of remoteProjects) {
        const lIdx = localProjects.findIndex(p => p.id === rp.id);
        if (lIdx === -1 || (rp.updatedAt || 0) > (localProjects[lIdx].updatedAt || 0)) {
          storage.saveProject(rp);
        }
      }

      for (const rd of remoteDocs) {
        const ld = await storage.getDocument(rd.id);
        if (!ld || (rd.updatedAt || 0) > (ld.updatedAt || 0)) {
          await storage.saveDocument(rd);
        }
      }

      if (Object.keys(remoteDailyLogs).length > 0) {
        const localAllLogs = storage.getDailyLogs();
        for (const pId of Object.keys(remoteDailyLogs)) {
          if (!localAllLogs[pId]) localAllLogs[pId] = {};
          for (const dStr of Object.keys(remoteDailyLogs[pId])) {
            const rEntry = remoteDailyLogs[pId][dStr];
            const lEntry = localAllLogs[pId][dStr];
            if (!lEntry || (rEntry.lastUpdated || 0) > (lEntry.lastUpdated || 0)) {
              localAllLogs[pId][dStr] = rEntry;
            }
          }
        }
        storage.saveDailyLogs(localAllLogs);
      }

      // 5. Push Local -> Cloud Firestore (batch write)
      if (onProgress) onProgress('Сохранение изменений в Cloud Firestore...');
      const allLocalProjects = storage.getProjects();
      const allLocalDocs = await storage.getAllDocuments();
      const allLocalLogs = storage.getDailyLogs();

      const batch = writeBatch(this.db);

      // Save user profile metadata
      batch.set(userRef, {
        displayName: this.currentUser.displayName || 'Автор',
        email: this.currentUser.email || '',
        lastSync: serverTimestamp()
      }, { merge: true });

      // Save projects
      allLocalProjects.forEach(p => {
        const pRef = doc(projectsCol, p.id);
        batch.set(pRef, p, { merge: true });
      });

      // Save documents
      allLocalDocs.forEach(d => {
        const dRef = doc(docsCol, d.id);
        batch.set(dRef, d, { merge: true });
      });

      // Save daily logs
      const logsRef = doc(userRef, 'meta', 'dailyLogs');
      batch.set(logsRef, { logs: allLocalLogs, updatedAt: Date.now() }, { merge: true });

      await batch.commit();

      return {
        success: true,
        pulledDocs: remoteDocs.length,
        pulledProjects: remoteProjects.length,
        user: this.currentUser
      };
    } catch (err) {
      console.error('[Firebase] Ошибка синхронизации с Firestore:', err);
      throw err;
    }
  }
}

export const firebaseService = new FirebaseService();
