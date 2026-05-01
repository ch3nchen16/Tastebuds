//Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';

//Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAMJOpb2U2GynGRpaOG5WWh2TV-OrXRSUo",
  authDomain: "tastebuds-ac071.firebaseapp.com",
  projectId: "tastebuds-ac071",
  storageBucket: "tastebuds-ac071.firebasestorage.app",
  messagingSenderId: "703673400425",
  appId: "1:703673400425:web:caa137dca2dc07238376f8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
