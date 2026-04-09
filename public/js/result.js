function setStatus(type, title, message) {
  const icon = document.getElementById("status-icon");
  const titleEl = document.getElementById("status-title");
  const messageEl = document.getElementById("status-message");

  if (!icon || !titleEl || !messageEl) return;

  icon.className = icon ${type};
  icon.textContent = type === "success" ? "✓" : type === "error" ? "✕" : "⏳";
  titleEl.textContent = title;
  messageEl.textContent = message;
}

async function waitForUser() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged((user) => resolve(user || null));
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  const user = await waitForUser();

  if (!user) {
    setStatus(
      "pending",
      "Inicia sesión para continuar",
      "Debes ingresar con tu cuenta para consultar el estado de tu compra."
    );
    return;
  }

  setStatus(
    "success",
    "Compra registrada",
    "Si tu pago fue aprobado, tu curso se activará automáticamente en unos segundos por webhook."
  );
});