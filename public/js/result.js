function $(id) {
  return document.getElementById(id);
}

function setStatus(type, title, message) {
  const icon = $("status-icon");
  const titleEl = $("status-title");
  const messageEl = $("status-message");

  if (!icon || !titleEl || !messageEl) return;

  icon.className = `icon ${type}`;
  icon.textContent = type === "success" ? "✓" : type === "error" ? "✕" : "⏳";
  titleEl.textContent = title;
  messageEl.textContent = message;
}

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);

  return {
    transactionId: params.get("id") || params.get("transaction_id") || "",
    status: String(params.get("status") || "").toUpperCase(),
    reference: params.get("reference") || params.get("merchant_reference") || ""
  };
}

async function waitForUser() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged((user) => resolve(user || null));
  });
}

async function waitForInscription(userId, maxAttempts = 8, delayMs = 2500) {
  for (let i = 0; i < maxAttempts; i++) {
    const snap = await db
      .collection("inscripciones")
      .where("userId", "==", userId)
      .where("estado", "==", "activo")
      .limit(1)
      .get();

    if (!snap.empty) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return false;
}

function renderDetails({ transactionId, status, reference }) {
  const box = $("payment-details");
  const refEl = $("detail-reference");
  const txEl = $("detail-transaction");
  const statusEl = $("detail-status");

  if (!box || !refEl || !txEl || !statusEl) return;

  refEl.textContent = reference || "-";
  txEl.textContent = transactionId || "-";
  statusEl.textContent = status || "SIN DATO";
  box.style.display = "block";
}

window.addEventListener("DOMContentLoaded", async () => {
  const { transactionId, status, reference } = getQueryParams();

  renderDetails({
    transactionId,
    status,
    reference
  });

  const user = await waitForUser();

  if (!user) {
    setStatus(
      "pending",
      "Inicia sesión para ver tu compra",
      "Debes ingresar con la misma cuenta con la que realizaste el pago para consultar tu acceso."
    );
    return;
  }

  if (status === "DECLINED") {
    setStatus(
      "error",
      "Pago rechazado",
      "Tu pago fue rechazado. Puedes intentarlo nuevamente con otro medio de pago."
    );
    return;
  }

  if (status === "ERROR") {
    setStatus(
      "error",
      "Error en el pago",
      "Ocurrió un error durante el proceso de pago. Intenta nuevamente."
    );
    return;
  }

  if (status === "PENDING") {
    setStatus(
      "pending",
      "Pago pendiente",
      "Tu transacción está en proceso. Cuando Wompi la confirme, tu curso se activará automáticamente."
    );
    return;
  }

  setStatus(
    "pending",
    "Verificando tu acceso",
    "Estamos esperando la confirmación automática del pago para activar tu curso."
  );

  try {
    const activated = await waitForInscription(user.uid);

    if (activated) {
      setStatus(
        "success",
        "¡Curso activado!",
        "Tu compra fue confirmada y tu curso ya está disponible en Mis cursos."
      );
      return;
    }

    setStatus(
      "pending",
      "Pago recibido, activación en proceso",
      "La compra parece registrada, pero la activación aún no se refleja. Entra a Mis cursos en unos segundos y vuelve a revisar."
    );
  } catch (error) {
    console.error("Error verificando inscripción:", error);
    setStatus(
      "error",
      "No pudimos confirmar tu acceso",
      "Tu pago puede estar correcto, pero no logramos validar la activación automática en este momento."
    );
  }
});
