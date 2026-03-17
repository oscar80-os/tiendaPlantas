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
    return `
      <div class="summary-row">
        <span>${item.title}</span>
        <strong>${money(item.price)}</strong>
      </div>
    `;
  }).join("");

  totalEl.textContent = money(total);
}

async function createOrderAndStartPayment() {
  const user = await protectCheckout();
  const cart = getCart();

  if (!cart.length) {
    alert("No hay cursos en el carrito.");
    return;
  }

  const phone = document.getElementById("nequi-phone").value.trim();
  if (!/^3\d{9}$/.test(phone)) {
    alert("Ingresa un número Nequi válido de 10 dígitos, por ejemplo 3001234567.");
    return;
  }

  const button = document.getElementById("pay-btn");
  button.disabled = true;
  button.textContent = "Creando orden...";

  try {
    const token = await user.getIdToken();
    const response = await fetch(`${functionsUrl}/api/createNequiCourseOrder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        items: cart,
        phoneNumber: phone
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "No se pudo iniciar el pago.");
    }

    localStorage.setItem("last_order_id", data.orderId);
    document.getElementById("payment-status").innerHTML = `
      <p>Orden creada: <strong>${data.orderId}</strong></p>
      <p>Estado inicial: <strong>${data.status}</strong></p>
      <p>Revisa tu app Nequi y confirma el pago.</p>
    `;

    button.textContent = "Verificar pago";
    button.disabled = false;
    button.onclick = verifyLastOrder;
  } catch (error) {
    alert(error.message);
    button.disabled = false;
    button.textContent = "Pagar con Nequi";
  }
}

async function verifyLastOrder() {
  const orderId = localStorage.getItem("last_order_id");
  if (!orderId) {
    alert("No hay orden activa.");
    return;
  }

  const user = auth.currentUser;
  const token = await user.getIdToken();
  const button = document.getElementById("pay-btn");
  button.disabled = true;
  button.textContent = "Verificando...";

  try {
    const response = await fetch(`${functionsUrl}/api/verifyNequiCourseOrder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ orderId })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No se pudo verificar la orden.");
    }

    document.getElementById("payment-status").innerHTML = `
      <p>Estado actual: <strong>${data.status}</strong></p>
      <p>${data.message}</p>
    `;

    if (data.status === "PAID") {
      localStorage.removeItem(checkoutCartKey);
      button.style.display = "none";
      document.getElementById("go-courses-btn").style.display = "inline-block";
    } else {
      button.disabled = false;
      button.textContent = "Verificar pago";
    }
  } catch (error) {
    alert(error.message);
    button.disabled = false;
    button.textContent = "Verificar pago";
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  await protectCheckout();
  renderOrderSummary();
});

window.createOrderAndStartPayment = createOrderAndStartPayment;
window.verifyLastOrder = verifyLastOrder;
