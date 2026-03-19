async function requireAuth() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged((user) => {
      if (!user) {
        window.location.href = "login.html";
        return;
      }
      resolve(user);
    });
  });
}

function formatDate(value) {
  try {
    if (!value) return "Fecha no disponible";

    if (value.toDate) {
      return value.toDate().toLocaleDateString("es-CO");
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) return "Fecha no disponible";

    return date.toLocaleDateString("es-CO");
  } catch {
    return "Fecha no disponible";
  }
}

function buildCourseCard(courseId, courseData, enrollmentData) {
  const title = courseData?.titulo || courseData?.title || enrollmentData?.tituloCurso || "Curso";
  const description =
    courseData?.descripcion ||
    courseData?.shortDescription ||
    "Ya puedes ingresar a este curso desde tu cuenta.";
  const thumbnail =
    courseData?.miniatura ||
    courseData?.thumbnailUrl ||
    "/img/cursoCactus.png";

  const purchaseDate = formatDate(enrollmentData?.fechaCompra);

  return `
    <article class="course-card">
      <img src="${thumbnail}" alt="${title}" />
      <div class="course-body">
        <h3>${title}</h3>
        <p>${description}</p>
        <p class="meta">Fecha de compra: ${purchaseDate}</p>
        <div style="margin-top:auto;">
          <a
            href="curso.html?id=${courseId}"
            class="btn btn-primary"
            style="display:inline-block;text-decoration:none;padding:10px 14px;border-radius:10px;background:#2e7d32;color:#fff;font-weight:bold;"
          >
            Entrar al curso
          </a>
        </div>
      </div>
    </article>
  `;
}

async function loadMyCourses() {
  const user = await requireAuth();

  const userEmailEl = document.getElementById("user-email");
  const container = document.getElementById("my-courses-list");

  if (userEmailEl) {
    userEmailEl.textContent = user.email || "Usuario autenticado";
  }

  if (!container) return;

  container.innerHTML = "<p>Cargando tus cursos...</p>";

  try {
    const inscripcionesSnap = await db
      .collection("inscripciones")
      .where("userId", "==", user.uid)
      .where("estado", "==", "activo")
      .get();

    if (inscripcionesSnap.empty) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>Aún no tienes cursos activos</h3>
          <p>Cuando compres un curso aparecerá aquí.</p>
          <a
            href="cursos.html"
            class="btn btn-primary"
            style="display:inline-block;text-decoration:none;padding:10px 14px;border-radius:10px;background:#2e7d32;color:#fff;font-weight:bold;margin-top:12px;"
          >
            Ir al catálogo
          </a>
        </div>
      `;
      return;
    }

    const courseMap = new Map();

    for (const doc of inscripcionesSnap.docs) {
      const enrollment = doc.data();
      const cursoId = enrollment.cursoId;

      if (!cursoId) continue;
      if (courseMap.has(cursoId)) continue;

      let courseData = null;

      try {
        const courseDoc = await db.collection("cursos").doc(cursoId).get();
        if (courseDoc.exists) {
          courseData = courseDoc.data();
        }
      } catch (error) {
        console.error(`Error cargando curso ${cursoId}:`, error);
      }

      courseMap.set(cursoId, {
        courseData,
        enrollmentData: enrollment
      });
    }

    if (!courseMap.size) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No encontramos cursos para mostrar</h3>
          <p>Tus inscripciones existen, pero no pudimos resolver el detalle del curso.</p>
        </div>
      `;
      return;
    }

    const html = Array.from(courseMap.entries())
      .map(([cursoId, data]) => buildCourseCard(cursoId, data.courseData, data.enrollmentData))
      .join("");

    container.innerHTML = `
      <div class="courses-grid">
        ${html}
      </div>
    `;
  } catch (error) {
    console.error("Error cargando mis cursos:", error);
    container.innerHTML = `
      <div class="empty-state">
        <h3>Error al cargar tus cursos</h3>
        <p>Intenta recargar la página en unos segundos.</p>
      </div>
    `;
  }
}

async function logout() {
  try {
    await auth.signOut();
    window.location.href = "login.html";
  } catch (error) {
    console.error("Error cerrando sesión:", error);
    alert("No se pudo cerrar sesión.");
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  await loadMyCourses();

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
});

window.logout = logout;