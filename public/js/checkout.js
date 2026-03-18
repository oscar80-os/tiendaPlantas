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
      <div class="summary-row">
        <span>${item.title || "Curso"}</span>
        <strong>${money(price)}</strong>
      </div>
    `;
  }).join("");

  totalEl.textContent = money(total);
}

async function startWompiCheckout() {
  await protectCheckout();
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

    localStorage.setItem("wompi_reference", reference);

    const checkout = new WidgetCheckout({
      currency: "COP",
      amountInCents: total * 100,
      reference: reference,
      publicKey: "TU_PUBLIC_KEY_WOMPI",
      redirectUrl: window.location.origin + "/cursos/resultado.html"
    });

    checkout.open(function () {});
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