const checkoutCartKey = "dingdong_course_cart";

function money(value) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value || 0);
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

function buildAndSubmitWompiForm(checkout) {
  const form = document.createElement("form");
  form.method = "GET";
  form.action = checkout.checkoutUrl;

  const fields = {
    "public-key": checkout.publicKey,
    currency: checkout.currency,
    "amount-in-cents": checkout.amountInCents,
    reference: checkout.reference,
    "signature:integrity": checkout.integritySignature,
    "redirect-url": checkout.redirectUrl,
    "customer-data:email": checkout.customerEmail || "",
    "customer-data:full-name": checkout.customerName || "Cliente Ding-Dong",
    "customer-data:phone-number": checkout.customerPhone || ""
  };

  Object.entries(fields).forEach(([name, value]) => {
    if (value === undefined || value === null || value === "") return;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = String(value);
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
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

  const button = document.getElementById("pay-btn");
  button.disabled = true;
  button.textContent = "Preparando checkout...";

  try {
    const token = await user.getIdToken();
    const response = await fetch(`${functionsBaseUrl}/prepareWompiCheckout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        items: cart.map(item => item.id),
        customerName,
        customerPhone
      })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || "No se pudo preparar el checkout de Wompi.");
    }

    localStorage.setItem("last_order_id", data.orderId);
    buildAndSubmitWompiForm(data.checkout);
  } catch (error) {
    console.error(error);
    alert(error.message);
    button.disabled = false;
    button.textContent = "Continuar a Wompi";
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  await protectCheckout();
  renderOrderSummary();
});

window.startWompiCheckout = startWompiCheckout;
