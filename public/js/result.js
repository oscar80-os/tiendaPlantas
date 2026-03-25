const pendingOrderKey = "dingdong_pending_order";
const checkoutCartKey = "dingdong_course_cart";

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

async function markOrderApproved(orderId, transactionId, reference) {
  if (!orderId) return;

  try {
    await db.collection("ordenes").doc(orderId).update({
      estado: "aprobado",
      transactionId: transactionId || "",
      referenciaPago: reference || "",
      fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("Error actualizando orden:", error);
  }
}

async function activateCourseFromPendingOrder(user, transactionId, reference) {
  const pendingOrder = getPendingOrder();

  if (!pendingOrder || !pendingOrder.cursoId) {
    return {
      ok: false,
      reason: "missing_pending_order"
    };
  }

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

  return {
    ok: true,
    alreadyActive: exists
  };
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
      "Debes entrar con la misma cuenta con la que realizaste la compra para activar el curso."
    );
    return;
  }

  if (status === "APPROVED") {
    try {
      const result = await activateCourseFromPendingOrder(user, id, reference);

      if (!result.ok && result.reason === "missing_pending_order") {
        setStatus(
          "pending",
          "Pago aprobado, validación pendiente",
          "El pago parece aprobado, pero no encontramos la orden local para activar el curso automáticamente."
        );
        return;
      }

      if (result.alreadyActive) {
        setStatus(
          "success",
          "Pago aprobado",
          "Tu curso ya estaba activo previamente. Puedes entrar ahora a Mis cursos."
        );
      } else {
        setStatus(
          "success",
          "¡Pago aprobado!",
          "Tu curso fue activado correctamente y ya está disponible en tu cuenta."
        );
      }

      return;
    } catch (error) {
      console.error("Error activando curso:", error);
      setStatus(
        "error",
        "Pago aprobado, pero hubo un problema",
        "Recibimos la aprobación del pago, pero no pudimos activar el curso automáticamente."
      );
      return;
    }
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
      "Tu transacción está en proceso. Cuando se confirme, podrás acceder a tu curso."
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
