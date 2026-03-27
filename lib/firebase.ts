import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDK2edTj0WxcqjMthWIM-hXXuurSoHxneE',
  authDomain: 'genport-aiportfolio.firebaseapp.com',
  projectId: 'genport-aiportfolio',
  storageBucket: 'genport-aiportfolio.firebasestorage.app',
  messagingSenderId: '209931039751',
  appId: '1:209931039751:web:382f2d20536d367cb326a2',
  measurementId: 'G-4KPQ3GJNC3',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
