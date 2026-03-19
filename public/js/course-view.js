function getCourseIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id") || "";
}

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

function setErrorState(title, message) {
  const container = document.getElementById("course-content");
  if (!container) return;

  container.innerHTML = `
    <div class="card">
      <div class="empty-state">
        <h2>${title}</h2>
        <p>${message}</p>
        <div style="margin-top:16px;">
          <a href="mis-cursos.html" class="btn btn-primary" style="text-decoration:none;">Volver a mis cursos</a>
        </div>
      </div>
    </div>
  `;
}

function renderCourse(user, courseId, courseData, enrollmentData) {
  const container = document.getElementById("course-content");
  const userEmailEl = document.getElementById("user-email");

  if (userEmailEl) {
    userEmailEl.textContent = user.email || "Usuario autenticado";
  }

  if (!container) return;

  const title = courseData?.titulo || courseData?.title || enrollmentData?.tituloCurso || "Curso";
  const description =
    courseData?.descripcion ||
    courseData?.shortDescription ||
    "Bienvenido a tu curso.";
  const longDescription =
    courseData?.descripcionLarga ||
    courseData?.longDescription ||
    "";
  const thumbnail =
    courseData?.miniatura ||
    courseData?.thumbnailUrl ||
    "/img/cursoCactus.png";
  const videoUrl = courseData?.videoUrl || "";
  const materialUrl = courseData?.materialUrl || "";
  const purchaseDate = formatDate(enrollmentData?.fechaCompra);

  container.innerHTML = `
    <section class="card">
      <div class="hero">
        <div>
          <img src="${thumbnail}" alt="${title}" />
        </div>

        <div>
          <h2>${title}</h2>
          <p>${description}</p>
          ${longDescription ? `<p>${longDescription}</p>` : ""}
          <p class="meta">Curso ID: ${courseId}</p>
          <p class="meta">Fecha de activación: ${purchaseDate}</p>

          <div class="materials">
            ${materialUrl ? `
              <a
                href="${materialUrl}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-primary"
              >
                Descargar material
              </a>
            ` : ""}
            <a href="mis-cursos.html" class="btn btn-secondary">Volver a mis cursos</a>
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <h3 style="margin-top:0;">Video del curso</h3>

      ${videoUrl ? `
        <div class="video-wrap">
          <video controls controlsList="nodownload">
            <source src="${videoUrl}" type="video/mp4" />
            Tu navegador no soporta la reproducción de video.
          </video>
        </div>
      ` : `
        <div class="empty-state" style="padding:20px 0;">
          <p>Este curso todavía no tiene un video cargado.</p>
        </div>
      `}
    </section>
  `;
}

async function validateEnrollment(user, courseId) {
  const snap = await db
    .collection("inscripciones")
    .where("userId", "==", user.uid)
    .where("cursoId", "==", courseId)
    .where("estado", "==", "activo")
    .limit(1)
    .get();

  if (snap.empty) {
    return null;
  }

  return snap.docs[0].data();
}

async function loadCourse() {
  const user = await requireAuth();
  const courseId = getCourseIdFromUrl();

  if (!courseId) {
    setErrorState("Curso no encontrado", "La URL no contiene un identificador de curso válido.");
    return;
  }

  try {
    const enrollmentData = await validateEnrollment(user, courseId);

    if (!enrollmentData) {
      setErrorState(
        "Acceso no autorizado",
        "No tienes una inscripción activa para este curso."
      );
      return;
    }

    const courseDoc = await db.collection("cursos").doc(courseId).get();

    if (!courseDoc.exists) {
      setErrorState(
        "Curso no disponible",
        "El curso existe en tu inscripción, pero no encontramos su contenido en la base de datos."
      );
      return;
    }

    const courseData = courseDoc.data();
    renderCourse(user, courseId, courseData, enrollmentData);
  } catch (error) {
    console.error("Error cargando curso:", error);
    setErrorState(
      "Error al cargar el curso",
      "Intenta nuevamente en unos segundos."
    );
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
  await loadCourse();

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
});

window.logout = logout;