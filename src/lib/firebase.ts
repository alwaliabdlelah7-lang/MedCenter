import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// In AI Studio, firebase-applet-config.json is served at the root
// We can use a direct import or fetch it if needed, but import should work in Vite
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
auth.useDeviceLanguage();

// Google OAuth Client ID provided by user: 664763080154-8saag8pb0nnl5cbnvmofstg9i8klsu7h.apps.googleusercontent.com
