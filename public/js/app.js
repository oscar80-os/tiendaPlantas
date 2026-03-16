let cart = [];
let products = [];
let searchTerm = "";
let selectedPayment = null;

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadCart();
  initializeSocialButtons();

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchTerm = e.target.value.toLowerCase().trim();
      applyFiltersAndSearch();
    });
  }
});

function initializeSocialButtons() {
  const socialButtons = document.querySelectorAll(
    ".social-header a, .footer-social a, .social-connect-btn, .whatsapp-float, .social-menu-item"
  );

  socialButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const network = btn.title || btn.classList[1] || "social";
      console.log(`Click en ${network}`);
    });
  });
}

async function loadProducts() {
  try {
    if (typeof db !== "undefined") {
      const snapshot = await db.collection("products").get();
      products = [];
      snapshot.forEach((doc) => {
        products.push({
          id: doc.id,
          ...doc.data()
        });
      });

      if (!products.length) {
        loadSampleProducts();
      }
    } else {
      loadSampleProducts();
    }
  } catch (error) {
    console.error("Error cargando productos:", error);
    loadSampleProducts();
  }

  applyFiltersAndSearch();
}

function loadSampleProducts() {
  products = [
    { id: "1", name: "Helecho Boston", description: "Planta de interior de fácil cuidado", price: 75000, category: "plantas", image: "./img/helechoboston.png" },
    { id: "2", name: "Matera Artesanal", description: "Matera de barro hecha a mano", price: 45000, category: "materas", image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400" },
    { id: "3", name: "Estante Flotante", description: "Estante de madera de pino", price: 85000, category: "madera", image: "./img/estanteflotante.png" },
    { id: "4", name: "Suculenta Echeveria", description: "Suculenta de fácil cuidado", price: 15000, category: "plantas", image: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400" },
    { id: "5", name: "Maceta Colgante", description: "Maceta de cerámica con diseño moderno", price: 78000, category: "materas", image: "./img/materacolgante.png" },
    { id: "6", name: "Banco de Jardín", description: "Banco de madera tratada para exterior", price: 380000, category: "madera", image: "./img/bancojardin.png" },
    { id: "7", name: "Matera Blanca Oro", description: "Matera barro pintada de 40 cm x 60 cm", price: 120000, category: "materas", image: "./img/materablancaoro.png" },
    { id: "8", name: "Matera Indígena Azul", description: "Matera barro pintada de 40 cm x 60 cm", price: 120000, category: "materas", image: "./img/materaindigenaazul.png" },
    { id: "9", name: "Estante pino canadiense", description: "Estante de madera para materas", price: 250000, category: "madera", image: "./img/estantenelson.png" },
    { id: "10", name: "Estante metal amarillo", description: "Estante perfecto para tus materas", price: 345000, category: "forja", image: "./img/estanteAmarillo.png" },
    { id: "11", name: "Estante doble colores surtidos", description: "Decora tu pared con estos estantes", price: 245000, category: "forja", image: "./img/estanteDoble.png" },
    { id: "12", name: "Estante metal amarillo pared", description: "Estante perfecto para tus materas", price: 185000, category: "forja", image: "./img/estantePared.png" },
    { id: "13", name: "Estante metal colores", description: "Estantes unitarios con colores surtidos", price: 365000, category: "forja", image: "./img/estantePared2.png" },
    { id: "14", name: "Estante combinado", description: "Estante perfecto para tus materas", price: 285000, category: "forja", image: "./img/estantePared3.png" },
    { id: "15", name: "Estante metal rojo", description: "Estante perfecto para tus materas", price: 345000, category: "forja", image: "./img/estanteRojo.png" },
    { id: "16", name: "Curso cactus y suculentas", description: "Aprende todo sobre tus cactus y suculentas", price: 120000, category: "cursos", image: "./img/cursoCactus.png" },
    { id: "17", name: "Curso Bonsái", description: "Aprende todo sobre el bonsái y sus cuidados", price: 150000, category: "cursos", image: "./img/cursoBonsai1.png" },
    { id: "18", name: "Curso Plantas Exterior", description: "Aprende a plantar tu jardín", price: 120000, category: "cursos", image: "./img/cursoExterior.png" }
  ];
}

function applyFiltersAndSearch() {
  const activeFilter = document.querySelector(".filter-btn.active");
  let category = "todos";

  if (activeFilter) {
    const filterText = activeFilter.textContent.toLowerCase();
    if (filterText === "plantas") category = "plantas";
    else if (filterText === "materas") category = "materas";
    else if (filterText === "madera") category = "madera";
    else if (filterText === "forja") category = "forja";
    else if (filterText === "cursos") category = "cursos";
  }

  let filtered = products;

  if (category !== "todos") {
    filtered = filtered.filter((p) => p.category === category);
  }

  if (searchTerm) {
    filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm)
    );
  }

  displayProducts(filtered);
}

function displayProducts(productsToShow) {
  const container = document.getElementById("products-container");
  if (!container) return;

  container.innerHTML = "";

  if (!productsToShow.length) {
    container.innerHTML = '<p style="text-align:center; grid-column:1/-1; padding:2rem;">No se encontraron productos.</p>';
    return;
  }

  productsToShow.forEach((product) => {
    const productCard = document.createElement("div");
    productCard.className = "product-card";

    const whatsappMessage = encodeURIComponent(
      `Hola Ding-Dong, me interesa el producto: ${product.name} - $${product.price.toLocaleString()}\n\nDescripción: ${product.description}\n¿Podrían darme más información?`
    );
    const whatsappUrl = `https://wa.me/573136254423?text=${whatsappMessage}`;

    const extraButton = product.category === "cursos"
      ? `<a href="./cursos/login.html" class="btn-primary" style="margin-top:10px; display:inline-block;">Ingresar a cursos</a>`
      : "";

    productCard.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="product-description">${product.description}</p>
        <p class="product-price">$${product.price.toLocaleString()}</p>
        <button class="add-to-cart" onclick="addToCart('${product.id}')">
          Agregar al carrito
        </button>
        <a href="${whatsappUrl}" target="_blank" class="whatsapp-product">
          Consultar por WhatsApp
        </a>
        ${extraButton}
      </div>
    `;

    container.appendChild(productCard);
  });
}

function filterProducts(category) {
  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach((btn) => {
    btn.classList.remove("active");
    if (
      btn.textContent.toLowerCase().includes(category) ||
      (category === "todos" && btn.textContent === "Todos")
    ) {
      btn.classList.add("active");
    }
  });

  applyFiltersAndSearch();
}

function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;

  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  updateCart();
  saveCart();
  showNotification("Producto agregado al carrito");
}

function updateCart() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCount = document.getElementById("cart-count");
  if (cartCount) cartCount.textContent = totalItems;

  const cartItems = document.getElementById("cart-items");
  if (!cartItems) return;

  cartItems.innerHTML = "";
  let total = 0;

  cart.forEach((item) => {
    total += item.price * item.quantity;

    const cartItem = document.createElement("div");
    cartItem.className = "cart-item";
    cartItem.innerHTML = `
      <img src="${item.image}" alt="${item.name}" loading="lazy">
      <div class="cart-item-info">
        <div class="cart-item-title">${item.name}</div>
        <div class="cart-item-price">$${item.price.toLocaleString()}</div>
        <div class="cart-item-quantity">
          <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
          <span>${item.quantity}</span>
          <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
          <i class="fas fa-trash remove-item" onclick="removeFromCart('${item.id}')" title="Eliminar"></i>
        </div>
      </div>
    `;
    cartItems.appendChild(cartItem);
  });

  const cartTotal = document.getElementById("cart-total");
  if (cartTotal) cartTotal.textContent = `$${total.toLocaleString()}`;
}

function updateQuantity(productId, change) {
  const item = cart.find((i) => i.id === productId);
  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    removeFromCart(productId);
  } else {
    updateCart();
    saveCart();
  }
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  updateCart();
  saveCart();
  showNotification("Producto eliminado del carrito");
}

function toggleCart() {
  const cartSidebar = document.getElementById("cart-sidebar");
  if (!cartSidebar) return;

  cartSidebar.classList.toggle("active");
  document.body.style.overflow = cartSidebar.classList.contains("active") ? "hidden" : "auto";
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function loadCart() {
  const savedCart = localStorage.getItem("cart");
  if (!savedCart) return;

  try {
    cart = JSON.parse(savedCart);
    updateCart();
  } catch {
    cart = [];
  }
}

function showNotification(message) {
  const existing = document.querySelectorAll(".notification");
  existing.forEach((n) => n.remove());

  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: #2e7d32;
    color: white;
    padding: 1rem 2rem;
    border-radius: 5px;
    z-index: 1002;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  `;

  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 2500);
}

function openPaymentModal() {
  if (!cart.length) {
    alert("Tu carrito está vacío");
    return;
  }

  const modal = document.getElementById("payment-modal");
  if (modal) modal.style.display = "flex";
}

function togglePaymentModal() {
  const modal = document.getElementById("payment-modal");
  if (modal) modal.style.display = "none";

  const instructions = document.getElementById("payment-instructions");
  const confirmBtn = document.getElementById("confirm-payment-btn");

  if (instructions) instructions.style.display = "none";
  if (confirmBtn) confirmBtn.style.display = "none";

  document.querySelectorAll(".payment-option").forEach((opt) => opt.classList.remove("selected"));
  selectedPayment = null;
}

function selectPayment(method) {
  document.querySelectorAll(".payment-option").forEach((opt) => opt.classList.remove("selected"));
  if (window.event?.currentTarget) {
    window.event.currentTarget.classList.add("selected");
  }

  selectedPayment = method;

  const instructionsDiv = document.getElementById("payment-instructions");
  const instructionText = document.getElementById("instruction-text");
  const confirmBtn = document.getElementById("confirm-payment-btn");

  if (instructionText) {
    instructionText.textContent = `Método seleccionado: ${method}`;
  }

  if (instructionsDiv) instructionsDiv.style.display = "block";
  if (confirmBtn) confirmBtn.style.display = "block";
}

function confirmPayment() {
  if (!selectedPayment) {
    alert("Selecciona un método de pago.");
    return;
  }

  let message = "Hola Ding-Dong, quiero realizar el siguiente pedido:%0A%0A";
  let total = 0;

  cart.forEach((item) => {
    total += item.price * item.quantity;
    message += `• ${item.name} x${item.quantity} - $${(item.price * item.quantity).toLocaleString()}%0A`;
  });

  message += `%0A💰 TOTAL: $${total.toLocaleString()}%0A`;
  message += `%0AMétodo de pago: ${selectedPayment}`;

  window.open(`https://wa.me/573136254423?text=${message}`, "_blank");

  cart = [];
  updateCart();
  saveCart();
  togglePaymentModal();
  showNotification("Pedido enviado por WhatsApp");
}

function toggleSocialMenu() {
  const menu = document.getElementById("socialMenu");
  const btn = document.getElementById("socialMainBtn");
  if (!menu || !btn) return;

  menu.classList.toggle("active");
  btn.classList.toggle("active");
}

function trackSocialClick(network) {
  console.log(`Click en ${network}`);
}

window.addToCart = addToCart;
window.filterProducts = filterProducts;
window.toggleCart = toggleCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.toggleSocialMenu = toggleSocialMenu;
window.trackSocialClick = trackSocialClick;
window.openPaymentModal = openPaymentModal;
window.togglePaymentModal = togglePaymentModal;
window.selectPayment = selectPayment;
window.confirmPayment = confirmPayment;
