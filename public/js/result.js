const pendingOrderKey = "dingdong_pending_order";
const checkoutCartKey = "dingdong_course_cart";

/* =========================
   LOCAL STORAGE
========================= */

function getPendingOrder() {
  try {
    return JSON.parse(localStorage.getItem(pendingOrderKey)) || null;
  } catch (error) {
    console.error("Error leyendo orden pendiente:", error);
    return null;
  }
}

function clearPendingOrder() {
  localStorage.removeItem(pendingOrderKey);
  localStorage.removeItem(checkoutCartKey);
}

/* =========================
   UI
========================= */

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

/* =========================
   URL PARAMS
========================= */

function getQueryParams() {
  const params = new URLSearchParams(window.location.search);

  return {
    id: params.get("id") || params.get("transaction_id") || "",
    status: (params.get("status") || "").toUpperCase(),
    reference: params.get("reference") || params.get("merchant_reference") || ""
  };
}

/* =========================
   AUTH
========================= */

async function waitForUser() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged((user) => {
      resolve(user || null);
    });
  });
}

/* =========================
   FIRESTORE
========================= */

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

async function markOrderApproved(orderId, transactionId, reference) {
  if (!orderId) return;

  await db.collection("ordenes").doc(orderId).update({
    estado: "aprobado",
    transactionId: transactionId || "",
    referenciaPago: reference || "",
    fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function activateCourse(user, pendingOrder, transactionId, reference) {
  const exists = await courseAlreadyAssigned(user.uid, pendingOrder.cursoId);

  if (!exists) {
    await db.collection("inscripciones").add({
      userId: user.uid,
      userEmail: user.email || pendingOrder.userEmail || "",
      cursoId: pendingOrder.cursoId,
      tituloCurso: pendingOrder.tituloCurso || "",
      estado: "activo",
      referenciaPago: reference || "",
      transactionId: transactionId || "",
      origen: "retorno_wompi",
      fechaCompra: firebase.firestore.FieldValue.serverTimestamp()
    });
  }

  await markOrderApproved(pendingOrder.orderId, transactionId, reference);
  clearPendingOrder();

  return { alreadyActive: exists };
}

/* =========================
   MAIN
========================= */

async function processResult() {
  const { id, status, reference } = getQueryParams();
  const pendingOrder = getPendingOrder();

  fillDetails({
    reference,
    transactionId: id,
    status: status || "SIN DATO"
  });

  const user = await waitForUser();

  if (!user) {
    setStatus(
      "pending",
      "Inicia sesión",
      "Debes iniciar sesión con la cuenta que realizó la compra."
    );
    return;
  }

  if (!pendingOrder || !pendingOrder.cursoId) {
    setStatus(
      "pending",
      "Orden no encontrada",
      "No encontramos la compra en este dispositivo. Si ya pagaste, revisa 'Mis cursos'."
    );
    return;
  }

  try {
    const result = await activateCourse(user, pendingOrder, id, reference);

    if (result.alreadyActive) {
      setStatus(
        "success",
        "Curso ya activo",
        "Este curso ya estaba activo en tu cuenta."
      );
    } else {
      setStatus(
        "success",
        "¡Curso activado!",
        "Tu compra fue registrada y el curso ya está disponible."
      );
    }
  } catch (error) {
    console.error("Error activando curso:", error);

    setStatus(
      "error",
      "Error en activación",
      "El pago puede estar aprobado, pero no pudimos activar el curso automáticamente."
    );
  }
}

window.addEventListener("DOMContentLoaded", processResult);