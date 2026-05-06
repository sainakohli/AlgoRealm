// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAauWm-v7xXXDcJQjT5SsAu7VhpXJPOTY8",
  authDomain: "algorealm-e2020.firebaseapp.com",
  projectId: "algorealm-e2020",
  storageBucket: "algorealm-e2020.firebasestorage.app",
  messagingSenderId: "458119179551",
  appId: "1:458119179551:web:0ba3f6e1a00b2f844c942a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app)
export const db = getFirestore(app)