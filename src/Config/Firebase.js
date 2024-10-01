// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

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
  updateDoc,
  getDoc,
  setDoc,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  signOut, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import axios from 'axios';

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

// Google Sign-In provider configuration
const googleProvider = new GoogleAuthProvider();
// Add Google Calendar scope if you need access to calendar API
googleProvider.addScope('https://www.googleapis.com/auth/calendar');

// Sign in with Google function
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential) throw new Error("No credential found");

    const token = credential.accessToken;
    const user = result.user;
    if (!user) throw new Error("No user found in the result");

    console.log('User signed in:', user);

    // Save user info to Firestore
    const userDocRef = doc(fs, 'users', user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastLogin: serverTimestamp(),
      accessToken: token,  // Optionally store token if needed
    }, { merge: true });

    return { user, token };
  } catch (error) {
    console.error('Error during Google sign-in:', error.message);
    throw error;
  }
};


const createGoogleMeet = async (appointmentDate, clientEmail) => {
  try {
    const response = await axios.post("https://api-4n4atauzwq-uc.a.run.app/create-google-meet", {
      appointmentDate: appointmentDate.toISOString(), // Ensure the date is passed in ISO format
      clientEmail
    });
    return response.data.meetLink; // Assuming your API returns the link in this field
  } catch (error) {
    console.error("Error creating Google Meet event:", error.response?.data || error.message);
    return null;
  }
};



// Sign-out function
const logout = async () => {
  try {
    await signOut(auth);
    console.log('User signed out');
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export { 
  app, 
  auth, 
  fs, 
  storage, 
  doc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  limit, 
  startAfter, 
  orderBy, 
  updateDoc, 
  getDoc, 
  setDoc, 
  serverTimestamp,
  signOut, 
  createUserWithEmailAndPassword, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  signInWithGoogle, // Export Google sign-in function
  createGoogleMeet, // Export Google Meet creation function
  logout,           // Export logout function
  analytics,
};
