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
    const token = credential.accessToken;
    const user = result.user;
    
    console.log('User signed in:', user);
    
    // Additional logic if you want to save user info to Firestore
    const userDocRef = doc(fs, 'users', user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastLogin: serverTimestamp(),
      // Optionally store token if needed
      accessToken: token,
    }, { merge: true });
    
    return { user, token };
  } catch (error) {
    console.error('Error during Google sign-in:', error.message);
    throw error;
  }
};

// Create Google Meet link function
const createGoogleMeet = async (appointmentDate, clientEmail) => {
  try {
    // Check if the lawyer is authenticated before creating a Google Meet link
    const token = await auth.currentUser.getIdToken();

    const response = await axios.post('/api/create-google-meet', {
      appointmentDate: appointmentDate.toISOString(),
      clientEmail,
    }, {
      headers: {
        Authorization: `Bearer ${token}`, // Pass the Firebase token for authentication
      },
    });

    return response.data.hangoutLink;
  } catch (error) {
    // If an authentication error occurs, handle it
    if (error.response && error.response.status === 401) {
      // Redirect the lawyer to Google login if not authenticated
      window.location.href = '/google-login'; // Ensure you have a route to handle this
    } else {
      console.error('Error creating Google Meet link:', error);
      throw error;
    }
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
};
