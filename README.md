# Ding-Dong corregido con Firebase Hosting + Functions + Wompi

## Qué archivos reemplazar

Si tu proyecto ya existe, reemplaza estos archivos por los de este ZIP:

- `firebase.json`
- `firestore.rules`
- `functions/index.js`
- `functions/package.json`
- `public/js/firebase-config.js`
- `public/js/auth.js`
- `public/js/app.js`
- `public/js/courses.js`
- `public/js/checkout.js`
- `public/js/result.js`
- `public/js/my-courses.js`
- `public/js/course-view.js`
- `public/js/admin.js`
- `public/index.html`
- `public/admin.html`
- `public/cursos/login.html`
- `public/cursos/cursos.html`
- `public/cursos/checkout.html`
- `public/cursos/resultado.html`
- `public/cursos/mis-cursos.html`
- `public/cursos/curso.html`

## Dónde pegar tus credenciales

### 1) Firebase web config

Archivo: `public/js/firebase-config.js`

Reemplaza:
- `PEGA_AQUI_TU_API_KEY`
- `PEGA_AQUI_TU_AUTH_DOMAIN`
- `PEGA_AQUI_TU_PROJECT_ID`
- `PEGA_AQUI_TU_STORAGE_BUCKET`
- `PEGA_AQUI_TU_MESSAGING_SENDER_ID`
- `PEGA_AQUI_TU_APP_ID`

### 2) Variables de Wompi en Functions

Primero inicia sesión en Firebase CLI:

```bash
firebase login
firebase use TU_PROYECTO
```

Ahora configura Wompi:

```bash
firebase functions:config:set wompi.public_key="pub_test_o_pub_prod" wompi.integrity_secret="test_integrity_o_prod_integrity" wompi.checkout_url="https://checkout.wompi.co/p/" wompi.events_secret="test_events_o_prod_events" app.base_url="https://TU_DOMINIO_O_WEB_APP"
```

### 3) URL de eventos en Wompi

En el dashboard de Wompi configura la URL de eventos de Sandbox y Producción como:

```text
https://us-central1-TU_PROYECTO.cloudfunctions.net/api/wompiWebhook
```

También puedes usar tu dominio Hosting si haces rewrite a `/api/**`.

## Cómo desplegar en Firebase Hosting + Functions

### Instalar dependencias

En la raíz del proyecto:

```bash
npm install -g firebase-tools
firebase login
firebase use TU_PROYECTO
cd functions
npm install
cd ..
```

### Desplegar reglas, hosting y functions

```bash
firebase deploy --only firestore:rules,functions,hosting
```

## Flujo implementado

1. El cliente entra a `public/cursos/login.html`.
2. Se autentica con Firebase Auth.
3. Ve el catálogo en `public/cursos/cursos.html`.
4. Agrega cursos al carrito.
5. En `checkout.html` se crea una orden en Firestore desde Functions.
6. Functions genera la referencia y la firma de integridad de Wompi.
7. El navegador redirige a Wompi Checkout.
8. Wompi envía `transaction.updated` al webhook.
9. Si la transacción queda `APPROVED`, se crean documentos en `inscripciones`.
10. El cliente vuelve a `resultado.html` y luego a `mis-cursos.html`.

## Colecciones esperadas

### `usuarios`
```json
{
  "uid": "UID_DEL_USUARIO",
  "email": "cliente@correo.com",
  "rol": "cliente"
}
```

### `cursos`
```json
{
  "title": "Curso de cactus",
  "shortDescription": "Aprende lo básico",
  "longDescription": "Contenido largo...",
  "thumbnailUrl": "https://...",
  "videoUrl": "https://...",
  "price": 120000,
  "activo": true
}
```

### `ordenes`
```json
{
  "userId": "UID",
  "reference": "DD-...",
  "status": "PENDING",
  "amountInCents": 12000000,
  "currency": "COP"
}
```

### `inscripciones`
```json
{
  "userId": "UID",
  "courseId": "ID_CURSO",
  "orderId": "ID_ORDEN",
  "status": "active"
}
```

## Usuario administrador

En `usuarios/{uid}` cambia el campo `rol` a `admin` para usar `public/admin.html`.

## Datos de prueba Wompi

Usa llaves de sandbox. Wompi indica que en sandbox hay datos de prueba para cada método de pago, incluyendo Nequi. Consulta los datos vigentes en su documentación oficial.
