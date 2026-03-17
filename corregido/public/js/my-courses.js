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

async function loadMyCourses() {
  const user = await protectPage();
  const container = document.getElementById("my-courses");
  container.innerHTML = "<p>Cargando tus cursos...</p>";

  try {
    const enrollments = await db.collection("inscripciones")
      .where("userId", "==", user.uid)
      .where("status", "==", "active")
      .get();

    if (enrollments.empty) {
      container.innerHTML = '<p>Aún no tienes cursos activos. <a href="cursos.html">Ir al catálogo</a></p>';
      return;
    }

    const cards = [];
    for (const doc of enrollments.docs) {
      const data = doc.data();
      const courseDoc = await db.collection("cursos").doc(data.courseId).get();
      if (!courseDoc.exists) continue;
      const course = courseDoc.data();
      cards.push(`
        <article class="course-card">
          <img src="${course.thumbnailUrl || '../img/cursoCactus.png'}" alt="${course.title}">
          <div class="course-body">
            <h3>${course.title}</h3>
            <p>${course.shortDescription || ''}</p>
            <a class="btn" href="curso.html?id=${courseDoc.id}">Entrar al curso</a>
          </div>
        </article>
      `);
    }

    container.innerHTML = cards.join("") || "<p>No encontramos cursos activos.</p>";
  } catch (error) {
    console.error(error);
    container.innerHTML = "<p>No fue posible cargar tus cursos.</p>";
  }
}

window.addEventListener("DOMContentLoaded", loadMyCourses);
