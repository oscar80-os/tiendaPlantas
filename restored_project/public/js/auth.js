function $(id) {
  return document.getElementById(id);
}

function getFormData() {
  return {
    email: $("email").value.trim().toLowerCase(),
    password: $("password").value.trim()
  };
}

async function ensureUserDocument(user, extra = {}) {
  const ref = db.collection("usuarios").doc(user.uid);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({
      uid: user.uid,
      email: (user.email || "").toLowerCase(),
      rol: "cliente",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      ...extra
    }, { merge: true });
  } else {
    await ref.set({
      email: (user.email || "").toLowerCase(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      ...extra
    }, { merge: true });
  }
}

async function login() {
  const { email, password } = getFormData();
  if (!email || !password) {
    alert("Completa correo y contraseña.");
    return;
  }

  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    await ensureUserDocument(cred.user);
    window.location.href = "cursos.html";
  } catch (error) {
    alert(getFirebaseErrorMessage(error));
  }
}

async function register() {
  const { email, password } = getFormData();
  if (!email || !password) {
    alert("Completa correo y contraseña.");
    return;
  }

  if (password.length < 6) {
    alert("La contraseña debe tener mínimo 6 caracteres.");
    return;
  }

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await ensureUserDocument(cred.user, {
      rol: "cliente",
      acceptedTermsAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    window.location.href = "cursos.html";
  } catch (error) {
    alert(getFirebaseErrorMessage(error));
  }
}

async function recoverPassword() {
  const email = $("email").value.trim().toLowerCase();
  if (!email) {
    alert("Escribe tu correo para enviarte el enlace de recuperación.");
    return;
  }
  try {
    await auth.sendPasswordResetEmail(email);
    alert("Te enviamos un correo para restablecer tu contraseña.");
  } catch (error) {
    alert(getFirebaseErrorMessage(error));
  }
}

async function logout() {
  await auth.signOut();
  window.location.href = "login.html";
}

function getFirebaseErrorMessage(error) {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "Ese correo ya está registrado.";
    case "auth/invalid-email":
      return "El correo no es válido.";
    case "auth/user-not-found":
      return "No existe una cuenta con ese correo.";
    case "auth/wrong-password":
      return "La contraseña es incorrecta.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Intenta de nuevo más tarde.";
    default:
      return error.message || "Ocurrió un error.";
  }
}

window.login = login;
window.register = register;
window.logout = logout;
window.recoverPassword = recoverPassword;
