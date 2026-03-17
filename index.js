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

function getValueByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : ''), obj);
}

async function verifyFirebaseAuth(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    throw new Error('Token de autenticación ausente.');
  }
  const idToken = header.replace('Bearer ', '').trim();
  return admin.auth().verifyIdToken(idToken);
}

function calculateIntegritySignature({ reference, amountInCents, currency, integritySecret, expirationTime }) {
  const raw = expirationTime
    ? `${reference}${amountInCents}${currency}${expirationTime}${integritySecret}`
    : `${reference}${amountInCents}${currency}${integritySecret}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function generateReference() {
  return `DD-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function assertWompiConfig() {
  if (!env.wompi || !env.wompi.public_key || !env.wompi.integrity_secret) {
    throw new Error('Faltan variables wompi.public_key o wompi.integrity_secret.');
  }
}

function buildRedirectUrl(orderId) {
  const baseUrl = (env.app && env.app.base_url) || '';
  if (!baseUrl) throw new Error('Falta app.base_url en Functions config.');
  return `${baseUrl.replace(/\/$/, '')}/cursos/resultado.html?orderId=${orderId}`;
}

async function getValidatedCourses(courseIds) {
  if (!Array.isArray(courseIds) || !courseIds.length) {
    throw new Error('No se recibieron cursos para la orden.');
  }
  const docs = await Promise.all(courseIds.map(id => db.collection('cursos').doc(id).get()));
  const items = docs.filter(d => d.exists).map(doc => ({ id: doc.id, ...doc.data() })).filter(c => c.activo !== false);
  if (!items.length) throw new Error('No se encontraron cursos activos para la compra.');
  return items;
}

app.post('/prepareWompiCheckout', async (req, res) => {
  try {
    assertWompiConfig();
    const decoded = await verifyFirebaseAuth(req);
    const { items: courseIds, customerName = '', customerPhone = '' } = req.body || {};
    const courses = await getValidatedCourses(courseIds);

    const amount = courses.reduce((sum, item) => sum + Number(item.price || 0), 0);
    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'El total de la orden es inválido.' });
    }

    const amountInCents = amount * 100;
    const reference = generateReference();
    const orderRef = db.collection('ordenes').doc();
    const redirectUrl = buildRedirectUrl(orderRef.id);
    const currency = 'COP';
    const integritySignature = calculateIntegritySignature({
      reference,
      amountInCents,
      currency,
      integritySecret: env.wompi.integrity_secret
    });

    await orderRef.set({
      userId: decoded.uid,
      userEmail: decoded.email || '',
      customerName,
      customerPhone,
      items: courses.map(item => ({ id: item.id, title: item.title, price: Number(item.price || 0) })),
      amount,
      amountInCents,
      currency,
      provider: 'wompi',
      reference,
      status: 'PENDING',
      redirectUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.json({
      ok: true,
      orderId: orderRef.id,
      checkout: {
        checkoutUrl: (env.wompi.checkout_url || 'https://checkout.wompi.co/p/'),
        publicKey: env.wompi.public_key,
        currency,
        amountInCents,
        reference,
        integritySignature,
        redirectUrl,
        customerEmail: decoded.email || '',
        customerName,
        customerPhone
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'No se pudo preparar el checkout.' });
  }
});

app.get('/orderStatus', async (req, res) => {
  try {
    const decoded = await verifyFirebaseAuth(req);
    const orderId = req.query.orderId;
    if (!orderId) return res.status(400).json({ error: 'Falta orderId.' });

    const snap = await db.collection('ordenes').doc(orderId).get();
    if (!snap.exists) return res.status(404).json({ error: 'Orden no encontrada.' });

    const order = snap.data();
    if (order.userId !== decoded.uid) return res.status(403).json({ error: 'No autorizado.' });

    const messageMap = {
      PENDING: 'Tu pago todavía no ha sido confirmado por Wompi.',
      PAID: 'Pago aprobado. Tus cursos ya fueron activados.',
      DECLINED: 'El pago fue rechazado. Puedes intentarlo de nuevo.',
      ERROR: 'La transacción tuvo un error.',
      VOIDED: 'La transacción fue anulada.'
    };

    return res.json({ ok: true, status: order.status || 'PENDING', message: messageMap[order.status] || 'Estado actualizado.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'No se pudo consultar la orden.' });
  }
});

function isValidWompiEvent(body) {
  const secret = env.wompi && env.wompi.events_secret;
  if (!secret) return true; // Permite pruebas iniciales si aún no configuras el secreto.
  const signature = body && body.signature;
  if (!signature || !Array.isArray(signature.properties) || !body.timestamp) return false;
  const base = signature.properties.map(path => String(getValueByPath(body.data || {}, path) || '')).join('') + String(body.timestamp) + secret;
  const checksum = crypto.createHash('sha256').update(base).digest('hex');
  return checksum === signature.checksum;
}

async function activateCoursesForOrder(orderId) {
  const orderRef = db.collection('ordenes').doc(orderId);
  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) throw new Error('Orden no encontrada al activar cursos.');
  const order = orderSnap.data();
  const batch = db.batch();

  for (const item of order.items || []) {
    const existing = await db.collection('inscripciones')
      .where('userId', '==', order.userId)
      .where('courseId', '==', item.id)
      .limit(1)
      .get();

    if (existing.empty) {
      const enrollRef = db.collection('inscripciones').doc();
      batch.set(enrollRef, {
        userId: order.userId,
        userEmail: order.userEmail,
        courseId: item.id,
        orderId,
        provider: 'wompi',
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }

  batch.update(orderRef, {
    status: 'PAID',
    paidAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  await batch.commit();
}

app.post('/wompiWebhook', async (req, res) => {
  try {
    const eventBody = req.body || {};
    if (!isValidWompiEvent(eventBody)) {
      return res.status(400).json({ error: 'Firma de evento inválida.' });
    }

    if (eventBody.event !== 'transaction.updated') {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const tx = eventBody.data && eventBody.data.transaction;
    if (!tx || !tx.reference) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const orderQuery = await db.collection('ordenes').where('reference', '==', tx.reference).limit(1).get();
    if (orderQuery.empty) {
      return res.status(200).json({ ok: true, ignored: true });
    }

    const orderRef = orderQuery.docs[0].ref;
    const normalizedStatus = String(tx.status || 'PENDING').toUpperCase();

    await orderRef.set({
      wompiTransaction: tx,
      wompiTransactionId: tx.id || null,
      paymentMethodType: tx.payment_method_type || null,
      status: normalizedStatus === 'APPROVED' ? 'PAID' : normalizedStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    if (normalizedStatus === 'APPROVED') {
      await activateCoursesForOrder(orderRef.id);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || 'Webhook error.' });
  }
});

exports.api = functions.https.onRequest(app);
