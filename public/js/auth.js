function getEmailAndPassword() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  return { email, password };
}

async function register() {
  const { email, password } = getEmailAndPassword();

  if (!email || !password) {
    alert("Por favor completa correo y contraseña.");
    return;
  }

  if (password.length < 6) {
    alert("La contraseña debe tener al menos 6 caracteres.");
    return;
  }

  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);

    await db.collection("usuarios").doc(cred.user.uid).set({
      uid: cred.user.uid,
      email: email.toLowerCase(),
      fechaRegistro: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("Cuenta creada correctamente.");
    window.location.href = "panel.html";
  } catch (error) {
    console.error("Error al crear cuenta:", error);
    alert(getFirebaseErrorMessage(error));
  }
}

async function login() {
  const { email, password } = getEmailAndPassword();

  if (!email || !password) {
    alert("Por favor completa correo y contraseña.");
    return;
  }

  try {
    await auth.signInWithEmailAndPassword(email, password);
    window.location.href = "panel.html";
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    alert(getFirebaseErrorMessage(error));
  }
}

async function recoverPassword() {
  const email = document.getElementById("email").value.trim();

  if (!email) {
    alert("Escribe tu correo para recuperar la contraseña.");
    return;
  }

  try {
    await auth.sendPasswordResetEmail(email);
    alert("Te enviamos un correo para restablecer tu contraseña.");
  } catch (error) {
    console.error("Error al recuperar contraseña:", error);
    alert(getFirebaseErrorMessage(error));
  }
}

function getFirebaseErrorMessage(error) {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "Ese correo ya está registrado.";
    case "auth/invalid-email":
      return "El correo no es válido.";
    case "auth/weak-password":
      return "La contraseña es muy débil.";
    case "auth/user-not-found":
      return "No existe una cuenta con ese correo.";
    case "auth/wrong-password":
      return "La contraseña es incorrecta.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Intenta más tarde.";
    default:
      return error.message || "Ocurrió un error inesperado.";
  }
}

window.login = login;
window.register = register;
window.recoverPassword = recoverPassword;