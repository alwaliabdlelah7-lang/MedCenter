import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { 
  initializeAuth, 
  browserLocalPersistence,
  browserPopupRedirectResolver
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// In AI Studio, firebase-applet-config.json is served at the root
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
// export const analytics = getAnalytics(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver
});

auth.useDeviceLanguage();

// Google OAuth Client ID provided by user: 664763080154-ltivq25btsn2atttn0obp4a4g7flk1er.apps.googleusercontent.com
