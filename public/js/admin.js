auth.onAuthStateChanged(async (user) => {
  const app = document.getElementById("admin-app");

  if (!app) return;

  if (!user) {
    renderLogin();
    return;
  }

  renderAdmin(user);
  await cargarCursos();
});

function renderLogin() {
  const app = document.getElementById("admin-app");

  app.innerHTML = `
    <div class="admin-box">
      <h2>Administrador de cursos</h2>
      <p>Ingresa con tu cuenta de Firebase.</p>

      <div class="form-group">
        <label>Correo</label>
        <input id="admin-email" type="email" placeholder="correo@ejemplo.com">
      </div>

      <div class="form-group">
        <label>Contraseña</label>
        <input id="admin-password" type="password" placeholder="******">
      </div>

      <div class="actions">
        <button onclick="adminLogin()">Entrar</button>
      </div>
    </div>
  `;
}

function renderAdmin(user) {
  const app = document.getElementById("admin-app");

  app.innerHTML = `
    <div class="admin-wrap">
      <div class="admin-top">
        <div>
          <h1>Panel de administración</h1>
          <p>Sesión activa: <strong>${user.email || ""}</strong></p>
        </div>
        <button onclick="logoutAdmin()" class="danger">Cerrar sesión</button>
      </div>

      <div class="admin-grid">
        <section class="admin-card">
          <h3>Subir nuevo curso</h3>

          <div class="form-group">
            <label>Título del curso</label>
            <input id="titulo" type="text" placeholder="Ej: Curso de cactus y suculentas">
          </div>

          <div class="form-group">
            <label>Descripción</label>
            <textarea id="descripcion" rows="4" placeholder="Describe el curso"></textarea>
          </div>

          <div class="form-group">
            <label>Miniatura (imagen)</label>
            <input id="miniatura" type="file" accept="image/*">
          </div>

          <div class="form-group">
            <label>Video del curso</label>
            <input id="video" type="file" accept="video/*">
          </div>

          <div class="form-group">
            <label>Material adicional (PDF opcional)</label>
            <input id="material" type="file" accept=".pdf">
          </div>

          <div class="actions">
            <button onclick="subirCurso()">Subir curso</button>
          </div>

          <div id="upload-status"></div>
        </section>

        <section class="admin-card">
          <h3>Asignar curso a alumno</h3>

          <div class="form-group">
            <label>Correo del alumno</label>
            <input id="alumno-email" type="email" placeholder="alumno@correo.com">
          </div>

          <div class="form-group">
            <label>ID del curso</label>
            <input id="curso-id" type="text" placeholder="Id del curso en Firebase">
          </div>

          <div class="actions">
            <button onclick="asignarCursoPorEmail()">Asignar curso</button>
          </div>

          <div id="asignacion-status"></div>
        </section>
      </div>

      <section class="admin-card">
        <h3>Cursos cargados</h3>
        <div id="lista-cursos">Cargando cursos...</div>
      </section>
    </div>
  `;
}

async function adminLogin() {
  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value.trim();

  if (!email || !password) {
    alert("Completa correo y contraseña.");
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (error) {
    console.error("Error admin login:", error);
    alert(error.message);
  }
}

async function logoutAdmin() {
  try {
    await auth.signOut();
  } catch (error) {
    console.error(error);
  }
}

async function subirArchivo(file, path) {
  const ref = storage.ref().child(path);
  await ref.put(file);
  return await ref.getDownloadURL();
}

async function subirCurso() {
  const titulo = document.getElementById("titulo").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const miniaturaFile = document.getElementById("miniatura").files[0];
  const videoFile = document.getElementById("video").files[0];
  const materialFile = document.getElementById("material").files[0];
  const status = document.getElementById("upload-status");

  if (!titulo || !videoFile) {
    alert("Debes ingresar el título y seleccionar el video.");
    return;
  }

  status.innerHTML = "<p>Subiendo archivos...</p>";

  try {
    const timestamp = Date.now();

    let miniaturaUrl = "";
    let videoUrl = "";
    let materialUrl = "";

    if (miniaturaFile) {
      miniaturaUrl = await subirArchivo(
        miniaturaFile,
        `cursos/miniaturas/${timestamp}-${miniaturaFile.name}`
      );
    }

    videoUrl = await subirArchivo(
      videoFile,
      `cursos/videos/${timestamp}-${videoFile.name}`
    );

    if (materialFile) {
      materialUrl = await subirArchivo(
        materialFile,
        `cursos/materiales/${timestamp}-${materialFile.name}`
      );
    }

    const docRef = await db.collection("cursos").add({
      titulo,
      descripcion,
      miniatura: miniaturaUrl,
      videoUrl,
      materialUrl,
      activo: true,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
    });

    status.innerHTML = `
      <p style="color:green;">
        Curso creado correctamente. ID: <strong>${docRef.id}</strong>
      </p>
    `;

    document.getElementById("titulo").value = "";
    document.getElementById("descripcion").value = "";
    document.getElementById("miniatura").value = "";
    document.getElementById("video").value = "";
    document.getElementById("material").value = "";

    await cargarCursos();
  } catch (error) {
    console.error("Error subiendo curso:", error);
    status.innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
  }
}

async function cargarCursos() {
  const lista = document.getElementById("lista-cursos");
  if (!lista) return;

  lista.innerHTML = "<p>Cargando...</p>";

  try {
    const snapshot = await db.collection("cursos").orderBy("fechaCreacion", "desc").get();

    if (snapshot.empty) {
      lista.innerHTML = "<p>No hay cursos creados.</p>";
      return;
    }

    let html = `<div class="curso-admin-list">`;

    snapshot.forEach((doc) => {
      const curso = doc.data();

      html += `
        <div class="curso-admin-item">
          <div>
            <strong>${curso.titulo || "Sin título"}</strong><br>
            <small>ID: ${doc.id}</small>
          </div>
          <div>
            <a href="../cursos/curso.html?id=${doc.id}" target="_blank">Abrir</a>
          </div>
        </div>
      `;
    });

    html += `</div>`;
    lista.innerHTML = html;
  } catch (error) {
    console.error("Error cargando cursos:", error);
    lista.innerHTML = "<p>Error cargando cursos.</p>";
  }
}

async function buscarUsuarioPorEmail(email) {
  const snap = await db.collection("usuarios").where("email", "==", email).limit(1).get();

  if (!snap.empty) {
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  return null;
}

async function asignarCursoPorEmail() {
  const email = document.getElementById("alumno-email").value.trim().toLowerCase();
  const cursoId = document.getElementById("curso-id").value.trim();
  const status = document.getElementById("asignacion-status");

  if (!email || !cursoId) {
    alert("Completa correo y curso.");
    return;
  }

  status.innerHTML = "<p>Asignando curso...</p>";

  try {
    const usuario = await buscarUsuarioPorEmail(email);

    if (!usuario || !usuario.uid) {
      status.innerHTML = `
        <p style="color:red;">
          No encontré el usuario en la colección "usuarios". 
          Debes guardar el uid del alumno al registrarse.
        </p>
      `;
      return;
    }

    const existente = await db
      .collection("inscripciones")
      .where("usuarioId", "==", usuario.uid)
      .where("cursoId", "==", cursoId)
      .limit(1)
      .get();

    if (!existente.empty) {
      status.innerHTML = "<p>Ese alumno ya tiene asignado este curso.</p>";
      return;
    }

    await db.collection("inscripciones").add({
      usuarioId: usuario.uid,
      usuarioEmail: email,
      cursoId: cursoId,
      estado: "activo",
      fechaCompra: firebase.firestore.FieldValue.serverTimestamp()
    });

    status.innerHTML = "<p style='color:green;'>Curso asignado correctamente.</p>";
  } catch (error) {
    console.error("Error asignando curso:", error);
    status.innerHTML = `<p style="color:red;">${error.message}</p>`;
  }
}

window.adminLogin = adminLogin;
window.logoutAdmin = logoutAdmin;
window.subirCurso = subirCurso;
window.asignarCursoPorEmail = asignarCursoPorEmail;