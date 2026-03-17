async function protectAdmin() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged(async user => {
      if (!user) {
        window.location.href = "./cursos/login.html";
        return;
      }
      const doc = await db.collection("usuarios").doc(user.uid).get();
      if (!doc.exists || doc.data().rol !== "admin") {
        document.getElementById("admin-app").innerHTML = "<p>No tienes permisos de administrador.</p>";
        return;
      }
      resolve(user);
    });
  });
}

function money(value) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value || 0);
}

async function saveCourse() {
  const payload = {
    title: document.getElementById("title").value.trim(),
    shortDescription: document.getElementById("shortDescription").value.trim(),
    longDescription: document.getElementById("longDescription").value.trim(),
    thumbnailUrl: document.getElementById("thumbnailUrl").value.trim(),
    videoUrl: document.getElementById("videoUrl").value.trim(),
    price: Number(document.getElementById("price").value || 0),
    activo: document.getElementById("activo").checked,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  if (!payload.title || !payload.price) {
    alert("Título y precio son obligatorios.");
    return;
  }
  await db.collection("cursos").add({
    ...payload,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  document.getElementById("course-form").reset();
  document.getElementById("activo").checked = true;
  loadCourses();
}

async function loadCourses() {
  const list = document.getElementById("courses-list");
  list.innerHTML = "<p>Cargando cursos...</p>";
  const snap = await db.collection("cursos").orderBy("createdAt", "desc").get();
  if (snap.empty) {
    list.innerHTML = "<p>No hay cursos cargados.</p>";
    return;
  }
  list.innerHTML = snap.docs.map(doc => {
    const c = doc.data();
    return `<div class="row"><div><strong>${c.title}</strong><div>${money(c.price)} · ${c.activo ? 'Activo' : 'Inactivo'}</div><small>${doc.id}</small></div><button onclick="deleteCourse('${doc.id}')">Eliminar</button></div>`;
  }).join("");
}

async function deleteCourse(id) {
  if (!confirm("¿Eliminar este curso?")) return;
  await db.collection("cursos").doc(id).delete();
  loadCourses();
}

async function adminLogout() {
  await auth.signOut();
  window.location.href = "./cursos/login.html";
}

window.addEventListener("DOMContentLoaded", async () => {
  await protectAdmin();
  loadCourses();
});
window.saveCourse = saveCourse;
window.deleteCourse = deleteCourse;
window.adminLogout = adminLogout;
