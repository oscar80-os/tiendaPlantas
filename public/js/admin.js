function $(id) {
  return document.getElementById(id);
}

function showMessage(targetId, text, type = "success") {
  const box = $(targetId);
  if (!box) return;

  box.textContent = text;
  box.className = `message ${type}`;
}

function clearMessage(targetId) {
  const box = $(targetId);
  if (!box) return;

  box.textContent = "";
  box.className = "message";
}

async function requireAdmin() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = "/cursos/login.html";
        return;
      }

      try {
        const userDoc = await db.collection("usuarios").doc(user.uid).get();

        if (!userDoc.exists) {
          alert("No tienes perfil de usuario.");
          window.location.href = "/cursos/cursos.html";
          return;
        }

        const userData = userDoc.data();

        if (userData.rol !== "admin") {
          alert("No tienes permisos de administrador.");
          window.location.href = "/cursos/cursos.html";
          return;
        }

        const adminUser = $("admin-user");
        if (adminUser) {
          adminUser.textContent = `${user.email || ""} · Administrador`;
        }

        resolve(user);
      } catch (error) {
        console.error("Error validando admin:", error);
        alert("No se pudo validar el acceso.");
        window.location.href = "/cursos/cursos.html";
      }
    });
  });
}

function getCreateFormData() {
  return {
    titulo: $("titulo")?.value.trim() || "",
    descripcion: $("descripcion")?.value.trim() || "",
    descripcionLarga: $("descripcionLarga")?.value.trim() || "",
    precio: Number($("precio")?.value || 0),
    miniatura: $("miniatura")?.value.trim() || "",
    videoUrl: $("videoUrl")?.value.trim() || "",
    materialUrl: $("materialUrl")?.value.trim() || "",
    wompiLink: $("wompiLink")?.value.trim() || ""
  };
}

function getEditFormData() {
  return {
    id: $("edit-id")?.value.trim() || "",
    titulo: $("edit-titulo")?.value.trim() || "",
    descripcion: $("edit-descripcion")?.value.trim() || "",
    descripcionLarga: $("edit-descripcionLarga")?.value.trim() || "",
    precio: Number($("edit-precio")?.value || 0),
    miniatura: $("edit-miniatura")?.value.trim() || "",
    videoUrl: $("edit-videoUrl")?.value.trim() || "",
    materialUrl: $("edit-materialUrl")?.value.trim() || "",
    wompiLink: $("edit-wompiLink")?.value.trim() || ""
  };
}

function validateCourseData(data) {
  if (!data.titulo) return "El título es obligatorio.";
  if (!data.descripcion) return "La descripción es obligatoria.";
  if (!data.descripcionLarga) return "La descripción larga es obligatoria.";
  if (!data.precio || data.precio <= 0) return "El precio debe ser mayor a 0.";
  if (!data.miniatura) return "La miniatura es obligatoria.";
  if (!data.videoUrl) return "El video URL es obligatorio.";
  if (!data.materialUrl) return "El material URL es obligatorio.";
  if (!data.wompiLink) return "El Wompi Link es obligatorio.";
  return "";
}

function clearCreateForm() {
  [
    "titulo",
    "descripcion",
    "descripcionLarga",
    "precio",
    "miniatura",
    "videoUrl",
    "materialUrl",
    "wompiLink"
  ].forEach((id) => {
    if ($(id)) $(id).value = "";
  });
}

function clearEditForm() {
  [
    "edit-id",
    "edit-titulo",
    "edit-descripcion",
    "edit-descripcionLarga",
    "edit-precio",
    "edit-miniatura",
    "edit-videoUrl",
    "edit-materialUrl",
    "edit-wompiLink"
  ].forEach((id) => {
    if ($(id)) $(id).value = "";
  });
}

async function createCourse() {
  clearMessage("form-message");

  const data = getCreateFormData();
  const validationError = validateCourseData(data);

  if (validationError) {
    showMessage("form-message", validationError, "error");
    return;
  }

  const saveBtn = $("save-btn");
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = "Guardando...";
  }

  try {
    await db.collection("cursos").add({
      titulo: data.titulo,
      descripcion: data.descripcion,
      descripcionLarga: data.descripcionLarga,
      precio: data.precio,
      miniatura: data.miniatura,
      videoUrl: data.videoUrl,
      materialUrl: data.materialUrl,
      wompiLink: data.wompiLink,
      activo: true,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
      fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
    });

    showMessage("form-message", "Curso creado correctamente.");
    clearCreateForm();
    await loadCoursesAdmin();
  } catch (error) {
    console.error("Error creando curso:", error);
    showMessage("form-message", "No se pudo crear el curso.", "error");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar curso";
    }
  }
}

async function updateCourse() {
  clearMessage("edit-message");

  const data = getEditFormData();

  if (!data.id) {
    showMessage("edit-message", "Selecciona un curso para editar.", "error");
    return;
  }

  const validationError = validateCourseData(data);
  if (validationError) {
    showMessage("edit-message", validationError, "error");
    return;
  }

  const updateBtn = $("update-btn");
  if (updateBtn) {
    updateBtn.disabled = true;
    updateBtn.textContent = "Actualizando...";
  }

  try {
    await db.collection("cursos").doc(data.id).update({
      titulo: data.titulo,
      descripcion: data.descripcion,
      descripcionLarga: data.descripcionLarga,
      precio: data.precio,
      miniatura: data.miniatura,
      videoUrl: data.videoUrl,
      materialUrl: data.materialUrl,
      wompiLink: data.wompiLink
    });

    showMessage("edit-message", "Curso actualizado correctamente.");
    clearEditForm();
    await loadCoursesAdmin();
  } catch (error) {
    console.error("Error actualizando curso:", error);
    showMessage("edit-message", "No se pudo actualizar el curso.", "error");
  } finally {
    if (updateBtn) {
      updateBtn.disabled = false;
      updateBtn.textContent = "Actualizar curso";
    }
  }
}

async function deleteCourse(courseId) {
  const ok = confirm("¿Seguro que quieres eliminar este curso?");
  if (!ok) return;

  try {
    await db.collection("cursos").doc(courseId).delete();
    await loadCoursesAdmin();
  } catch (error) {
    console.error("Error eliminando curso:", error);
    alert("No se pudo eliminar el curso.");
  }
}

function fillEditForm(courseId, data) {
  $("edit-id").value = courseId;
  $("edit-titulo").value = data.titulo || "";
  $("edit-descripcion").value = data.descripcion || "";
  $("edit-descripcionLarga").value = data.descripcionLarga || "";
  $("edit-precio").value = Number(data.precio || 0);
  $("edit-miniatura").value = data.miniatura || "";
  $("edit-videoUrl").value = data.videoUrl || "";
  $("edit-materialUrl").value = data.materialUrl || "";
  $("edit-wompiLink").value = data.wompiLink || "";
  clearMessage("edit-message");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatDate(value) {
  try {
    if (!value) return "Sin fecha";
    if (value.toDate) return value.toDate().toLocaleDateString("es-CO");
    const date = new Date(value);
    if (isNaN(date.getTime())) return "Sin fecha";
    return date.toLocaleDateString("es-CO");
  } catch {
    return "Sin fecha";
  }
}

async function loadCoursesAdmin() {
  const container = $("courses-admin-list");
  if (!container) return;

  container.innerHTML = "<p>Cargando cursos...</p>";

  try {
    const snapshot = await db.collection("cursos").orderBy("fechaCreacion", "desc").get();

    if (snapshot.empty) {
      container.innerHTML = "<p>No hay cursos creados.</p>";
      return;
    }

    let html = "";

    snapshot.forEach((doc) => {
      const data = doc.data();

      html += `
        <div class="course-item">
          <img src="${data.miniatura || "/img/cursoCactus.png"}" alt="${data.titulo || "Curso"}" />
          <div>
            <h4>${data.titulo || "Sin título"}</h4>
            <p>${data.descripcion || "Sin descripción"}</p>
            <p><strong>Precio:</strong> $${Number(data.precio || 0).toLocaleString("es-CO")}</p>
            <p><strong>Fecha creación:</strong> ${formatDate(data.fechaCreacion)}</p>
            <p><strong>Fecha registro:</strong> ${formatDate(data.fechaRegistro)}</p>
            <p><strong>Wompi:</strong> ${data.wompiLink ? "Configurado" : "No configurado"}</p>
          </div>
          <div class="course-actions">
            <button class="btn btn-primary" onclick='editCourse("${doc.id}")'>Editar</button>
            <button class="btn btn-danger" onclick='removeCourse("${doc.id}")'>Eliminar</button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    window.editCourse = async (courseId) => {
      const doc = await db.collection("cursos").doc(courseId).get();
      if (!doc.exists) return;
      fillEditForm(courseId, doc.data());
    };

    window.removeCourse = deleteCourse;
  } catch (error) {
    console.error("Error cargando cursos admin:", error);
    container.innerHTML = "<p>Error cargando cursos.</p>";
  }
}

async function logout() {
  try {
    await auth.signOut();
    window.location.href = "/cursos/login.html";
  } catch (error) {
    console.error("Error cerrando sesión:", error);
    alert("No se pudo cerrar sesión.");
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  await requireAdmin();
  await loadCoursesAdmin();

  $("save-btn")?.addEventListener("click", createCourse);
  $("update-btn")?.addEventListener("click", updateCourse);
  $("cancel-edit-btn")?.addEventListener("click", () => {
    clearEditForm();
    clearMessage("edit-message");
  });
  $("logout-btn")?.addEventListener("click", logout);
});