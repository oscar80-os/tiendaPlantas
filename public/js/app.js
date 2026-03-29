let cart = [];
let products = [];
let searchTerm = "";
let selectedPayment = null;

function ensureFallbackProducts() {
  return [
    { id: "1", name: "Helecho Boston", description: "Planta de interior de fácil cuidado", price: 75000, category: "plantas", image: "./img/helechoboston.png" },
    { id: "2", name: "Matera Artesanal", description: "Matera de barro hecha a mano", price: 45000, category: "materas", image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400" },
    { id: "3", name: "Estante Flotante", description: "Estante de madera de pino", price: 85000, category: "madera", image: "./img/estanteflotante.png" },
    { id: "4", name: "Jarra ", description: "Pintada a mano unica y exclusiva", price: 55000, category: "materas", image: "./img/jarraPequeña.png" },
    { id: "5", name: "Pesebres", description: "Jarrones tipo pesebre", price: 49000 , category: "materas", image: "./img/jarronesPesebre.png" },
    { id: "6", name: "Arbol de tazas", description: "Tazas con soporte artesania unica", price: 65000, category: "materas", image: "./img/arbolTazas.png" },
    { id: "7", name: "Arbol tazas", description: "Arbol tazas Ding-Dong, pintadas a mano", price: 68000, category: "materas", image: "./img/arbolTazazDing.png" },
    { id: "8", name: "Cafetera", description: "Cafetera Ding-Dong", price: 45000, category: "materas", image: "./img/cafetera.png" },
    { id: "9", name: "Matera", description: "Matera maripoza,en barro y pintada a mano", price: 49000, category: "materas", image: "./img/materaMaripoza.png" },
    { id: "10", name: "Pocillo", description: "Pocillo Ding-Dong", price: 30000, category: "materas", image: "./img/taza.png" },
    { id: "11", name: "Taza", description: "Taza Ding-Dong pintada a mano", price: 25000, category: "materas", image: "./img/tazasSinOrejas.png" },
    { id: "12", name: "Azucareras", description: "Azucareras Ding-Dong pintada a mano", price: 25000, category: "materas", image: "./img/tazaTapa.png" },
    { id: "13", name: "Arturio Rojo ", description: "Este Anturio Rojo requiere riego moderado y prefiere la semi luz. Es una planta con flor que alcanza una altura promedio de 50 cm y puede llegar hasta los 70 cm a los 2 años. Se recomienda fertilizar cada 15 días y no exponerla directamente al sol.", price: 45000, category: "plantas", image: "./img/anturioRojo.png" },
    { id: "14", name: "Arbol de Jade", description: "Es ideal para quienes buscan una planta de bajo mantenimiento. Requiere riego escaso y prefiere la exposición directa al sol.  Su altura promedio es de 80 cm. Se recomienda plantarlo a una distancia de 50 cm.", price: 35000, category: "plantas", image: "./img/arbolJade.png" },
    { id: "15", name: "Cinata", description: "Purificadora de aire: Es excelente para eliminar contaminantes del hogar como el monóxido de carbono y el formaldehído.", price: 48000, category: "plantas", image: "./img/cinta.png" },
    { id: "16", name: "Cuerno de Alce", description: "Requiere luz brillante indirecta. Evita el sol directo, ya que sus hojas son muy sensibles y pueden quemarse fácilmente, apareciendo manchas negras o amarillentas.", price: 40000, category: "plantas", image: "./img/cuernoDeAlce.png" },
    { id: "17", name: "Espatifilo", description: "Conocido también como cuna de Moisés o lirio de la paz, es una de las plantas de interior más completas: es elegante, purifica el aire y es sorprendentemente resistente. ", price: 55000, category: "plantas", image: "./img/espatifilo.png" },
    { id: "18", name: "Jeranios Rojos", description: "Son los reyes de los balcones y terrazas gracias a su color vibrante y su resistencia extrema al sol. Simbolizan fuerza y protección, y son ideales para dar un toque mediterráneo a cualquier espacio exterior.", price: 65000, category: "plantas", image: "./img/geraniosRojos.png" },
    { id: "19", name: "Planta de Jade", description: "También conocida como árbol de la abundancia o del dinero, es una de las suculentas más apreciadas en el mundo por su longevidad y su asociación con la prosperidad en el Feng Shui. ", price: 39000, category: "plantas", image: "./img/jade.png" },
    { id: "20", name: "Lavanda ", description: "Planta aromática mediterránea sumamente valorada por su fragancia relajante, su color púrpura vibrante y su capacidad para atraer polinizadores como abejas y mariposas. Es una especie rústica que, aunque fácil de cuidar, requiere condiciones específicas de luz y drenaje para no morir", price: 45000, category: "plantas", image: "./img/lavanda.png" },
    { id: "21", name: "Lengua de Suegra", description: "También conocida como planta de serpiente o espada de San Jorge, es probablemente la planta de interior más resistente que existe. Es la opción ideal para principiantes o personas con poco tiempo, ya que es casi indestructible.", price: 45000, category: "plantas", image: "./img/LenguaSuegra.png" },
    { id: "22", name: "Costilla de Adán ", description: "Es una planta trepadora de la selva tropical que destaca por los agujeros naturales de sus hojas (fenestraciones), que permiten que la luz y el viento pasen a través de ellas sin romperlas.", price: 42000, category: "plantas", image: "./img/Monstera.png" },
    { id: "23", name: "El Potos ", description: "Es la planta de interior por excelencia: es casi imposible de matar, crece rapidísimo y queda espectacular colgando de estantes o trepando por las paredes. ", price: 35000, category: "plantas", image: "./img/potos.png" },
    { id: "24", name: "Suculentas ", description: "son plantas fascinantes que almacenan agua en sus hojas, tallos o raíces, lo que las hace extremadamente resistentes a la sequía. Son ideales para interiores y exteriores debido a su gran variedad de formas, colores y facilidad de mantenimiento.", price: 55000, category: "plantas", image: "./img/suculentas.png" },
    { id: "25", name: "Soporte Pared ", description: "Elegante ,sutil el negro en la madera es perfecto para esa pared que quieres adornar ", price: 55000, category: "madera", image: "./img/dosNe.jpeg" },
{ id: "26", name: "Esquinero ", description: "Del color que quieras , perfecto para darle tu toque a esos espacios especiales", price: 180000, category: "madera", image: "./img/esquineroB.jpeg" },
{ id: "27", name: "Esquinero ", description: "Del color que quieras , perfecto para darle tu toque a esos espacios especiales", price: 180000, category: "madera", image: "./img/esquineroM.jpeg" },
{ id: "28", name: "Esquinero ", description: "Cree un ambiente elegante y moderno en la sala de estar con un color de pintura negro nítido.", price: 180000, category: "madera", image: "./img/esquineroN.jpeg" },
{ id: "29", name: "Butaco", description: "Pada dos materas, minimalista perfecto para cualquier espacio", price: 110000, category: "madera", image: "./img/soDos.jpeg" },
{ id: "30", name: "Soporte ", description: "Para esas suculentas que tanto te gustan", price: 60000, category: "madera", image: "./img/soP.jpeg" },
{ id: "31", name: "Soporte ", description: "Queda elegante para tu sala y balcon ", price: 75000, category: "madera", image: "./img/soUno.jpeg" },
{ id: "32", name: "Bancos ", description: "Bancos para darle ese toque especial, en tu jardin", price: 125000, category: "madera", image: "./img/btres.jpeg" },
{ id: "33", name: "Butaco ", description: "Esa matera que te gusta , espera este butaco. ¡Espectacular!.", price: 65000, category: "madera", image: "./img/soU.jpeg" },

  ];
}

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadCart();

  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchTerm = e.target.value.toLowerCase().trim();
      applyFiltersAndSearch();
    });
  }
});

async function loadProducts() {
  try {
    const response = await fetch("./productos.json");
    if (response.ok) {
      products = await response.json();
    }
  } catch (error) {
    console.warn("No se pudo cargar productos.json, usando productos de respaldo.", error);
  }

  if (!products.length) {
    products = ensureFallbackProducts();
  }

  applyFiltersAndSearch();
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
    else if (filterText === "cerería") category = "cerería";
  }

  let filtered = products;
  if (category !== "todos") filtered = filtered.filter(p => p.category === category);
  if (searchTerm) {
    filtered = filtered.filter((p) =>
      (p.name || "").toLowerCase().includes(searchTerm) ||
      (p.description || "").toLowerCase().includes(searchTerm)
    );
  }
  displayProducts(filtered);
}

function displayProducts(items) {
  const container = document.getElementById("products-container");
  if (!container) return;
  container.innerHTML = "";
  if (!items.length) {
    container.innerHTML = '<p style="text-align:center; grid-column:1/-1; padding:2rem;">No se encontraron productos.</p>';
    return;
  }

  items.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";

    const whatsappMessage = encodeURIComponent(
      `Hola Ding-Dong, me interesa el producto: ${product.name} - $${Number(product.price || 0).toLocaleString('es-CO')}`
    );
    const whatsappUrl = `https://wa.me/573136254423?text=${whatsappMessage}`;
    const extraButton = product.category === "cursos"
      ? `<a href="./cursos/login.html" class="btn-primary" style="margin-top:10px; display:inline-block;">Ingresar a cursos</a>`
      : "";

    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="product-description">${product.description || ''}</p>
        <p class="product-price">$${Number(product.price || 0).toLocaleString('es-CO')}</p>
        <button class="add-to-cart" onclick="addToCart('${product.id}')">Agregar al carrito</button>
        <a href="${whatsappUrl}" target="_blank" class="whatsapp-product">Consultar por WhatsApp</a>
        ${extraButton}
      </div>
    `;
    container.appendChild(card);
  });
}

function filterProducts(category) {
  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach((btn) => {
    btn.classList.remove("active");
    if ((category === "todos" && btn.textContent === "Todos") || btn.textContent.toLowerCase().includes(category)) {
      btn.classList.add("active");
    }
  });
  applyFiltersAndSearch();
}

function addToCart(productId) {
  const product = products.find((p) => p.id === productId);
  if (!product) return;
  const existingItem = cart.find((item) => item.id === productId);
  if (existingItem) existingItem.quantity += 1;
  else cart.push({ ...product, quantity: 1 });
  updateCart();
  saveCart();
  showNotification("Producto agregado al carrito");
}

function updateCart() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCount = document.getElementById("cart-count");
  if (cartCount) cartCount.textContent = String(totalItems);
  const cartItems = document.getElementById("cart-items");
  if (!cartItems) return;
  cartItems.innerHTML = "";
  let total = 0;
  cart.forEach((item) => {
    total += Number(item.price || 0) * item.quantity;
    const row = document.createElement("div");
    row.className = "cart-item";
    row.innerHTML = `
      <img src="${item.image}" alt="${item.name}" loading="lazy">
      <div class="cart-item-info">
        <div class="cart-item-title">${item.name}</div>
        <div class="cart-item-price">$${Number(item.price || 0).toLocaleString('es-CO')}</div>
        <div class="cart-item-quantity">
          <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
          <span>${item.quantity}</span>
          <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
          <i class="fas fa-trash remove-item" onclick="removeFromCart('${item.id}')" title="Eliminar"></i>
        </div>
      </div>`;
    cartItems.appendChild(row);
  });
  const cartTotal = document.getElementById("cart-total");
  if (cartTotal) cartTotal.textContent = `$${total.toLocaleString('es-CO')}`;
}

function updateQuantity(productId, change) {
  const item = cart.find((i) => i.id === productId);
  if (!item) return;
  item.quantity += change;
  if (item.quantity <= 0) removeFromCart(productId);
  else {
    updateCart();
    saveCart();
  }
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  updateCart();
  saveCart();
}

function toggleCart() {
  const sidebar = document.getElementById("cart-sidebar");
  if (!sidebar) return;
  sidebar.classList.toggle("active");
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function loadCart() {
  try {
    cart = JSON.parse(localStorage.getItem("cart")) || [];
  } catch {
    cart = [];
  }
  updateCart();
}

function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  notification.style.cssText = `position:fixed;top:80px;right:20px;background:#2e7d32;color:#fff;padding:1rem 2rem;border-radius:5px;z-index:1002;box-shadow:0 4px 8px rgba(0,0,0,.2);`;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 2500);
}

function openPaymentModal() {
  const modal = document.getElementById("payment-modal");
  if (modal) modal.style.display = "flex";
}
function togglePaymentModal() {
  const modal = document.getElementById("payment-modal");
  if (modal) modal.style.display = "none";
}
function selectPayment(method) {
  selectedPayment = method;
  const instructions = document.getElementById("payment-instructions");
  const text = document.getElementById("instruction-text");
  const button = document.getElementById("confirm-payment-btn");
  if (instructions && text && button) {
    instructions.style.display = "block";
    button.style.display = "block";
    text.textContent = `Método seleccionado: ${method}. En esta tienda los pedidos físicos se coordinan por WhatsApp.`;
  }
}
function confirmPayment() {
  window.open('https://wa.me/573136254423?text=Hola%20Ding-Dong,%20quiero%20finalizar%20mi%20compra', '_blank');
}
function toggleSocialMenu() {
  const menu = document.getElementById("socialMenu");
  const btn = document.getElementById("socialMainBtn");
  if (menu) menu.classList.toggle("active");
  if (btn) btn.classList.toggle("active");
}
function trackSocialClick() {}

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
