// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from  "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAim0J8DD_t7TlU4fEwvKe0NSxn3dexSxo",
  authDomain: "trainmate-55d36.firebaseapp.com",
  projectId: "trainmate-55d36",
  // Use the exact bucket name shown in Firebase Console (without the `gs://` prefix).
  storageBucket: "trainmate-55d36.firebasestorage.app",
  messagingSenderId: "658998131458",
  appId: "1:658998131458:web:c3e383597640181a09a01b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
