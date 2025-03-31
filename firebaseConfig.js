// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

//  Replace these values with your actual Firebase config from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCibYnmpOd9W3LjoOgBd694kyVHbEgxZp8",
  authDomain: "finix-e8140.firebaseapp.com",
  projectId: "finix-e8140",
  storageBucket: "finix-e8140.firebasestorage.app",
  messagingSenderId: "482336024117",
  appId: "1:482336024117:web:54698c7954196978ba737c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
