const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const QRCode = require("qrcode");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const WOMPI_PUBLIC_KEY = defineSecret("WOMPI_PUBLIC_KEY");
const WOMPI_INTEGRITY_SECRET = defineSecret("WOMPI_INTEGRITY_SECRET");
const WOMPI_EVENTS_SECRET = defineSecret("WOMPI_EVENTS_SECRET");

const ALLOWED_ORIGIN = "https://tienda-ding-dong.web.app";

function setCors(res) {
  res.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Max-Age", "3600");
}

function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

function buildIntegritySignature(reference, amountInCents, currency, integritySecret) {
  return sha256(`${reference}${amountInCents}${currency}${integritySecret}`);
}

function getNestedValue(obj, dottedPath) {
  return dottedPath.split(".").reduce((acc, key) => acc?.[key], obj);
}

function verifyWompiEventSignature(eventBody, headerChecksum, secret) {
  try {
    const signature = eventBody?.signature;
    if (!signature || !Array.isArray(signature.properties) || !signature.checksum) {
      return false;
    }

    const concatenatedValues = signature.properties
      .map((propPath) => {
        const value = getNestedValue(eventBody?.data, propPath);
        return value ?? "";
      })
      .join("");

    const timestamp = eventBody?.timestamp || "";
    const expected = sha256(`${concatenatedValues}${timestamp}${secret}`);

    return expected === headerChecksum || expected === signature.checksum;
  } catch (error) {
    console.error("Error verificando firma Wompi:", error);
    return false;
  }
}

async function findOrderByReference(reference) {
  const snap = await db
    .collection("ordenes")
    .where("referenciaWompi", "==", reference)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return snap.docs[0];
}

async function inscriptionExists(userId, cursoId) {
  const snap = await db
    .collection("inscripciones")
    .where("userId", "==", userId)
    .where("cursoId", "==", cursoId)
    .limit(1)
    .get();

  return !snap.empty;
}

exports.createWompiCheckout = onRequest(
  {
    secrets: [WOMPI_PUBLIC_KEY, WOMPI_INTEGRITY_SECRET]
  },
  async (req, res) => {
    setCors(res);

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    try {
      if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "Method not allowed" });
      }

      const authHeader = req.headers.authorization || "";
      const idToken = authHeader.startsWith("Bearer ")
        ? authHeader.replace("Bearer ", "")
        : "";

      if (!idToken) {
        return res.status(401).json({ ok: false, error: "Missing auth token" });
      }

      const decoded = await admin.auth().verifyIdToken(idToken);
      const userId = decoded.uid;
      const userEmail = decoded.email || "";

      const {
        cursoId,
        redirectUrl,
        customerName = "",
        customerPhone = ""
      } = req.body || {};

      if (!cursoId) {
        return res.status(400).json({ ok: false, error: "cursoId is required" });
      }

      if (!redirectUrl) {
        return res.status(400).json({ ok: false, error: "redirectUrl is required" });
      }

      const courseDoc = await db.collection("cursos").doc(cursoId).get();
      if (!courseDoc.exists) {
        return res.status(404).json({ ok: false, error: "Curso no encontrado" });
      }

      const course = courseDoc.data();
      const tituloCurso = course.titulo || course.title || "Curso";
      const monto = Number(course.precio || course.price || 0);

      if (!monto || monto <= 0) {
        return res.status(400).json({ ok: false, error: "Precio inválido" });
      }

      const amountInCents = monto * 100;
      const currency = "COP";
      const reference = `curso_${cursoId}_${userId}_${Date.now()}`;
      const integritySignature = buildIntegritySignature(
        reference,
        amountInCents,
        currency,
        WOMPI_INTEGRITY_SECRET.value()
      );

      const now = admin.firestore.FieldValue.serverTimestamp();

      const orderRef = await db.collection("ordenes").add({
        tipo: "curso",
        userId,
        userEmail,
        cursoId,
        tituloCurso,
        monto,
        amountInCents,
        currency,
        referenciaWompi: reference,
        estado: "pendiente",
        proveedor: "wompi_widget",
        customerName,
        customerPhone,
        fechaCreacion: now,
        fechaActualizacion: now
      });

      return res.status(200).json({
        ok: true,
        orderId: orderRef.id,
        checkout: {
          publicKey: WOMPI_PUBLIC_KEY.value(),
          currency,
          amountInCents,
          reference,
          redirectUrl,
          integritySignature
        }
      });
    } catch (error) {
      console.error("Error createWompiCheckout:", error);
      return res.status(500).json({
        ok: false,
        error: error.message || "Internal error"
      });
    }
  }
);

exports.createStoreCheckout = onRequest(
  {
    secrets: [WOMPI_PUBLIC_KEY, WOMPI_INTEGRITY_SECRET]
  },
  async (req, res) => {
    setCors(res);

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    try {
      if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "Method not allowed" });
      }

      const authHeader = req.headers.authorization || "";
      const idToken = authHeader.startsWith("Bearer ")
        ? authHeader.replace("Bearer ", "")
        : "";

      if (!idToken) {
        return res.status(401).json({ ok: false, error: "Missing auth token" });
      }

      const decoded = await admin.auth().verifyIdToken(idToken);
      const userId = decoded.uid;
      const userEmail = decoded.email || "";

      const {
        items = [],
        shippingCost = 0,
        redirectUrl,
        customerName = "",
        customerPhone = "",
        shippingAddress = ""
      } = req.body || {};

      if (!Array.isArray(items) || !items.length) {
        return res.status(400).json({ ok: false, error: "El carrito está vacío." });
      }

      if (!redirectUrl) {
        return res.status(400).json({ ok: false, error: "redirectUrl is required" });
      }

      const normalizedItems = [];
      let subtotal = 0;

      for (const item of items) {
        const productoId = item.productoId || item.id;
        const cantidad = Number(item.cantidad || item.quantity || 0);

        if (!productoId || cantidad <= 0) continue;

        const productDoc = await db.collection("productos").doc(String(productoId)).get();
        if (!productDoc.exists) continue;

        const product = productDoc.data();
        if (product.activo !== true) continue;

        const precioUnitario = Number(product.precio || 0);
        const itemSubtotal = precioUnitario * cantidad;

        normalizedItems.push({
          productoId: String(productoId),
          nombre: product.nombre || "Producto",
          cantidad,
          precioUnitario,
          subtotal: itemSubtotal,
          imagen: product.imagen || ""
        });

        subtotal += itemSubtotal;
      }

      if (!normalizedItems.length) {
        return res.status(400).json({ ok: false, error: "No hay productos válidos en el carrito." });
      }

      const envio = Number(shippingCost || 0);
      const total = subtotal + envio;

      if (total <= 0) {
        return res.status(400).json({ ok: false, error: "El total es inválido." });
      }

      const amountInCents = total * 100;
      const currency = "COP";
      const reference = `store_${userId}_${Date.now()}`;
      const integritySignature = buildIntegritySignature(
        reference,
        amountInCents,
        currency,
        WOMPI_INTEGRITY_SECRET.value()
      );

      const now = admin.firestore.FieldValue.serverTimestamp();

      const orderRef = await db.collection("ordenes").add({
        tipo: "tienda",
        userId,
        userEmail,
        items: normalizedItems,
        subtotal,
        envio,
        total,
        amountInCents,
        currency,
        referenciaWompi: reference,
        estado: "pendiente",
        proveedor: "wompi_widget",
        customerName,
        customerPhone,
        shippingAddress,
        fechaCreacion: now,
        fechaActualizacion: now
      });

      return res.status(200).json({
        ok: true,
        orderId: orderRef.id,
        checkout: {
          publicKey: WOMPI_PUBLIC_KEY.value(),
          currency,
          amountInCents,
          reference,
          redirectUrl,
          integritySignature
        }
      });
    } catch (error) {
      console.error("Error createStoreCheckout:", error);
      return res.status(500).json({
        ok: false,
        error: error.message || "Internal error"
      });
    }
  }
);

exports.wompiWebhook = onRequest(
  {
    secrets: [WOMPI_EVENTS_SECRET]
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        return res.status(405).send("Method not allowed");
      }

      const event = req.body;
      const checksumHeader = req.headers["x-event-checksum"] || "";

      const signatureOk = verifyWompiEventSignature(
        event,
        checksumHeader,
        WOMPI_EVENTS_SECRET.value()
      );

      if (!signatureOk) {
        console.error("Firma inválida en webhook de Wompi");
        return res.status(401).send("Invalid signature");
      }

      const transaction = event?.data?.transaction;
      if (!transaction) {
        return res.status(400).send("No transaction");
      }

      const transactionId = transaction.id || "";
      const reference = transaction.reference || "";
      const status = String(transaction.status || "").toUpperCase();
      const amountInCents = Number(transaction.amount_in_cents || 0);

      const orderDoc = await findOrderByReference(reference);
      if (!orderDoc) {
        console.warn("Orden no encontrada para referencia:", reference);
        return res.status(200).send("Order not found");
      }

      const order = orderDoc.data();

      if (Number(order.amountInCents || 0) !== amountInCents) {
        await orderDoc.ref.update({
          estado: "error_monto",
          transactionId,
          fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
        });
        return res.status(200).send("Amount mismatch");
      }

      if (status !== "APPROVED") {
        await orderDoc.ref.update({
          estado: status.toLowerCase() || "pendiente",
          transactionId,
          fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
        });
        return res.status(200).send("Transaction not approved");
      }

      await orderDoc.ref.update({
        estado: "aprobado",
        transactionId,
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      });

      if (order.tipo === "tienda") {
        return res.status(200).send("OK");
      }

      const alreadyExists = await inscriptionExists(order.userId, order.cursoId);

      if (!alreadyExists) {
        await db.collection("inscripciones").add({
          userId: order.userId,
          userEmail: order.userEmail || "",
          cursoId: order.cursoId,
          tituloCurso: order.tituloCurso || "",
          estado: "activo",
          referenciaPago: reference,
          transactionId,
          origen: "wompi_webhook",
          fechaCompra: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      return res.status(200).send("OK");
    } catch (error) {
      console.error("Error webhook Wompi:", error);
      return res.status(500).send("Internal error");
    }
  }
);

exports.generateCertificate = onRequest(
  {},
  async (req, res) => {
    setCors(res);

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    try {
      if (req.method !== "POST") {
        return res.status(405).json({ ok: false, error: "Method not allowed" });
      }

      const authHeader = req.headers.authorization || "";
      const idToken = authHeader.startsWith("Bearer ")
        ? authHeader.replace("Bearer ", "")
        : "";

      if (!idToken) {
        return res.status(401).json({ ok: false, error: "Missing auth token" });
      }

      const decoded = await admin.auth().verifyIdToken(idToken);
      const userId = decoded.uid;
      const userEmail = decoded.email || "";
      const { cursoId } = req.body || {};

      if (!cursoId) {
        return res.status(400).json({ ok: false, error: "cursoId is required" });
      }

      const enrollmentSnap = await db
        .collection("inscripciones")
        .where("userId", "==", userId)
        .where("cursoId", "==", cursoId)
        .where("estado", "==", "activo")
        .limit(1)
        .get();

      if (enrollmentSnap.empty) {
        return res.status(403).json({ ok: false, error: "No tienes inscripción activa en este curso" });
      }

      const enrollmentDoc = enrollmentSnap.docs[0];
      const enrollment = enrollmentDoc.data();

      const courseDoc = await db.collection("cursos").doc(cursoId).get();
      if (!courseDoc.exists) {
        return res.status(404).json({ ok: false, error: "Curso no encontrado" });
      }

      const course = courseDoc.data();
      const userDoc = await db.collection("usuarios").doc(userId).get();
      const userData = userDoc.exists ? userDoc.data() : {};

      const studentName = userData?.nombre || decoded.name || userEmail || "Estudiante";
      const courseTitle = course.titulo || course.title || enrollment.tituloCurso || "Curso";
      const issueDate = new Date().toLocaleDateString("es-CO");
      const verificationCode = `CERT-${cursoId}-${userId}-${Date.now()}`;
      const projectId = process.env.GCLOUD_PROJECT || admin.app().options.projectId;
      const verificationUrl = `https://${projectId}.web.app/verificar-certificado.html?code=${encodeURIComponent(verificationCode)}`;

      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([842, 595]);
      const { width, height } = page.getSize();

      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

      const verde = rgb(0.18, 0.49, 0.20);
      const verdeClaro = rgb(0.90, 0.96, 0.91);
      const grisOscuro = rgb(0.18, 0.18, 0.18);
      const gris = rgb(0.35, 0.35, 0.35);
      const dorado = rgb(0.76, 0.64, 0.24);
      const crema = rgb(0.98, 0.98, 0.96);

      page.drawRectangle({ x: 0, y: 0, width, height, color: crema });
      page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: verde });
      page.drawRectangle({ x: 0, y: 0, width, height: 55, color: verdeClaro });
      page.drawRectangle({ x: 18, y: 18, width: width - 36, height: height - 36, borderColor: verde, borderWidth: 3 });
      page.drawRectangle({ x: 32, y: 32, width: width - 64, height: height - 64, borderColor: dorado, borderWidth: 1.5 });

      try {
        const logoPath = path.join(__dirname, "assets", "logo-dingdong.png");
        if (fs.existsSync(logoPath)) {
          const logoBytes = fs.readFileSync(logoPath);
          const logoImage = await pdfDoc.embedPng(logoBytes);
          const dims = logoImage.scale(0.32);

          page.drawImage(logoImage, {
            x: (width - dims.width) / 2,
            y: 470,
            width: dims.width,
            height: dims.height
          });
        }
      } catch (error) {
        console.error("No se pudo cargar el logo:", error);
      }

      page.drawText("DING DONG ACADEMIA", {
        x: 255,
        y: 440,
        size: 22,
        font: fontBold,
        color: rgb(1, 1, 1)
      });

      page.drawText("CERTIFICADO", {
        x: 287,
        y: 390,
        size: 28,
        font: fontBold,
        color: verde
      });

      page.drawText("DE PARTICIPACIÓN", {
        x: 273,
        y: 360,
        size: 18,
        font: fontBold,
        color: dorado
      });

      page.drawText("Se certifica que", {
        x: 337,
        y: 315,
        size: 16,
        font: fontRegular,
        color: gris
      });

      const safeStudentName = String(studentName).toUpperCase();
      const studentNameX = Math.max(70, (width - safeStudentName.length * 12.5) / 2);

      page.drawText(safeStudentName, {
        x: studentNameX,
        y: 270,
        size: 28,
        font: fontBold,
        color: grisOscuro
      });

      page.drawLine({
        start: { x: 120, y: 260 },
        end: { x: width - 120, y: 260 },
        thickness: 1.2,
        color: dorado
      });

      page.drawText("por su participación satisfactoria en el programa", {
        x: 225,
        y: 225,
        size: 15,
        font: fontRegular,
        color: gris
      });

      const safeCourseTitle = String(courseTitle);
      const courseX = Math.max(80, (width - safeCourseTitle.length * 9.6) / 2);

      page.drawText(safeCourseTitle, {
        x: courseX,
        y: 185,
        size: 24,
        font: fontBold,
        color: verde
      });

      page.drawText("Modalidad mixta · Formación práctica · Ding Dong Academia", {
        x: 220,
        y: 150,
        size: 13,
        font: fontItalic,
        color: gris
      });

      page.drawText(`Fecha de expedición: ${issueDate}`, {
        x: 70,
        y: 120,
        size: 13,
        font: fontRegular,
        color: grisOscuro
      });

      page.drawText(`Código de verificación: ${verificationCode}`, {
        x: 70,
        y: 100,
        size: 10,
        font: fontRegular,
        color: gris
      });

      page.drawLine({
        start: { x: 585, y: 145 },
        end: { x: 760, y: 145 },
        thickness: 1,
        color: gris
      });

      page.drawText("Dirección Académica", {
        x: 620,
        y: 125,
        size: 12,
        font: fontBold,
        color: grisOscuro
      });

      page.drawText("Ding Dong Academia", {
        x: 613,
        y: 108,
        size: 11,
        font: fontRegular,
        color: gris
      });

      try {
        const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
          margin: 1,
          width: 140
        });
        const qrBase64 = qrDataUrl.split(",")[1];
        const qrBytes = Buffer.from(qrBase64, "base64");
        const qrImage = await pdfDoc.embedPng(qrBytes);

        page.drawImage(qrImage, {
          x: 640,
          y: 28,
          width: 90,
          height: 90
        });

        page.drawText("Verificar", {
          x: 660,
          y: 18,
          size: 10,
          font: fontRegular,
          color: gris
        });
      } catch (error) {
        console.error("No se pudo generar el QR:", error);
      }

      page.drawText("Calle 20 # 102-30 Fontibón - Bogotá · Cel: 313 625 4423", {
        x: 55,
        y: 34,
        size: 10,
        font: fontRegular,
        color: gris
      });

      page.drawText("Calle 12C # 3-36 Villa Encanto Santo Tomás - Atlántico · Cel: 313 625 4423", {
        x: 110,
        y: 20,
        size: 10,
        font: fontRegular,
        color: gris
      });

      const pdfBytes = await pdfDoc.save();
      const bucket = admin.storage().bucket();
      const safeCourse = String(cursoId).replace(/[^a-zA-Z0-9_-]/g, "_");
      const safeUser = String(userId).replace(/[^a-zA-Z0-9_-]/g, "_");
      const filePath = `certificados/${safeUser}/${safeCourse}.pdf`;

      const file = bucket.file(filePath);
      await file.save(Buffer.from(pdfBytes), {
        contentType: "application/pdf",
        resumable: false,
        metadata: { cacheControl: "private, max-age=0, no-transform" }
      });

      const [signedUrl] = await file.getSignedUrl({
        action: "read",
        expires: Date.now() + 1000 * 60 * 60 * 24 * 30
      });

      const certRef = await db.collection("certificados").add({
        userId,
        userEmail,
        cursoId,
        tituloCurso: courseTitle,
        nombreEstudiante: studentName,
        codigoVerificacion: verificationCode,
        verificationUrl,
        storagePath: filePath,
        downloadUrl: signedUrl,
        fechaGeneracion: admin.firestore.FieldValue.serverTimestamp()
      });

      await enrollmentDoc.ref.update({
        certificadoId: certRef.id,
        certificadoUrl: signedUrl,
        fechaActualizacion: admin.firestore.FieldValue.serverTimestamp()
      });

      return res.status(200).json({
        ok: true,
        certificadoId: certRef.id,
        downloadUrl: signedUrl
      });
    } catch (error) {
      console.error("Error generateCertificate:", error);
      return res.status(500).json({
        ok: false,
        error: error.message || "Internal error"
      });
    }
  }
);

