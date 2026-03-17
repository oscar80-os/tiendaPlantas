// Reemplaza estos valores por los de tu proyecto Firebase
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROYECTO",
  storageBucket: "TU_PROYECTO.firebasestorage.app",
  messagingSenderId: "TU_MESSAGING_ID",
  appId: "TU_APP_ID"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const functionsUrl = "https://us-central1-TU_PROYECTO.cloudfunctions.net";
