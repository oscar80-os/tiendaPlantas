const params = new URLSearchParams(window.location.search);
const id = params.get("id");

firebase.auth().onAuthStateChanged(user => {

if(!user){
    window.location="login.html";
    return;
}

db.collection("compras")
.where("usuario","==",user.uid)
.where("curso","==",id)
.get()
.then(snapshot=>{

if(snapshot.empty){
    alert("No tienes acceso a este curso");
    window.location="panel.html";
    return;
}

db.collection("cursos").doc(id).get().then(doc=>{

let data = doc.data();

document.getElementById("titulo").innerText = data.titulo;
document.getElementById("video").src = data.video;

});

});

});