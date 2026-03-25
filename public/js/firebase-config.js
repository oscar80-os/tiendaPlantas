const firebaseConfig = {
  apiKey: "AIzaSyDuMC1oxifODI9wt4vnZRarwFBgo66sXkE",
  authDomain: "tienda-ding-dong.firebaseapp.com",
  projectId: "tienda-ding-dong",
  storageBucket: "tienda-ding-dong.firebasestorage.app",
  messagingSenderId: "379208026977",
  appId: "1:379208026977:web:3e74844ee1e92482489320",
  
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
window.auth = firebase.auth ? firebase.auth() : null;
window.db = firebase.firestore ? firebase.firestore() : null;

