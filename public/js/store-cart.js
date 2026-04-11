const productsCartKey = "dingdong_store_cart";
const createStoreCheckoutUrl =
  "https://us-central1-tienda-ding-dong.cloudfunctions.net/createStoreCheckout";

function money(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function getStoreCart() {
  try {
    return JSON.parse(localStorage.getItem(productsCartKey)) || [];
  } catch {
    return [];
  }
}

function saveStoreCart(cart) {
  localStorage.setItem(productsCartKey, JSON.stringify(cart));
}

function clearStoreCart() {
  localStorage.removeItem(productsCartKey);
}

function updateStoreCartCount() {
  const badge = document.getElementById("store-cart-count");
  if (badge) {
    const totalItems = getStoreCart().reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
    badge.textContent = String(totalItems);
  }
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

function renderStoreCart() {
  const container = document.getElementById("store-cart-list");
  const subtotalEl = document.getElementById("store-subtotal");
  const shippingEl = document.getElementById("store-shipping");
  const totalEl = document.getElementById("store-total");
  const cart = getStoreCart();
  const shippingCost = 12000;

  if (!container) return;

  if (!cart.length) {
    container.innerHTML = "<p>Tu carrito está vacío.</p>";
    if (subtotalEl) subtotalEl.textContent = money(0);
    if (shippingEl) shippingEl.textContent = money(0);
    if (totalEl) totalEl.textContent = money(0);
    updateStoreCartCount();
    return;
  }

  let subtotal = 0;

  container.innerHTML = cart
    .map((item) => {
      const cantidad = Number(item.cantidad || 1);
      const precio = Number(item.precio || 0);
      const itemSubtotal = cantidad * precio;
      subtotal += itemSubtotal;

      return `
        <div style="display:flex;gap:16px;align-items:center;background:#fff;padding:16px;border-radius:14px;box-shadow:0 8px 18px rgba(0,0,0,.06);margin-bottom:14px;">
          <img src="${item.imagen || "/img/placeholder.png"}" alt="${item.nombre || "Producto"}" style="width:90px;height:90px;object-fit:cover;border-radius:12px;" />
          <div style="flex:1;">
            <h3 style="margin:0 0 8px;">${item.nombre || "Producto"}</h3>
            <p style="margin:0 0 6px;color:#6b7280;">Cantidad: ${cantidad}</p>
            <p style="margin:0;color:#2e7d32;font-weight:bold;">${money(precio)}</p>
          </div>
          <div style="text-align:right;">
            <p style="margin:0 0 10px;font-weight:bold;">${money(itemSubtotal)}</p>
            <button onclick="removeStoreCartItem('${item.productoId || item.id}')" style="padding:8px 12px;border:none;border-radius:10px;background:#ef4444;color:#fff;cursor:pointer;">
              Quitar
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  const total = subtotal + shippingCost;

  if (subtotalEl) subtotalEl.textContent = money(subtotal);
  if (shippingEl) shippingEl.textContent = money(shippingCost);
  if (totalEl) totalEl.textContent = money(total);

  updateStoreCartCount();
}

function removeStoreCartItem(productId) {
  const cart = getStoreCart().filter((item) => (item.productoId || item.id) !== productId);
  saveStoreCart(cart);
  renderStoreCart();
}

function addToStoreCart(product) {
  const cart = getStoreCart();
  const existing = cart.find((item) => (item.productoId || item.id) === (product.productoId || product.id));

  if (existing) {
    existing.cantidad = Number(existing.cantidad || 1) + 1;
  } else {
    cart.push({
      productoId: product.productoId || product.id,
      id: product.id || product.productoId,
      nombre: product.nombre || product.title || "Producto",
      precio: Number(product.precio || product.price || 0),
      cantidad: Number(product.cantidad || 1),
      imagen: product.imagen || product.image || ""
    });
  }

  saveStoreCart(cart);
  updateStoreCartCount();
}

async function startStoreCheckout(shippingCost = 12000) {
  const user = await requireAuth();
  const token = await user.getIdToken();
  const cart = getStoreCart();

  if (!cart.length) {
    throw new Error("El carrito está vacío.");
  }

  if (typeof WidgetCheckout === "undefined") {
    throw new Error("Wompi no cargó correctamente. Recarga la página e intenta de nuevo.");
  }

  const response = await fetch(createStoreCheckoutUrl, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      items: cart,
      shippingCost,
      customerName: user.displayName || user.email || "Cliente Ding-Dong",
      customerPhone: "",
      shippingAddress: "",
      redirectUrl: `${window.location.origin}/tienda/resultado-compra.html`
    })
  });

  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.error || "No se pudo crear el checkout de tienda.");
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

  checkout.open(function () {});
}

window.addEventListener("DOMContentLoaded", () => {
  renderStoreCart();

  document.getElementById("pay-store-cart")?.addEventListener("click", async () => {
    try {
      await startStoreCheckout(12000);
    } catch (error) {
      console.error(error);
      alert(error.message || "No se pudo iniciar el pago.");
    }
  });

  document.getElementById("clear-store-cart")?.addEventListener("click", () => {
    clearStoreCart();
    renderStoreCart();
  });
});

window.getStoreCart = getStoreCart;
window.saveStoreCart = saveStoreCart;
window.clearStoreCart = clearStoreCart;
window.addToStoreCart = addToStoreCart;
window.removeStoreCartItem = removeStoreCartItem;
window.startStoreCheckout = startStoreCheckout;
