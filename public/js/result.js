async function protectResultPage() {
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

async function renderOrderStatus() {
  const user = await protectResultPage();
  const orderId = new URLSearchParams(window.location.search).get("orderId") || localStorage.getItem("last_order_id");
  const statusEl = document.getElementById("status-box");
  const detailEl = document.getElementById("status-detail");

  if (!orderId) {
    statusEl.textContent = "No encontramos una orden para revisar.";
    return;
  }

  async function readStatus() {
    const token = await user.getIdToken();
    const response = await fetch(`${functionsBaseUrl}/orderStatus?orderId=${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se pudo consultar la orden.");
    return data;
  }

  try {
    const data = await readStatus();
    statusEl.textContent = `Estado actual: ${data.status}`;
    detailEl.textContent = data.message || "Si acabas de pagar, espera unos segundos y vuelve a consultar.";

    if (data.status === "PAID") {
      localStorage.removeItem("dingdong_course_cart");
      document.getElementById("go-courses-btn").style.display = "inline-block";
      document.getElementById("refresh-btn").style.display = "none";
    }
  } catch (error) {
    statusEl.textContent = error.message;
  }
}

window.addEventListener("DOMContentLoaded", renderOrderStatus);
