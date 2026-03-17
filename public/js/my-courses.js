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

  const enrollments = await db.collection("inscripciones")
    .where("userId", "==", user.uid)
    .where("status", "==", "active")
    .get();

  if (enrollments.empty) {
    container.innerHTML = "<p>Aún no tienes cursos activos.</p>";
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
        <img src="${course.thumbnailUrl || 'https://via.placeholder.com/600x360?text=Curso'}" alt="${course.title}">
        <div class="course-body">
          <h3>${course.title}</h3>
          <p>${course.shortDescription || ''}</p>
          <a class="btn" href="curso.html?id=${courseDoc.id}">Entrar al curso</a>
        </div>
      </article>
    `);
  }

  container.innerHTML = cards.join("");
}

window.addEventListener("DOMContentLoaded", loadMyCourses);
