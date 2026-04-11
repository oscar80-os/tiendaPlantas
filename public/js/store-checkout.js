const STORE_CART_KEY = "dingdong_store_cart";
const CREATE_STORE_CHECKOUT_URL =
  "https://us-central1-tienda-ding-dong.cloudfunctions.net/createStoreCheckout";

const DEFAULT_SHIPPING_COST = 12000;
const FALLBACK_IMAGE = "/img/logoSinFondo1.png";

function money(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function getStoreCart() {
  try {
    const raw = localStorage.getItem(STORE_CART_KEY);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error leyendo carrito de tienda:", error);
    return [];
  }
}

function saveStoreCart(cart) {
  localStorage.setItem(STORE_CART_KEY, JSON.stringify(cart));
}

function clearStoreCart() {
  localStorage.removeItem(STORE_CART_KEY);
}

function normalizeCartItem(item) {
  const productoId = String(item.productoId || item.id || "").trim();
  const nombre = String(item.nombre || item.name || "Producto").trim();
  const cantidad = Math.max(1, Number(item.cantidad || item.quantity || 1));
  const precio = Math.max(0, Number(item.precio || item.price || 0));
  const imagen = String(item.imagen || item.image || FALLBACK_IMAGE).trim();

  return {
    productoId,
    nombre,
    cantidad,
    precio,
    imagen
  };
}

function getNormalizedCart() {
  return getStoreCart()
    .map(normalizeCartItem)
    .filter((item) => item.productoId && item.cantidad > 0);
}

function getCartSubtotal(cart = getNormalizedCart()) {
  return cart.reduce((sum, item) => {
    return sum + Number(item.precio || 0) * Number(item.cantidad || 0);
  }, 0);
}

function getCartTotal(shippingCost = DEFAULT_SHIPPING_COST, cart = getNormalizedCart()) {
  return getCartSubtotal(cart) + Number(shippingCost || 0);
}

function getTotalItems(cart = getNormalizedCart()) {
  return cart.reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
}

function updateStoreCartBadge() {
  const badge = document.getElementById("store-cart-count");
  if (!badge) return;
  badge.textContent = String(getTotalItems());
}

function renderStoreSummary(shippingCost = DEFAULT_SHIPPING_COST) {
  const cart = getNormalizedCart();
  const subtotal = getCartSubtotal(cart);
  const total = getCartTotal(shippingCost, cart);

  const subtotalEl = document.getElementById("store-subtotal");
  const shippingEl = document.getElementById("store-shipping");
  const totalEl = document.getElementById("store-total");

  if (subtotalEl) subtotalEl.textContent = money(subtotal);
  if (shippingEl) shippingEl.textContent = money(shippingCost);
  if (totalEl) totalEl.textContent = money(total);
}

function renderStoreCartItems() {
  const container = document.getElementById("store-cart-list");
  if (!container) return;

  const cart = getNormalizedCart();

  if (!cart.length) {
    container.innerHTML = "<p>Tu carrito está vacío.</p>";
    return;
  }

  container.innerHTML = cart
    .map((item) => {
      const subtotal = Number(item.precio || 0) * Number(item.cantidad || 0);

      return `
        <div class="store-cart-item" style="display:flex;gap:16px;align-items:center;background:#fff;padding:16px;border-radius:14px;box-shadow:0 8px 18px rgba(0,0,0,.06);margin-bottom:14px;">
          <img
            src="${item.imagen || FALLBACK_IMAGE}"
            alt="${item.nombre}"
            style="width:90px;height:90px;object-fit:cover;border-radius:12px;"
            onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';"
          />

          <div style="flex:1;">
            <h3 style="margin:0 0 8px;">${item.nombre}</h3>
            <p style="margin:0 0 6px;color:#6b7280;">Cantidad: ${item.cantidad}</p>
            <p style="margin:0;color:#2e7d32;font-weight:bold;">${money(item.precio)}</p>
          </div>

          <div style="text-align:right;">
            <p style="margin:0 0 10px;font-weight:bold;">${money(subtotal)}</p>

            <div style="display:flex;gap:8px;justify-content:flex-end;align-items:center;">
              <button type="button" onclick="decreaseStoreItem('${item.productoId}')" style="padding:6px 10px;border:none;border-radius:8px;background:#e5e7eb;cursor:pointer;">-</button>
              <span>${item.cantidad}</span>
              <button type="button" onclick="increaseStoreItem('${item.productoId}')" style="padding:6px 10px;border:none;border-radius:8px;background:#e5e7eb;cursor:pointer;">+</button>
              <button type="button" onclick="removeStoreItem('${item.productoId}')" style="padding:8px 12px;border:none;border-radius:10px;background:#ef4444;color:#fff;cursor:pointer;">Quitar</button>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function refreshStoreCartUI(shippingCost = DEFAULT_SHIPPING_COST) {
  updateStoreCartBadge();
  renderStoreCartItems();
  renderStoreSummary(shippingCost);
}

function increaseStoreItem(productoId) {
  const cart = getNormalizedCart();
  const item = cart.find((p) => p.productoId === String(productoId));
  if (!item) return;

  item.cantidad += 1;
  saveStoreCart(cart);
  refreshStoreCartUI();
}

function decreaseStoreItem(productoId) {
  const cart = getNormalizedCart();
  const item = cart.find((p) => p.productoId === String(productoId));
  if (!item) return;

  item.cantidad -= 1;

  if (item.cantidad <= 0) {
    const updated = cart.filter((p) => p.productoId !== String(productoId));
    saveStoreCart(updated);
  } else {
    saveStoreCart(cart);
  }

  refreshStoreCartUI();
}

function removeStoreItem(productoId) {
  const updated = getNormalizedCart().filter((p) => p.productoId !== String(productoId));
  saveStoreCart(updated);
  refreshStoreCartUI();
}

async function requireAuth() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged((user) => {
      if (!user) {
        window.location.href = "/cursos/login.html";
        return;
      }
      resolve(user);
    });
  });
}

function getCheckoutCustomerData(user) {
  const nameInput = document.getElementById("customer-name");
  const phoneInput = document.getElementById("customer-phone");
  const addressInput = document.getElementById("customer-address");

  return {
    customerName:
      String(nameInput?.value || "").trim() ||
      String(user.displayName || "").trim() ||
      String(user.email || "Cliente Ding-Dong").trim(),
    customerPhone: String(phoneInput?.value || "").trim(),
    shippingAddress: String(addressInput?.value || "").trim()
  };
}

function validateCheckoutEnvironment() {
  if (typeof auth === "undefined") {
    throw new Error("Auth de Firebase no está disponible.");
  }

  if (typeof WidgetCheckout === "undefined") {
    throw new Error("Wompi no cargó correctamente. Recarga la página e intenta de nuevo.");
  }
}

async function createStoreCheckoutRequest(payload, token) {
  let response;

  try {
    response = await fetch(CREATE_STORE_CHECKOUT_URL, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
  } catch (networkError) {
    console.error("Error de red createStoreCheckout:", networkError);
    throw new Error("No fue posible conectar con el servicio de pagos.");
  }

  let data;
  try {
    data = await response.json();
  } catch (parseError) {
    console.error("Error leyendo respuesta createStoreCheckout:", parseError);
    throw new Error("La respuesta del servidor de pagos no fue válida.");
  }

  if (!response.ok || !data.ok) {
    console.error("Respuesta inválida createStoreCheckout:", data);
    throw new Error(data.error || "No se pudo crear el checkout de tienda.");
  }

  return data;
}

async function startStoreCheckout(shippingCost = DEFAULT_SHIPPING_COST) {
  validateCheckoutEnvironment();

  const user = await requireAuth();
  const token = await user.getIdToken();
  const cart = getNormalizedCart();

  if (!cart.length) {
    throw new Error("El carrito está vacío.");
  }

  const customerData = getCheckoutCustomerData(user);

  const payload = {
    items: cart.map((item) => ({
      productoId: item.productoId,
      cantidad: item.cantidad
    })),
    shippingCost: Number(shippingCost || 0),
    customerName: customerData.customerName,
    customerPhone: customerData.customerPhone,
    shippingAddress: customerData.shippingAddress,
    redirectUrl: `${window.location.origin}/tienda/resultado-compra.html`
  };

  const data = await createStoreCheckoutRequest(payload, token);

  if (!data.checkout?.publicKey || !String(data.checkout.publicKey).startsWith("pub_")) {
    throw new Error("La llave pública de Wompi llegó inválida.");
  }

  const checkout = new WidgetCheckout({
    currency: data.checkout.currency,
    amountInCents: data.checkout.amountInCents,
    reference: data.checkout.reference,
    publicKey: data.checkout.publicKey,
    redirectUrl: data.checkout.redirectUrl,
    signature: {
      integrity: data.checkout.integritySignature
    }
  });

  checkout.open(() => {});
}

function bindStoreCheckoutEvents() {
  document.getElementById("pay-store-cart")?.addEventListener("click", async () => {
    try {
      await startStoreCheckout(DEFAULT_SHIPPING_COST);
    } catch (error) {
      console.error("Error iniciando pago de tienda:", error);
      alert(error.message || "No se pudo iniciar el pago.");
    }
  });

  document.getElementById("clear-store-cart")?.addEventListener("click", () => {
    clearStoreCart();
    refreshStoreCartUI();
  });
}

window.addEventListener("DOMContentLoaded", () => {
  refreshStoreCartUI();
  bindStoreCheckoutEvents();
});

window.getStoreCart = getStoreCart;
window.saveStoreCart = saveStoreCart;
window.clearStoreCart = clearStoreCart;
window.increaseStoreItem = increaseStoreItem;
window.decreaseStoreItem = decreaseStoreItem;
window.removeStoreItem = removeStoreItem;
window.startStoreCheckout = startStoreCheckout;

