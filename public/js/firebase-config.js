// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDuMC1oxifODI9wt4vnZRarwFBgo66sXkE",
  authDomain: "tienda-ding-dong.firebaseapp.com",
  projectId: "tienda-ding-dong",
  storageBucket: "tienda-ding-dong.firebasestorage.app",
  messagingSenderId: "379208026977",
  appId: "1:379208026977:web:3e74844ee1e92482489320",
  measurementId: "G-Z60MYHFEY3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = firebase.auth();
const db = firebase.firestore();