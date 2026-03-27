// Firebase initialization with Auth and Firestore
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCMN1nq5_LxHI1mgNFIrdKEtw-oRqFIajI",
  authDomain: "genport-aiportfolio.firebaseapp.com",
  projectId: "genport-aiportfolio",
  storageBucket: "genport-aiportfolio.firebasestorage.app",
  messagingSenderId: "453847744459",
  appId: "1:453847744459:web:f2c20bd77e2d58ae9a8e98"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
