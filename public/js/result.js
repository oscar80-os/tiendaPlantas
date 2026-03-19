const checkoutCartKey = "dingdong_course_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(checkoutCartKey)) || [];
  } catch (error) {
    console.error("Error leyendo carrito:", error);
    return [];
  }
}

function clearCart() {
  localStorage.removeItem(checkoutCartKey);
  localStorage.removeItem("wompi_reference");
}

function setStatus(type, title, message) {
  const icon = document.getElementById("status-icon");
  const titleEl = document.getElementById("status-title");
  const messageEl = document.getElementById("status-message");

  if (!icon || !titleEl || !messageEl) return;

  icon.className = `icon ${type}`;

  if (type === "success") icon.textContent = "✓";
  else if (type === "error") icon.textContent = "✕";
  else icon.textContent = "⏳";

  titleEl.textContent = title;
  messageEl.textContent = message;
}

function fillDetails({ reference, transactionId, status }) {
  const box = document.getElementById("payment-details");
  const refEl = document.getElementById("detail-reference");
  const txEl = document.getElementById("detail-transaction");
  const statusEl = document.getElementById("detail-status");

  if (!box || !refEl || !txEl || !statusEl) return;

  refEl.textContent = reference || "-";
  txEl.textContent = transactionId || "-";
  statusEl.textContent = status || "-";
  box.style.display = "block";
}

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    id: params.get("id") || params.get("transaction_id") || "",
    status: (params.get("status") || "").toUpperCase(),
    reference: params.get("reference") || params.get("merchant_reference") || ""
  };
}

async function waitForUser() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged((user) => {
      resolve(user || null);
    });
  });
}

async function courseAlreadyAssigned(userId, courseId) {
  const snap = await db
    .collection("inscripciones")
    .where("userId", "==", userId)
    .where("cursoId", "==", courseId)
    .where("estado", "==", "activo")
    .limit(1)
    .get();

  return !snap.empty;
}

async function activateCoursesFromCart(user, transactionId, reference) {
  const cart = getCart();

  if (!cart.length) {
    return { activated: 0, skipped: 0 };
  }

  let activated = 0;
  let skipped = 0;

  for (const item of cart) {
    const exists = await courseAlreadyAssigned(user.uid, item.id);

    if (exists) {
      skipped++;
      continue;
    }

    await db.collection("inscripciones").add({
      userId: user.uid,
      userEmail: user.email || "",
      cursoId: item.id,
      tituloCurso: item.title || "",
      estado: "activo",
      referenciaPago: reference || "",
      transactionId: transactionId || "",
      fechaCompra: firebase.firestore.FieldValue.serverTimestamp()
    });

    activated++;
  }

  clearCart();
  return { activated, skipped };
}

async function processResult() {
  const { id, status, reference } = getQueryParams();

  fillDetails({
    reference,
    transactionId: id,
    status: status || "SIN DATO"
  });

  const user = await waitForUser();

  if (!user) {
    setStatus(
      "pending",
      "Inicia sesión para ver tu compra",
      "Necesitas entrar con tu cuenta para asociar tus cursos comprados."
    );
    return;
  }

  if (status === "APPROVED") {
    try {
      const result = await activateCoursesFromCart(user, id, reference);

      if (result.activated > 0) {
        setStatus(
          "success",
          "¡Pago aprobado!",
          "Tus cursos fueron activados correctamente y ya están disponibles en tu cuenta."
        );
      } else if (result.skipped > 0) {
        setStatus(
          "success",
          "Pago aprobado",
          "La compra ya había sido registrada anteriormente. Tus cursos siguen activos."
        );
      } else {
        setStatus(
          "success",
          "Pago aprobado",
          "El pago fue aprobado. Verifica tus cursos en el panel."
        );
      }
    } catch (error) {
      console.error("Error activando cursos:", error);
      setStatus(
        "error",
        "Pago aprobado, pero hubo un problema",
        "Recibimos la aprobación del pago, pero no pudimos activar los cursos automáticamente."
      );
    }
    return;
  }

  if (status === "DECLINED") {
    setStatus(
      "error",
      "Pago rechazado",
      "Tu pago fue rechazado. Puedes intentarlo de nuevo con otro medio de pago."
    );
    return;
  }

  if (status === "PENDING") {
    setStatus(
      "pending",
      "Pago pendiente",
      "Tu transacción está en proceso. Cuando se confirme, podrás acceder a tus cursos."
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

  setStatus(
    "pending",
    "Estado no confirmado",
    "No pudimos confirmar el resultado del pago desde la URL de retorno."
  );
}

window.addEventListener("DOMContentLoaded", processResult);