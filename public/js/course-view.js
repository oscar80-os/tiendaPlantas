async function protectPage() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged(user => {
      if (!user) {
        window.location.href = "login.html";
        return;
      }
      resolve(user);
    });
  });
}

async function loadCourse() {
  const user = await protectPage();
  const courseId = new URLSearchParams(window.location.search).get("id");
  if (!courseId) {
    alert("No se encontró el curso.");
    window.location.href = "mis-cursos.html";
    return;
  }

  const enrollment = await db.collection("inscripciones")
    .where("userId", "==", user.uid)
    .where("courseId", "==", courseId)
    .where("status", "==", "active")
    .limit(1)
    .get();

  if (enrollment.empty) {
    alert("No tienes acceso a este curso.");
    window.location.href = "mis-cursos.html";
    return;
  }

  const doc = await db.collection("cursos").doc(courseId).get();
  if (!doc.exists) {
    alert("El curso no existe.");
    return;
  }

  const course = doc.data();
  document.getElementById("course-title").textContent = course.title || "Curso";
  document.getElementById("course-description").textContent = course.longDescription || course.shortDescription || "";
  if (course.videoUrl) {
    document.getElementById("course-video").src = course.videoUrl;
  }
}

window.addEventListener("DOMContentLoaded", loadCourse);
