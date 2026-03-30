const coursesCartKey = "dingdong_course_cart";
const pendingOrderKey = "dingdong_pending_order";

function money(value) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(coursesCartKey)) || [];
  } catch (error) {
    console.error("Error leyendo carrito:", error);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(coursesCartKey, JSON.stringify(cart));
}

function clearCart() {
  localStorage.removeItem(coursesCartKey);
}

function setPendingOrder(data) {
  localStorage.setItem(pendingOrderKey, JSON.stringify(data));
}

function clearPendingOrder() {
  localStorage.removeItem(pendingOrderKey);
}

function isInCart(courseId) {
  const cart = getCart();
  return cart.some((item) => item.id === courseId);
}

function updateCartCount() {
  const cart = getCart();
  const badge = document.getElementById("cart-count");
  if (badge) {
    badge.textContent = String(cart.length);
  }
}

async function requireAuth() {
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

function getCourseCardTemplate(course) {
  const inCart = isInCart(course.id);

  return `
    <article class="course-card" style="background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 24px rgba(0,0,0,.08);display:flex;flex-direction:column;">
      <img
        src="${course.thumbnailUrl || "/img/cursoCactus.png"}"
        alt="${course.title || "Curso"}"
        style="width:100%;height:220px;object-fit:cover;"
      />

      <div style="padding:18px;display:flex;flex-direction:column;gap:12px;flex:1;">
        <h3 style="margin:0;font-size:22px;color:#1f2937;">
          ${course.title || "Curso sin título"}
        </h3>

        <p style="margin:0;color:#4b5563;line-height:1.5;">
          ${course.shortDescription || course.description || "Sin descripción disponible."}
        </p>

        <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
          <strong style="font-size:20px;color:#2e7d32;">
            ${money(course.price)}
          </strong>

          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button
              class="btn-add-cart"
              data-course-id="${course.id}"
              style="padding:10px 14px;border:none;border-radius:10px;background:${inCart ? "#9ca3af" : "#2e7d32"};color:#fff;cursor:pointer;font-weight:bold;"
              ${inCart ? "disabled" : ""}
            >
              ${inCart ? "Agregado" : "Agregar al carrito"}
            </button>

            <button
              class="btn-buy-now"
              data-course-id="${course.id}"
              style="padding:10px 14px;border:none;border-radius:10px;background:#455a64;color:#fff;cursor:pointer;font-weight:bold;"
            >
              Comprar ahora
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

async function renderCourses() {
  await requireAuth();

  const container = document.getElementById("courses-list");
  if (!container) return;

  container.innerHTML = "<p>Cargando cursos...</p>";

  try {
    const snapshot = await db.collection("cursos").where("activo", "==", true).get();

    if (snapshot.empty) {
      container.innerHTML = "<p>No hay cursos disponibles en este momento.</p>";
      return;
    }

    const courses = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      courses.push({
        id: doc.id,
        title: data.titulo || data.title || "",
        shortDescription: data.descripcion || data.shortDescription || "",
        description: data.descripcionLarga || data.longDescription || "",
        price: Number(data.precio || data.price || 0),
        thumbnailUrl: data.miniatura || data.thumbnailUrl || "",
        videoUrl: data.videoUrl || "",
        materialUrl: data.materialUrl || "",
        wompiLink: data.wompiLink || "",
        activo: data.activo === true
      });
    });

    container.innerHTML = `
      <div class="courses-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px;">
        ${courses.map(getCourseCardTemplate).join("")}
      </div>
    `;

    bindCourseButtons(courses);
    updateCartCount();
  } catch (error) {
    console.error("Error cargando cursos:", error);
    container.innerHTML = "<p>Error cargando los cursos. Intenta nuevamente.</p>";
  }
}

function addCourseToCart(course) {
  const cart = getCart();

  if (cart.some((item) => item.id === course.id)) {
    alert("Este curso ya está en el carrito.");
    return;
  }

  cart.push({
    id: course.id,
    title: course.title,
    price: Number(course.price || 0),
    thumbnailUrl: course.thumbnailUrl || "",
    wompiLink: course.wompiLink || ""
  });

  saveCart(cart);
  updateCartCount();
}

async function createPendingOrder(user, course) {
  const now = firebase.firestore.FieldValue.serverTimestamp();

  const orderData = {
    userId: user.uid,
    userEmail: user.email || "",
    cursoId: course.id,
    tituloCurso: course.title || "",
    monto: Number(course.price || 0),
    wompiLink: course.wompiLink || "",
    proveedor: "wompi_link",
    estado: "pendiente",
    fechaCreacion: now,
    fechaActualizacion: now
  };

  const docRef = await db.collection("ordenes").add(orderData);

  const localData = {
    orderId: docRef.id,
    userId: user.uid,
    userEmail: user.email || "",
    cursoId: course.id,
    tituloCurso: course.title || "",
    monto: Number(course.price || 0)
  };

  setPendingOrder(localData);
  return docRef.id;
}

async function goToCheckout() {
  const user = await requireAuth();
  const cart = getCart();

  if (!cart.length) {
    alert("No hay cursos en el carrito.");
    return;
  }

  if (cart.length > 1) {
    alert("En esta versión con Spark se recomienda vender un curso por pago. Usa 'Comprar ahora' en cada curso.");
    return;
  }

  const course = cart[0];

  if (!course.wompiLink) {
    alert("Este curso no tiene link de pago configurado.");
    return;
  }

  try {
    await createPendingOrder(user, course);
    window.location.href = course.wompiLink;
  } catch (error) {
    console.error("Error preparando checkout:", error);
    alert("No se pudo preparar la compra. Revisa permisos de Firestore y vuelve a intentarlo.");
  }
}

function bindCourseButtons(courses) {
  const addButtons = document.querySelectorAll(".btn-add-cart");
  const buyButtons = document.querySelectorAll(".btn-buy-now");

  addButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const courseId = button.dataset.courseId;
      const course = courses.find((item) => item.id === courseId);
      if (!course) return;

      addCourseToCart(course);

      button.disabled = true;
      button.textContent = "Agregado";
      button.style.background = "#9ca3af";

      alert("Curso agregado al carrito.");
    });
  });

  buyButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const user = await requireAuth();
      const courseId = button.dataset.courseId;
      const course = courses.find((item) => item.id === courseId);
      if (!course) return;

      if (!course.wompiLink) {
        alert("Este curso todavía no tiene link de pago configurado.");
        return;
      }

      try {
        saveCart([
          {
            id: course.id,
            title: course.title,
            price: Number(course.price || 0),
            thumbnailUrl: course.thumbnailUrl || "",
            wompiLink: course.wompiLink || ""
          }
        ]);

        updateCartCount();
        await createPendingOrder(user, course);
        window.location.href = course.wompiLink;
      } catch (error) {
        console.error("Error preparando compra:", error);
        alert("No se pudo preparar la compra. Revisa permisos de Firestore y vuelve a intentarlo.");
      }
    });
  });
}

function openCartPreview() {
  const cart = getCart();

  if (!cart.length) {
    alert("No hay cursos en el carrito.");
    return;
  }

  const resumen = cart.map((item) => `• ${item.title} - ${money(item.price)}`).join("\n");
  const total = cart.reduce((sum, item) => sum + Number(item.price || 0), 0);

  alert(`${resumen}\n\nTotal: ${money(total)}\n\nPara pagar en Spark, usa un solo curso por compra o el botón "Comprar ahora".`);
}

function clearCoursesCart() {
  clearCart();
  clearPendingOrder();
  updateCartCount();
  alert("Carrito vaciado.");
  window.location.reload();
}

async function logout() {
  try {
    await auth.signOut();
    window.location.href = "login.html";
  } catch (error) {
    console.error("Error cerrando sesión:", error);
    alert("No se pudo cerrar sesión.");
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  updateCartCount();
  await renderCourses();

  const goCheckoutBtn = document.getElementById("go-checkout");
  if (goCheckoutBtn) goCheckoutBtn.addEventListener("click", goToCheckout);

  const previewCartBtn = document.getElementById("preview-cart");
  if (previewCartBtn) previewCartBtn.addEventListener("click", openCartPreview);

  const clearCartBtn = document.getElementById("clear-cart");
  if (clearCartBtn) clearCartBtn.addEventListener("click", clearCoursesCart);

  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
});

window.goToCheckout = goToCheckout;
window.openCartPreview = openCartPreview;
window.clearCoursesCart = clearCoursesCart;
window.logout = logout;