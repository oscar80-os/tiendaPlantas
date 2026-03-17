function $(id) {
  return document.getElementById(id);
}

function getFormData() {
  return {
    email: $("email").value.trim().toLowerCase(),
    password: $("password").value.trim()
  };
}

async function login() {
  const { email, password } = getFormData();
  if (!email || !password) {
    alert("Completa correo y contraseña.");
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(email, password);
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
    await db.collection("usuarios").doc(cred.user.uid).set({
      uid: cred.user.uid,
      email,
      rol: "cliente",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    window.location.href = "cursos.html";
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
    default:
      return error.message || "Ocurrió un error.";
  }
}

window.login = login;
window.register = register;
window.logout = logout;
