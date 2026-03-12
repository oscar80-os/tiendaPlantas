const db=firebase.firestore();

firebase.auth().onAuthStateChanged(user=>{

if(!user){

window.location="login.html";
return;

}

db.collection("compras")
.where("usuario","==",user.uid)
.get()
.then(snapshot=>{

let html="";

snapshot.forEach(doc=>{

let curso=doc.data().curso;

html+=`
<div>
<h3>${curso}</h3>
<a href="curso.html?id=${curso}">Ver curso</a>
</div>
`;

});

document.getElementById("cursos").innerHTML=html;

});

});