// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
    getFirestore, 
    doc, 
    collection, 
    query, 
    where, 
    getDocs, 
    limit, 
    startAfter, 
    orderBy,
    updateDoc  // Import orderBy here
} from 'firebase/firestore';

import { getAuth, signOut } from 'firebase/auth'; // Import onAuthStateChanged
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKu6xS_8cIlMD4x4srwGLOiB_bfBEpdiM",
  authDomain: "lawyer-app-ed056.firebaseapp.com",
  projectId: "lawyer-app-ed056",
  storageBucket: "lawyer-app-ed056.appspot.com",
  messagingSenderId: "610288789461",
  appId: "1:610288789461:web:463aa4a5c90ad51dacbf5c",
  measurementId: "G-9BM40TSNB8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const fs = getFirestore(app);
const storage = getStorage(app);



export { 
    app, auth, fs, storage, 
    doc, collection, query, where, getDocs, 
    limit, startAfter, orderBy, updateDoc, signOut // Make sure to export updateDoc here
};