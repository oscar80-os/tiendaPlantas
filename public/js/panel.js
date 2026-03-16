auth.onAuthStateChanged(async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const contenedor = document.getElementById("cursos");
  const userEmail = document.getElementById("user-email");

  if (userEmail) {
    userEmail.textContent = user.email || "";
  }

  contenedor.innerHTML = "<p>Cargando tus cursos...</p>";

  try {
    const inscripcionesSnap = await db
      .collection("inscripciones")
      .where("usuarioId", "==", user.uid)
      .where("estado", "==", "activo")
      .get();

    if (inscripcionesSnap.empty) {
      contenedor.innerHTML = `
        <div class="empty-state">
          <h3>Aún no tienes cursos activos</h3>
          <p>Cuando te asignemos un curso aparecerá aquí.</p>
          <a href="../index.html#productos" class="btn-link">Ver catálogo</a>
        </div>
      `;
      return;
    }

    let html = "";

    for (const doc of inscripcionesSnap.docs) {
      const data = doc.data();
      const cursoId = data.cursoId;

      if (!cursoId) continue;

      const cursoDoc = await db.collection("cursos").doc(cursoId).get();

      if (!cursoDoc.exists) continue;

      const curso = cursoDoc.data();

      html += `
        <div class="curso-card">
          <div class="curso-thumb">
            <img src="${curso.miniatura || 'https://via.placeholder.com/500x280?text=Curso'}" alt="${curso.titulo}">
          </div>
          <div class="curso-body">
            <h3>${curso.titulo || "Curso sin título"}</h3>
            <p>${curso.descripcion || "Sin descripción disponible."}</p>
            <a class="btn-curso" href="curso.html?id=${cursoDoc.id}">Entrar al curso</a>
          </div>
        </div>
      `;
    }

    contenedor.innerHTML = html || "<p>No se encontraron cursos disponibles.</p>";
  } catch (error) {
    console.error("Error cargando panel:", error);
    contenedor.innerHTML = "<p>Error al cargar tus cursos.</p>";
  }
});

async function logout() {
  try {
    await auth.signOut();
    window.location.href = "login.html";
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    alert("No se pudo cerrar sesión.");
  }
}

window.logout = logout;