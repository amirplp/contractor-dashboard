import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDYct-7sv6aBPtLx3B1BrjE9Puo0047GuM",
  authDomain: "contractor-dashboard-87c89.firebaseapp.com",
  projectId: "contractor-dashboard-87c89",
  storageBucket: "contractor-dashboard-87c89.firebasestorage.app",
  messagingSenderId: "1074883692029",
  appId: "1:1074883692029:web:905045f7398c99269a8594"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
