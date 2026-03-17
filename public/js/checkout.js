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
  } catch {
    return [];
  }
}

async function protectCheckout() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged(user => {
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

  if (!cart.length) {
    box.innerHTML = "<p>No hay cursos en el carrito.</p>";
    totalEl.textContent = money(0);
    return;
  }

  let total = 0;
  box.innerHTML = cart.map(item => {
    total += Number(item.price || 0);
    return `<div class="summary-row"><span>${item.title}</span><strong>${money(item.price)}</strong></div>`;
  }).join("");

  totalEl.textContent = money(total);
}

async function startWompiCheckout() {
  const user = await protectCheckout();
  const cart = getCart();

  if (!cart.length) {
    alert("No hay cursos en el carrito.");
    return;
  }

  const customerName = document.getElementById("customer-name").value.trim();
  const customerPhone = document.getElementById("customer-phone").value.trim();

  if (!customerName) {
    alert("Escribe tu nombre completo.");
    return;
  }

  const total = cart.reduce((sum, item) => sum + Number(item.price || 0), 0);

  const checkout = new WidgetCheckout({
    currency: "COP",
    amountInCents: total * 100,
    reference: "curso_" + Date.now(),
    publicKey: "pub_test_sLku86QTMKflFC4LR8ENqHOrYM3hjUAA",
    redirectUrl: window.location.origin + "/cursos/resultado.html"
  });

  checkout.open(async function (result) {
    if (result?.transaction?.status === "APPROVED") {
      try {
        const batch = db.batch();

        cart.forEach((item) => {
          const ref = db.collection("inscripciones").doc();
          batch.set(ref, {
            usuarioId: user.uid,
            cursoId: item.id,
            estado: "activo",
            fechaCompra: new Date()
          });
        });

        await batch.commit();
        localStorage.removeItem(checkoutCartKey);
        window.location.href = "/cursos/mis-cursos.html";
      } catch (error) {
        console.error(error);
        alert("El pago fue aprobado, pero hubo un problema activando el curso.");
      }
    }
  });
}

window.addEventListener("DOMContentLoaded", async () => {
  await protectCheckout();
  renderOrderSummary();
});

window.startWompiCheckout = startWompiCheckout;