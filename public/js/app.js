let cart = [];
let products = [];
let searchTerm = "";

const STORE_CART_KEY = "dingdong_store_cart";
const FALLBACK_IMAGE = "./img/logoSinFondo1.png";

function normalizeCategory(category) {
  return String(category || "").trim().toLowerCase();
}

function safeText(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function money(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(safeNumber(value, 0));
}

function getStoredCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_CART_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error leyendo carrito:", error);
    return [];
  }
}

function saveCart() {
  localStorage.setItem(STORE_CART_KEY, JSON.stringify(cart));
}

function loadCart() {
  cart = getStoredCart().map((item) => ({
    id: safeText(item.id || item.productoId),
    productoId: safeText(item.productoId || item.id),
    name: safeText(item.name || item.nombre, "Producto"),
    nombre: safeText(item.nombre || item.name, "Producto"),
    description: safeText(item.description || item.descripcion),
    descripcion: safeText(item.descripcion || item.description),
    price: safeNumber(item.price ?? item.precio, 0),
    precio: safeNumber(item.precio ?? item.price, 0),
    image: safeText(item.image || item.imagen, FALLBACK_IMAGE),
    imagen: safeText(item.imagen || item.image, FALLBACK_IMAGE),
    category: normalizeCategory(item.category || item.categoria),
    categoria: normalizeCategory(item.categoria || item.category),
    quantity: Math.max(1, safeNumber(item.quantity ?? item.cantidad, 1)),
    cantidad: Math.max(1, safeNumber(item.cantidad ?? item.quantity, 1))
  }));

  updateCart();
}

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadCart();
  bindSearch();
  bindFilterButtons();
});

function bindSearch() {
  const searchInput = document.getElementById("search-input");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    searchTerm = String(e.target.value || "").toLowerCase().trim();
    applyFiltersAndSearch();
  });
}

function bindFilterButtons() {
  const buttons = document.querySelectorAll(".filter-btn");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyFiltersAndSearch();
    });
  });
}

async function loadProducts() {
  if (typeof db === "undefined" || !db) {
    console.error("Firestore no está inicializado. Revisa firebase-config.js");
    products = [];
    applyFiltersAndSearch();
    return;
  }

  try {
    const snapshot = await db
      .collection("productos")
      .where("activo", "==", true)
      .get();

    products = [];

    snapshot.forEach((doc) => {
      const data = doc.data();

      products.push({
        id: doc.id,
        name: safeText(data.nombre, "Producto"),
        description: safeText(data.descripcion),
        price: safeNumber(data.precio, 0),
        category: normalizeCategory(data.categoria),
        image: safeText(data.imagen, FALLBACK_IMAGE),
        stock: safeNumber(data.stock, 999)
      });
    });

    console.log("Productos cargados desde Firestore:", products);
  } catch (error) {
    console.error("Error cargando productos desde Firestore:", error);
    products = [];
  }

  applyFiltersAndSearch();
}

function getActiveCategory() {
  const activeFilter = document.querySelector(".filter-btn.active");
  if (!activeFilter) return "todos";

  const dataCategory = normalizeCategory(activeFilter.dataset.category);
  if (dataCategory) return dataCategory;

  const filterText = safeText(activeFilter.textContent).toLowerCase();

  if (filterText.includes("plantas")) return "plantas";
  if (filterText.includes("materas")) return "materas";
  if (filterText.includes("madera")) return "madera";
  if (filterText.includes("metal")) return "metal";
  if (filterText.includes("cursos")) return "cursos";

  return "todos";
}

function applyFiltersAndSearch() {
  const category = getActiveCategory();
  let filtered = [...products];

  if (category !== "todos") {
    filtered = filtered.filter((p) => normalizeCategory(p.category) === category);
  }

  if (searchTerm) {
    filtered = filtered.filter((p) =>
      safeText(p.name).toLowerCase().includes(searchTerm) ||
      safeText(p.description).toLowerCase().includes(searchTerm)
    );
  }

  displayProducts(filtered);
}

function buildWhatsAppUrl(product) {
  const whatsappMessage = encodeURIComponent(
    `Hola Ding-Dong, me interesa el producto: ${product.name} - ${money(product.price)}`
  );
  return `https://wa.me/573136254423?text=${whatsappMessage}`;
}

function displayProducts(items) {
  const container = document.getElementById("products-container");
  if (!container) return;

  container.innerHTML = "";

  if (!items.length) {
    container.innerHTML =
      '<p style="text-align:center; grid-column:1/-1; padding:2rem;">No se encontraron productos.</p>';
    return;
  }

  items.forEach((product) => {
    const stockDisponible = safeNumber(product.stock, 999) > 0;

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img
        src="${product.image || FALLBACK_IMAGE}"
        alt="${product.name}"
        class="product-image"
        loading="lazy"
        onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';"
      >
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="product-description">${product.description || ""}</p>
        <p class="product-price">${money(product.price)}</p>

        <button
          class="add-to-cart"
          onclick="addToCart('${product.id}')"
          ${!stockDisponible ? "disabled" : ""}
          style="${!stockDisponible ? "opacity:.6;cursor:not-allowed;" : ""}"
        >
          ${stockDisponible ? "Agregar al carrito" : "Sin stock"}
        </button>

        <a href="${buildWhatsAppUrl(product)}" target="_blank" rel="noopener noreferrer" class="whatsapp-product">
          Consultar por WhatsApp
        </a>
      </div>
    `;

    container.appendChild(card);
  });
}

function filterProducts(category) {
  const normalized = normalizeCategory(category);
  const buttons = document.querySelectorAll(".filter-btn");

  buttons.forEach((btn) => {
    btn.classList.remove("active");

    const text = safeText(btn.textContent).toLowerCase().trim();
    const btnCategory = normalizeCategory(btn.dataset.category || "");

    if (
      (normalized === "todos" && (text === "todos" || btnCategory === "todos")) ||
      btnCategory === normalized ||
      text.includes(normalized)
    ) {
      btn.classList.add("active");
    }
  });

  applyFiltersAndSearch();
}

function addToCart(productId) {
  const product = products.find((p) => String(p.id) === String(productId));
  if (!product) return;

  if (safeNumber(product.stock, 999) <= 0) {
    showNotification("Este producto no tiene stock disponible");
    return;
  }

  const existingItem = cart.find((item) => String(item.id) === String(productId));

  if (existingItem) {
    existingItem.quantity += 1;
    existingItem.cantidad = existingItem.quantity;
  } else {
    cart.push({
      id: String(product.id),
      productoId: String(product.id),
      name: product.name,
      nombre: product.name,
      description: product.description || "",
      descripcion: product.description || "",
      price: safeNumber(product.price, 0),
      precio: safeNumber(product.price, 0),
      image: product.image || FALLBACK_IMAGE,
      imagen: product.image || FALLBACK_IMAGE,
      category: product.category || "",
      categoria: product.category || "",
      quantity: 1,
      cantidad: 1
    });
  }

  updateCart();
  saveCart();
  showNotification("Producto agregado al carrito");
}

function updateCart() {
  const totalItems = cart.reduce((sum, item) => sum + safeNumber(item.quantity, 0), 0);

  const cartCount = document.getElementById("cart-count");
  if (cartCount) cartCount.textContent = String(totalItems);

  const cartItems = document.getElementById("cart-items");
  if (!cartItems) return;

  cartItems.innerHTML = "";
  let total = 0;

  if (!cart.length) {
    cartItems.innerHTML = `
      <p style="color:#6b7280;text-align:center;padding:24px 10px;">
        Tu carrito está vacío.
      </p>
    `;
  }

  cart.forEach((item) => {
    const quantity = safeNumber(item.quantity ?? item.cantidad, 0);
    const price = safeNumber(item.price ?? item.precio, 0);
    const subtotal = price * quantity;

    total += subtotal;

    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <img
        src="${item.image || item.imagen || FALLBACK_IMAGE}"
        alt="${item.name || item.nombre || "Producto"}"
        loading="lazy"
        onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}';"
      >
      <div class="cart-item-info">
        <div class="cart-item-title">${item.name || item.nombre || "Producto"}</div>
        <div class="cart-item-price">${money(price)}</div>
        <div class="cart-item-quantity">
          <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
          <span>${quantity}</span>
          <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
          <i class="fas fa-trash remove-item" onclick="removeFromCart('${item.id}')" title="Eliminar"></i>
        </div>
      </div>
    `;
    cartItems.appendChild(row);
  });

  const cartTotal = document.getElementById("cart-total");
  if (cartTotal) {
    cartTotal.textContent = money(total);
  }
}

function updateQuantity(productId, change) {
  const item = cart.find((i) => String(i.id) === String(productId));
  if (!item) return;

  item.quantity = safeNumber(item.quantity, 1) + safeNumber(change, 0);
  item.cantidad = item.quantity;

  if (item.quantity <= 0) {
    removeFromCart(productId);
  } else {
    updateCart();
    saveCart();
  }
}

function removeFromCart(productId) {
  cart = cart.filter((item) => String(item.id) !== String(productId));
  updateCart();
  saveCart();
}

function toggleCart() {
  const sidebar = document.getElementById("cart-sidebar");
  const overlay = document.getElementById("cart-overlay");

  if (sidebar) sidebar.classList.toggle("active");
  if (overlay) overlay.classList.toggle("active");
}

function goToStoreCart() {
  window.location.href = "/tienda/carrito.html";
}

function goToCheckout() {
  if (!cart.length) {
    showNotification("Tu carrito está vacío");
    return;
  }

  window.location.href = "/tienda/carrito.html";
}

function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: #2e7d32;
    color: #fff;
    padding: 1rem 2rem;
    border-radius: 5px;
    z-index: 1002;
    box-shadow: 0 4px 8px rgba(0,0,0,.2);
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 2500);
}

function confirmPayment() {
  goToCheckout();
}

function toggleSocialMenu() {
  const menu = document.getElementById("socialMenu");
  const btn = document.getElementById("socialMainBtn");
  if (menu) menu.classList.toggle("active");
  if (btn) btn.classList.toggle("active");
}

function trackSocialClick() {
  // reservado
}

window.addToCart = addToCart;
window.filterProducts = filterProducts;
window.toggleCart = toggleCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.toggleSocialMenu = toggleSocialMenu;
window.trackSocialClick = trackSocialClick;
window.confirmPayment = confirmPayment;
window.goToStoreCart = goToStoreCart;
window.goToCheckout = goToCheckout;
