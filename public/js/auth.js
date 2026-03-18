let currentMode = "login";

function $(id) {
  return document.getElementById(id);
}

function showMessage(text, type = "success") {
  const box = $("auth-message");
  if (!box) return;

  box.textContent = text;
  box.className = `message ${type}`;
}

function clearMessage() {
  const box = $("auth-message");
  if (!box) return;

  box.textContent = "";
  box.className = "message";
}

function setMode(mode) {
  currentMode = mode;

  const isRegister = mode === "register";

  $("tab-login")?.classList.toggle("active", !isRegister);
  $("tab-register")?.classList.toggle("active", isRegister);

  if ($("name")) $("name").style.display = isRegister ? "block" : "none";
  if ($("label-name")) $("label-name").style.display = isRegister ? "block" : "none";

  if ($("submit-btn")) {
    $("submit-btn").textContent = isRegister ? "Crear cuenta" : "Ingresar";
  }

  if ($("password")) {
    $("password").autocomplete = isRegister ? "new-password" : "current-password";
  }

  clearMessage();
}

function getFormData() {
  return {
    name: $("name")?.value.trim() || "",
    email: $("email")?.value.trim().toLowerCase() || "",
    password: $("password")?.value || ""
  };
}

function validateEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}

async function saveUserProfile(user, name) {
  await db.collection("usuarios").doc(user.uid).set({
    uid: user.uid,
    nombre: name || "",
    email: (user.email || "").toLowerCase(),
    fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

async function registerUser() {
  const { name, email, password } = getFormData();

  if (!name) {
    showMessage("Escribe tu nombre completo.", "error");
    return;
  }

  if (!email || !validateEmail(email)) {
    showMessage("Escribe un correo válido.", "error");
    return;
  }

  if (!password || password.length < 6) {
    showMessage("La contraseña debe tener al menos 6 caracteres.", "error");
    return;
  }

  try {
    clearMessage();

    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await saveUserProfile(cred.user, name);

    showMessage("Cuenta creada correctamente. Redirigiendo...");
    setTimeout(() => {
      window.location.href = "cursos.html";
    }, 1000);
  } catch (error) {
    console.error("Error al registrar:", error);
    showMessage(getAuthErrorMessage(error), "error");
  }
}

async function loginUser() {
  const { email, password } = getFormData();

  if (!email || !validateEmail(email)) {
    showMessage("Escribe un correo válido.", "error");
    return;
  }

  if (!password) {
    showMessage("Escribe tu contraseña.", "error");
    return;
  }

  try {
    clearMessage();

    await auth.signInWithEmailAndPassword(email, password);

    showMessage("Ingreso correcto. Redirigiendo...");
    setTimeout(() => {
      window.location.href = "cursos.html";
    }, 800);
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    showMessage(getAuthErrorMessage(error), "error");
  }
}

async function resetPassword() {
  const email = $("email")?.value.trim().toLowerCase() || "";

  if (!email || !validateEmail(email)) {
    showMessage("Escribe tu correo para recuperar la contraseña.", "error");
    return;
  }

  try {
    await auth.sendPasswordResetEmail(email);
    showMessage("Te enviamos un correo para restablecer tu contraseña.");
  } catch (error) {
    console.error("Error al recuperar contraseña:", error);
    showMessage(getAuthErrorMessage(error), "error");
  }
}

function getAuthErrorMessage(error) {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "Ese correo ya está registrado.";
    case "auth/invalid-email":
      return "El correo no es válido.";
    case "auth/user-not-found":
      return "No encontramos una cuenta con ese correo.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Correo o contraseña incorrectos.";
    case "auth/weak-password":
      return "La contraseña es muy débil.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Intenta nuevamente más tarde.";
    default:
      return error.message || "Ocurrió un error inesperado.";
  }
}

function bindEvents() {
  $("tab-login")?.addEventListener("click", () => setMode("login"));
  $("tab-register")?.addEventListener("click", () => setMode("register"));

  $("reset-password-btn")?.addEventListener("click", resetPassword);

  $("auth-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitBtn = $("submit-btn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = currentMode === "register" ? "Creando..." : "Ingresando...";
    }

    try {
      if (currentMode === "register") {
        await registerUser();
      } else {
        await loginUser();
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = currentMode === "register" ? "Crear cuenta" : "Ingresar";
      }
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  setMode("login");

  auth.onAuthStateChanged((user) => {
    if (user) {
      window.location.href = "cursos.html";
    }
  });
});