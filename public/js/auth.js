const firebaseConfig = {

apiKey: "TU_API_KEY",
authDomain: "TU_PROYECTO.firebaseapp.com",
projectId: "TU_PROYECTO"

};

firebase.initializeApp(firebaseConfig);

function register(){

let email=document.getElementById("email").value;
let pass=document.getElementById("password").value;

firebase.auth().createUserWithEmailAndPassword(email,pass)
.then(()=>alert("Cuenta creada"));

}

function login(){

let email=document.getElementById("email").value;
let pass=document.getElementById("password").value;

firebase.auth().signInWithEmailAndPassword(email,pass)
.then(()=>window.location="panel.html");

}