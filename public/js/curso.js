const params = new URLSearchParams(window.location.search);
const cursoId = params.get("id");

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  if (!cursoId) {
    alert("No se encontró el curso.");
    window.location.href = "panel.html";
    return;
  }

  try {
    const accesoSnap = await db
      .collection("inscripciones")
      .where("usuarioId", "==", user.uid)
      .where("cursoId", "==", cursoId)
      .where("estado", "==", "activo")
      .get();

    if (accesoSnap.empty) {
      alert("No tienes acceso a este curso.");
      window.location.href = "panel.html";
      return;
    }

    const cursoDoc = await db.collection("cursos").doc(cursoId).get();

    if (!cursoDoc.exists) {
      alert("El curso no existe.");
      window.location.href = "panel.html";
      return;
    }

    const data = cursoDoc.data();

    const titulo = document.getElementById("titulo");
    const descripcion = document.getElementById("descripcion");
    const video = document.getElementById("video");
    const material = document.getElementById("material");

    titulo.textContent = data.titulo || "Curso";
    descripcion.textContent = data.descripcion || "Bienvenido a tu curso.";

    if (data.videoUrl) {
      video.src = data.videoUrl;
    } else {
      video.style.display = "none";
    }

    if (material && data.materialUrl) {
      material.href = data.materialUrl;
      material.style.display = "inline-block";
    }
  } catch (error) {
    console.error("Error cargando curso:", error);
    alert("Ocurrió un error al cargar el curso.");
    window.location.href = "panel.html";
  }
});

async function logout() {
  try {
    await auth.signOut();
    window.location.href = "login.html";
  } catch (error) {
    console.error(error);
  }
}

window.logout = logout;