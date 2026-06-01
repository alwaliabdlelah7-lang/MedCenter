import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { 
  getAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  initializeAuth
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, initializeFirestore, memoryLocalCache } from 'firebase/firestore';

// In AI Studio, firebase-applet-config.json is served at the root
import firebaseConfig from '@/firebase-applet-config.json';

// Local Storage override for Firebase configuration (e.g. if the default is suspended)
const localApiKey = localStorage.getItem('firebase_api_key');
const localProjectId = localStorage.getItem('firebase_project_id');
const localDatabaseId = localStorage.getItem('firebase_database_id');

export const mergedConfig = {
  ...firebaseConfig,
  ...(localApiKey ? { apiKey: localApiKey } : {}),
  ...(localProjectId ? { 
    projectId: localProjectId,
    authDomain: `${localProjectId}.firebaseapp.com`,
    storageBucket: `${localProjectId}.firebasestorage.app`
  } : {}),
  ...(localDatabaseId ? { firestoreDatabaseId: localDatabaseId } : {})
};

export let isFirebaseReady = false;
export let lastFirebaseError: string | null = null;

if (!mergedConfig.apiKey || mergedConfig.apiKey.includes('YOUR_')) {
  console.error('[Firebase] Invalid API Key detected in config:', mergedConfig.apiKey);
}

const app = initializeApp(mergedConfig);
// export const analytics = getAnalytics(app);

// Use experimentalForceLongPolling to improve connectivity in restricted environments (iframes, proxies)
// Configure in-memory cache to avoid IndexedDB locking bugs / Unexpected state (ID: ca9) which occurs inside sandboxed iframes.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: memoryLocalCache()
}, (mergedConfig as any).firestoreDatabaseId || (mergedConfig as any).projectId);

// Using initializeAuth with indexedDBLocalPersistence and browserLocalPersistence is 
// the recommended setup for cross-context persistence in frames.
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver
});

auth.useDeviceLanguage();

// CRITICAL CONSTRAINT: Test Firestore connection on boot
async function testConnection(isRetry = false) {
  try {
    // Attempting a direct fetch from server to verify connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log('[Firebase] Firestore connected successfully');
    isFirebaseReady = true;
    lastFirebaseError = null;
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const errorCode = error?.code || '';
    
    // Check if it's a normal Firebase security rules denial, which indicates a SUCCESSFUL connection to the live server
    const isSuspendedMsg = errorMsg.includes('suspended') || errorMsg.includes('consumer') || errorMsg.includes('api-key');
    const isRulesDenial = (errorCode === 'permission-denied' || errorMsg.includes('permission-denied')) && !isSuspendedMsg;
    
    if (isRulesDenial) {
      console.log('[Firebase] Firestore responded successfully (security rules block verified connection)');
      isFirebaseReady = true;
      lastFirebaseError = null;
    } else if (errorMsg.includes('the client is offline') || errorCode === 'unavailable') {
      if (!isRetry) {
        console.log('[Firebase] Firestore initialized in offline mode (cache enabled). WebSockets will connect when network is available.');
      }
      isFirebaseReady = true;
      lastFirebaseError = null;
      
      // Attempt background check again in 15 seconds to see if a live connection is established
      setTimeout(() => testConnection(true), 15000);
    } else {
      lastFirebaseError = errorMsg;
      if (isSuspendedMsg) {
        console.error("[Firebase] CRITICAL ERROR: API Key or Project is suspended. Cloud features disabled.");
      } else {
        console.warn("[Firebase] Firestore connected with unexpected error:", errorMsg);
      }
      isFirebaseReady = false;
    }
  }
}

testConnection();

// Google OAuth Client ID provided by user: 372654458229-c4kviq9uhi0326ohrpl0r1sp5c0b6p14.apps.googleusercontent.com
