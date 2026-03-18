const checkoutCartKey = "dingdong_course_cart";

function money(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(value || 0);
}

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
}

async function protectCheckout() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged((user) => {
      if (!user) {
        window.location.href = "login.html";
        return;
      }
      resolve(user);
    });
  });
}

function renderOrderSummary() {
  const cart = getCart();
  const box = document.getElementById("order-summary");
  const totalEl = document.getElementById("checkout-total");

  if (!box || !totalEl) return;

  if (!cart.length) {
    box.innerHTML = "<p>No hay cursos en el carrito.</p>";
    totalEl.textContent = money(0);
    return;
  }

  let total = 0;

  box.innerHTML = cart.map((item) => {
    const price = Number(item.price || 0);
    total += price;

    return `
      <div class="summary-row" style="display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #eee;">
        <span>${item.title || "Curso"}</span>
        <strong>${money(price)}</strong>
      </div>
    `;
  }).join("");

  totalEl.textContent = money(total);
}

async function activatePurchasedCourses(user, cart, transactionId) {
  const batch = db.batch();

  cart.forEach((item) => {
    const ref = db.collection("inscripciones").doc();

    batch.set(ref, {
      usuarioId: user.uid,
      usuarioEmail: user.email || "",
      cursoId: item.id,
      tituloCurso: item.title || "",
      estado: "activo",
      transactionId: transactionId || "",
      fechaCompra: firebase.firestore.FieldValue.serverTimestamp()
    });
  });

  await batch.commit();
}

async function startWompiCheckout() {
  const user = await protectCheckout();
  const cart = getCart();

  if (!cart.length) {
    alert("No hay cursos en el carrito.");
    return;
  }

  const customerNameInput = document.getElementById("customer-name");
  const customerPhoneInput = document.getElementById("customer-phone");
  const payBtn = document.getElementById("pay-btn");

  const customerName = customerNameInput ? customerNameInput.value.trim() : "";
  const customerPhone = customerPhoneInput ? customerPhoneInput.value.trim() : "";

  if (!customerName) {
    alert("Escribe tu nombre completo.");
    return;
  }

  const total = cart.reduce((sum, item) => sum + Number(item.price || 0), 0);

  if (total <= 0) {
    alert("El total del carrito no es válido.");
    return;
  }

  if (payBtn) {
    payBtn.disabled = true;
    payBtn.textContent = "Abriendo Wompi...";
  }

  try {
    const reference = "curso_" + Date.now();

    const checkout = new WidgetCheckout({
      currency: "COP",
      amountInCents: total * 100,
      reference: reference,
      publicKey: "pub_test_sLku86QTMKflFC4LR8ENqHOrYM3hjUAA",
      redirectUrl: window.location.origin + "/cursos/resultado.html"
    });

    checkout.open(async function (result) {
      console.log("Respuesta Wompi:", result);

      const status = result?.transaction?.status;
      const transactionId = result?.transaction?.id || "";

      if (status === "APPROVED") {
        try {
          await activatePurchasedCourses(user, cart, transactionId);
          clearCart();
          window.location.href = "/cursos/mis-cursos.html";
        } catch (error) {
          console.error("Error activando cursos:", error);
          alert("El pago fue aprobado, pero ocurrió un error activando tus cursos.");
        }
      } else if (status === "DECLINED") {
        alert("El pago fue rechazado.");
      } else if (status === "ERROR") {
        alert("Ocurrió un error en el pago.");
      } else {
        alert("El pago no fue completado.");
      }

      if (payBtn) {
        payBtn.disabled = false;
        payBtn.textContent = "Continuar a Wompi";
      }
    });
  } catch (error) {
    console.error("Error iniciando checkout:", error);
    alert("No se pudo abrir Wompi.");
    if (payBtn) {
      payBtn.disabled = false;
      payBtn.textContent = "Continuar a Wompi";
    }
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  await protectCheckout();
  renderOrderSummary();

  const payBtn = document.getElementById("pay-btn");
  if (payBtn) {
    payBtn.addEventListener("click", startWompiCheckout);
  }
});

window.startWompiCheckout = startWompiCheckout;