import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { 
  getAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  initializeAuth
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, initializeFirestore } from 'firebase/firestore';

// In AI Studio, firebase-applet-config.json is served at the root
import firebaseConfig from '@/firebase-applet-config.json';

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('YOUR_')) {
  console.error('[Firebase] Invalid API Key detected in config:', firebaseConfig.apiKey);
}

const app = initializeApp(firebaseConfig);
// export const analytics = getAnalytics(app);

// Use experimentalForceLongPolling to improve connectivity in restricted environments (iframes, proxies)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, (firebaseConfig as any).firestoreDatabaseId);

// Using initializeAuth with indexedDBLocalPersistence and browserLocalPersistence is 
// the recommended setup for cross-context persistence in frames.
export const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  popupRedirectResolver: browserPopupRedirectResolver
});

auth.useDeviceLanguage();

// CRITICAL CONSTRAINT: Test Firestore connection on boot
async function testConnection() {
  try {
    // Attempting a direct fetch from server to verify connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
    console.log('[Firebase] Firestore connected successfully');
  } catch (error: any) {
    if (error?.message?.includes('the client is offline') || error?.code === 'unavailable') {
      console.error("[Firebase] Firestore connectivity issue detected. Check your configuration or network.");
    }
  }
}

testConnection();

// Google OAuth Client ID provided by user: 372654458229-c4kviq9uhi0326ohrpl0r1sp5c0b6p14.apps.googleusercontent.com
