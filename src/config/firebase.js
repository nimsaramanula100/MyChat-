// Firebase Initialization & Configuration Module
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Default / Stored Config Helper
export function getStoredFirebaseConfig() {
  try {
    const saved = localStorage.getItem('mychat_firebase_config');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to parse saved Firebase config', e);
  }
  return null;
}

export function saveFirebaseConfig(config) {
  if (!config || !config.apiKey) {
    localStorage.removeItem('mychat_firebase_config');
  } else {
    localStorage.setItem('mychat_firebase_config', JSON.stringify(config));
  }
}

let app = null;
let auth = null;
let db = null;
let storage = null;

export function initFirebase(configOverride = null) {
  const config = configOverride || getStoredFirebaseConfig();
  
  if (!config || !config.apiKey || !config.projectId) {
    // Demo Mode: No Firebase configured yet
    return { isFirebaseConfigured: false, app: null, auth: null, db: null, storage: null };
  }

  try {
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    return { isFirebaseConfigured: true, app, auth, db, storage };
  } catch (err) {
    console.error('Firebase initialization error:', err);
    return { isFirebaseConfigured: false, error: err.message };
  }
}

export { app, auth, db, storage };
