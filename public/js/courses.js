const coursesCartKey = "dingdong_course_cart";
const pendingOrderKey = "dingdong_pending_order";
const createCheckoutUrl =
  "https://us-central1-tienda-ding-dong.cloudfunctions.net/createWompiCheckout";

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
  } catch {
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
  return getCart().some((item) => item.id === courseId);
}

function updateCartCount() {
  const badge = document.getElementById("cart-count");
  if (badge) {
    badge.textContent = String(getCart().length);
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
    const snapshot = await db
      .collection("cursos")
      .where("activo", "==", true)
      .get();

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
    container.innerHTML = "<p>Error cargando los cursos.</p>";
  }
}

function addCourseToCart(course) {
  const cart = getCart();

  if (cart.some((item) => item.id === course.id)) {
    return;
  }

  cart.push({
    id: course.id,
    title: course.title,
    price: Number(course.price || 0),
    thumbnailUrl: course.thumbnailUrl || ""
  });

  saveCart(cart);
  updateCartCount();
}

async function startWompiCheckout(user, course) {
  if (!user) {
    throw new Error("Debes iniciar sesión para comprar.");
  }

  if (!course || !course.id) {
    throw new Error("No se encontró la información del curso.");
  }

  if (typeof WidgetCheckout === "undefined") {
    throw new Error("Wompi no cargó correctamente. Recarga la página e intenta de nuevo.");
  }

  const token = await user.getIdToken();

  let response;
  try {
    response = await fetch(createCheckoutUrl, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        cursoId: course.id,
        customerName: user.displayName || user.email || "Cliente Ding-Dong",
        customerPhone: "",
        redirectUrl: `${window.location.origin}/cursos/resultado.html`
      })
    });
  } catch (networkError) {
    console.error("Error de red al crear checkout:", networkError);
    throw new Error(
      "No fue posible conectar con el servicio de pagos. Verifica la función createWompiCheckout y vuelve a intentar."
    );
  }

  let data;
  try {
    data = await response.json();
  } catch (parseError) {
    console.error("Error leyendo respuesta del checkout:", parseError);
    throw new Error("La respuesta del servidor de pagos no fue válida.");
  }

  if (!response.ok || !data.ok) {
    console.error("Respuesta inválida createWompiCheckout:", data);
    throw new Error(data.error || "No se pudo crear checkout");
  }

  setPendingOrder({
    orderId: data.orderId,
    cursoId: course.id,
    tituloCurso: course.title,
    monto: Number(course.price || 0)
  });

  console.log("checkout data", data.checkout);

if (!data.checkout.publicKey || !String(data.checkout.publicKey).startsWith("pub_")) {
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


  checkout.open(function () {});
}

async function goToCheckout() {
  const cart = getCart();

  if (!cart.length) {
    alert("No hay cursos en el carrito.");
    return;
  }

  if (cart.length > 1) {
    alert("Por ahora solo puedes pagar un curso por vez. Deja uno solo en el carrito o usa 'Comprar ahora'.");
    return;
  }

  const course = cart[0];
  const user = await requireAuth();
  await startWompiCheckout(user, course);
}

function bindCourseButtons(courses) {
  document.querySelectorAll(".btn-add-cart").forEach((button) => {
    button.addEventListener("click", () => {
      const course = courses.find((item) => item.id === button.dataset.courseId);
      if (!course) return;

      addCourseToCart(course);
      button.disabled = true;
      button.textContent = "Agregado";
      button.style.background = "#9ca3af";
    });
  });

  document.querySelectorAll(".btn-buy-now").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        const user = await requireAuth();
        const course = courses.find((item) => item.id === button.dataset.courseId);
        if (!course) return;

        await startWompiCheckout(user, course);
      } catch (error) {
        console.error("Error preparando compra:", error);
        alert(error.message || "No se pudo preparar la compra.");
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

  const resumen = cart
    .map((item) => `• ${item.title} - ${money(item.price)}`)
    .join("\n");

  const total = cart.reduce((sum, item) => sum + Number(item.price || 0), 0);

  alert(`${resumen}\n\nTotal: ${money(total)}`);
}

function clearCoursesCart() {
  clearCart();
  clearPendingOrder();
  updateCartCount();
  window.location.reload();
}

async function logout() {
  try {
    await auth.signOut();
    window.location.href = "login.html";
  } catch (error) {
    console.error(error);
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  updateCartCount();
  await renderCourses();

  document.getElementById("go-checkout")?.addEventListener("click", async () => {
    try {
      await goToCheckout();
    } catch (error) {
      console.error("Error yendo al checkout:", error);
      alert(error.message || "No se pudo ir al checkout.");
    }
  });

  document.getElementById("preview-cart")?.addEventListener("click", openCartPreview);
  document.getElementById("clear-cart")?.addEventListener("click", clearCoursesCart);
  document.getElementById("logout-btn")?.addEventListener("click", logout);
});

window.goToCheckout = goToCheckout;
window.openCartPreview = openCartPreview;
window.clearCoursesCart = clearCoursesCart;
window.logout = logout;





