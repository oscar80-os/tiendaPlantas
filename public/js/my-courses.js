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
    if (value.toDate) return value.toDate().toLocaleDateString("es-CO");
    const date = new Date(value);
    if (isNaN(date.getTime())) return "Fecha no disponible";
    return date.toLocaleDateString("es-CO");
  } catch {
    return "Fecha no disponible";
  }
}

function buildCourseCard(courseId, courseData, enrollmentData) {
  const title = courseData?.titulo || courseData?.title || enrollmentData?.tituloCurso || "Curso";
  const description = courseData?.descripcion || courseData?.shortDescription || "Ya puedes ingresar a este curso desde tu cuenta.";
  const thumbnail = courseData?.miniatura || courseData?.thumbnailUrl || "/img/cursoCactus.png";
  const purchaseDate = formatDate(enrollmentData?.fechaCompra);
  const certificateUrl = enrollmentData?.certificadoUrl || "";

  return `
    <article class="course-card">
      <img src="${thumbnail}" alt="${title}" />
      <div class="course-body">
        <h3>${title}</h3>
        <p>${description}</p>
        <p class="meta">Fecha de compra: ${purchaseDate}</p>
        <div style="margin-top:auto;display:flex;gap:10px;flex-wrap:wrap;">
          <a href="curso.html?id=${courseId}" class="btn btn-primary" style="display:inline-block;text-decoration:none;padding:10px 14px;border-radius:10px;background:#2e7d32;color:#fff;font-weight:bold;">
            Entrar al curso
          </a>
          ${
            certificateUrl
              ? <a href="${certificateUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="display:inline-block;text-decoration:none;padding:10px 14px;border-radius:10px;background:#455a64;color:#fff;font-weight:bold;">Descargar certificado</a>
              : <button class="btn-generate-certificate" data-course-id="${courseId}" style="padding:10px 14px;border:none;border-radius:10px;background:#455a64;color:#fff;font-weight:bold;cursor:pointer;">Generar certificado</button>
          }
        </div>
      </div>
    </article>
  `;
}

async function loadMyCourses() {
  const user = await requireAuth();
  const userEmailEl = document.getElementById("user-email");
  const container = document.getElementById("my-courses-list");

  if (userEmailEl) userEmailEl.textContent = user.email || "Usuario autenticado";
  if (!container) return;

  container.innerHTML = "<p>Cargando tus cursos...</p>";

  try {
    const inscripcionesSnap = await db.collection("inscripciones")
      .where("userId", "==", user.uid)
      .where("estado", "==", "activo")
      .get();

    if (inscripcionesSnap.empty) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>Aún no tienes cursos activos</h3>
          <p>Cuando compres un curso aparecerá aquí.</p>
          <a href="cursos.html" class="btn btn-primary" style="display:inline-block;text-decoration:none;padding:10px 14px;border-radius:10px;background:#2e7d32;color:#fff;font-weight:bold;margin-top:12px;">
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
      if (!cursoId || courseMap.has(cursoId)) continue;

      let courseData = null;
      try {
        const courseDoc = await db.collection("cursos").doc(cursoId).get();
        if (courseDoc.exists) courseData = courseDoc.data();
      } catch (error) {
        console.error(Error cargando curso ${cursoId}:, error);
      }

      courseMap.set(cursoId, {
        courseData,
        enrollmentData: enrollment
      });
    }

    const html = Array.from(courseMap.entries())
      .map(([cursoId, data]) => buildCourseCard(cursoId, data.courseData, data.enrollmentData))
      .join("");

    container.innerHTML = <div class="courses-grid">${html}</div>;
    bindCertificateButtons();
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

function bindCertificateButtons() {
  document.querySelectorAll(".btn-generate-certificate").forEach((button) => {
    button.addEventListener("click", async () => {
      const cursoId = button.dataset.courseId;
      if (!cursoId) return;

      try {
        button.disabled = true;
        button.textContent = "Generando...";

        const user = await requireAuth();
        const token = await user.getIdToken();

        const response = await fetch(${functionsBaseUrl}/generateCertificate, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": Bearer ${token}
          },
          body: JSON.stringify({ cursoId })
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || "No se pudo generar el certificado");
        }

        window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
        window.location.reload();
      } catch (error) {
        console.error("Error generando certificado:", error);
        alert(error.message || "No se pudo generar el certificado.");
        button.disabled = false;
        button.textContent = "Generar certificado";
      }
    });
  });
}

async function logout() {
  try {
    await auth.signOut();
    window.location.href = "login.html";
  } catch (error) {
    console.error(error);
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  await loadMyCourses();
  document.getElementById("logout-btn")?.addEventListener("click", logout);
});

window.logout = logout;
