const firebaseConfig = {
  apiKey: "REEMPLAZA_API_KEY",
  authDomain: "REEMPLAZA_AUTH_DOMAIN",
  projectId: "REEMPLAZA_PROJECT_ID",
  storageBucket: "REEMPLAZA_STORAGE_BUCKET",
  messagingSenderId: "REEMPLAZA_MESSAGING_SENDER_ID",
  appId: "REEMPLAZA_APP_ID"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
window.auth = firebase.auth ? firebase.auth() : null;
window.db = firebase.firestore ? firebase.firestore() : null;
