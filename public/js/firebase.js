const firebaseConfig = {

apiKey: "TU_API_KEY",
authDomain: "TU_PROYECTO.firebaseapp.com",
projectId: "TU_PROYECTO",
storageBucket: "TU_PROYECTO.appspot.com"

};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();