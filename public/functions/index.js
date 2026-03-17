const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const env = functions.config();

async function verifyFirebaseAuth(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    throw new Error('Token de autenticación ausente.');
  }
  const idToken = header.replace('Bearer ', '').trim();
  return admin.auth().verifyIdToken(idToken);
}

function calcTotal(items) {
  return items.reduce((sum, item) => sum + Number(item.price || 0), 0);
}

function generateReference() {
  return `DD-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function buildNequiHeaders({ method, path, body }) {
  // ADAPTAR según la documentación privada/comercial aprobada de Nequi Conecta.
  // Las APIs vigentes usan firmado JWS / AWS Signature V4 según Nequi Conecta.
  const timestamp = new Date().toISOString();
  const payload = body ? JSON.stringify(body) : '';
  const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');
  const signingBase = [method.toUpperCase(), path, timestamp, payloadHash].join('\n');
  const secret = env.nequi && env.nequi.client_secret ? env.nequi.client_secret : 'CHANGE_ME';
  const signature = crypto.createHmac('sha256', secret).update(signingBase).digest('hex');

  return {
    'Content-Type': 'application/json',
    'x-client-id': env.nequi ? env.nequi.client_id || '' : '',
    'x-api-key': env.nequi ? env.nequi.api_key || '' : '',
    'x-timestamp': timestamp,
    'x-signature': signature
  };
}

async function callNequi({ method, path, body }) {
  // Sustituye la URL y encabezados definitivos según tu onboarding comercial con Nequi.
  const baseUrl = env.nequi && env.nequi.base_url ? env.nequi.base_url : '';
  if (!baseUrl) {
    throw new Error('Falta configurar nequi.base_url en Functions.');
  }

  const headers = buildNequiHeaders({ method, path, body });
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const rawText = await response.text();
  let data = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { rawText };
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || `Nequi respondió ${response.status}`);
  }

  return data;
}

app.post('/createNequiCourseOrder', async (req, res) => {
  try {
    const decoded = await verifyFirebaseAuth(req);
    const { items, phoneNumber } = req.body || {};

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'Debes enviar al menos un curso.' });
    }

    if (!/^3\d{9}$/.test(phoneNumber || '')) {
      return res.status(400).json({ error: 'Número Nequi inválido.' });
    }

    const total = calcTotal(items);
    const reference = generateReference();
    const orderRef = db.collection('ordenes').doc();

    const order = {
      userId: decoded.uid,
      userEmail: decoded.email || '',
      items,
      total,
      phoneNumber,
      provider: 'nequi',
      reference,
      status: 'PENDING',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await orderRef.set(order);

    // Payload de ejemplo. Debe ajustarse al contrato exacto de tu integración Nequi.
    const nequiPayload = {
      reference,
      amount: total,
      currency: 'COP',
      phoneNumber,
      description: `Compra de ${items.length} curso(s) en Ding-Dong`,
      callbackUrl: `${env.app && env.app.base_url ? env.app.base_url : ''}/checkout.html?orderId=${orderRef.id}`
    };

    const nequiResponse = await callNequi({
      method: 'POST',
      path: '/payments/v2/create',
      body: nequiPayload
    });

    await orderRef.update({
      nequi: nequiResponse,
      providerPaymentId: nequiResponse.transactionId || nequiResponse.id || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({
      ok: true,
      orderId: orderRef.id,
      status: 'PENDING',
      nequi: nequiResponse
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Error creando la orden.' });
  }
});

app.post('/verifyNequiCourseOrder', async (req, res) => {
  try {
    const decoded = await verifyFirebaseAuth(req);
    const { orderId } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ error: 'Falta orderId.' });
    }

    const orderRef = db.collection('ordenes').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      return res.status(404).json({ error: 'Orden no encontrada.' });
    }

    const order = orderSnap.data();
    if (order.userId !== decoded.uid) {
      return res.status(403).json({ error: 'No autorizado.' });
    }

    const providerPaymentId = order.providerPaymentId || order.reference;

    const nequiStatus = await callNequi({
      method: 'GET',
      path: `/payments/v2/status/${providerPaymentId}`
    });

    const normalizedStatus = (nequiStatus.status || '').toUpperCase();

    await orderRef.update({
      nequiStatus,
      status: normalizedStatus || 'PENDING',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    if (normalizedStatus === 'APPROVED' || normalizedStatus === 'PAID' || normalizedStatus === 'SUCCESS') {
      const batch = db.batch();
      order.items.forEach(item => {
        const enrollRef = db.collection('inscripciones').doc();
        batch.set(enrollRef, {
          userId: order.userId,
          userEmail: order.userEmail,
          courseId: item.id,
          orderId,
          provider: 'nequi',
          status: 'active',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      batch.update(orderRef, {
        status: 'PAID',
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      await batch.commit();

      return res.json({
        ok: true,
        status: 'PAID',
        message: 'Pago confirmado y cursos activados.'
      });
    }

    return res.json({
      ok: true,
      status: normalizedStatus || 'PENDING',
      message: 'El pago aún no ha sido confirmado por Nequi.'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Error verificando la orden.' });
  }
});

exports.api = functions.https.onRequest(app);
