const cartKey = "dingdong_course_cart";

function money(value) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value || 0);
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(cartKey)) || [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(cartKey, JSON.stringify(items));
  renderMiniCart();
}

function addToCart(course) {
  const cart = getCart();
  const exists = cart.find(item => item.id === course.id);
  if (exists) {
    alert("Ese curso ya está en el carrito.");
    return;
  }
  cart.push(course);
  saveCart(cart);
}

function removeFromCart(courseId) {
  const cart = getCart().filter(item => item.id !== courseId);
  saveCart(cart);
}

function renderMiniCart() {
  const cart = getCart();
  const container = document.getElementById("mini-cart");
  const totalEl = document.getElementById("mini-cart-total");
  const countEl = document.getElementById("mini-cart-count");

  if (!container) return;

  if (countEl) countEl.textContent = String(cart.length);
  if (!cart.length) {
    container.innerHTML = "<p>No has agregado cursos.</p>";
    if (totalEl) totalEl.textContent = money(0);
    return;
  }

  let total = 0;
  container.innerHTML = cart.map(item => {
    total += Number(item.price || 0);
    return `
      <div class="cart-row">
        <div>
          <strong>${item.title}</strong>
          <div>${money(item.price)}</div>
        </div>
        <button onclick="removeFromCart('${item.id}')">Quitar</button>
      </div>
    `;
  }).join("");

  if (totalEl) totalEl.textContent = money(total);
}

async function renderCatalog() {
  const container = document.getElementById("courses-grid");
  if (!container) return;
  container.innerHTML = "<p>Cargando cursos...</p>";

  try {
    const snapshot = await db.collection("cursos").where("activo", "==", true).get();
    if (snapshot.empty) {
      container.innerHTML = "<p>No hay cursos disponibles.</p>";
      return;
    }

    const items = [];
    snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data() }));

    container.innerHTML = items.map(course => {
      const safeCourse = JSON.stringify({ id: course.id, title: course.title, price: course.price }).replace(/'/g, "&#39;");
      return `
        <article class="course-card">
          <img src="${course.thumbnailUrl || '../img/cursoCactus.png'}" alt="${course.title}">
          <div class="course-body">
            <h3>${course.title}</h3>
            <p>${course.shortDescription || ''}</p>
            <div class="course-meta"><strong>${money(course.price)}</strong></div>
            <button onclick='addToCart(${safeCourse})'>Agregar</button>
          </div>
        </article>
      `;
    }).join("");
  } catch (error) {
    console.error(error);
    container.innerHTML = "<p>No fue posible cargar el catálogo.</p>";
  }
}

async function protectPage() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged(async user => {
      if (!user) {
        window.location.href = "login.html";
        return;
      }
      const emailEl = document.getElementById("user-email");
      if (emailEl) emailEl.textContent = user.email || "";
      resolve(user);
    });
  });
}

function goCheckout() {
  const cart = getCart();
  if (!cart.length) {
    alert("Agrega al menos un curso.");
    return;
  }
  window.location.href = "checkout.html";
}

window.addEventListener("DOMContentLoaded", async () => {
  await protectPage();
  await renderCatalog();
  renderMiniCart();
});

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.goCheckout = goCheckout;
