# Ding Dong - paquete consolidado

Este paquete reúne los archivos generados en la conversación para la academia, admin comercial, CRM, leads, contacto, FAQ, testimonios, blog, banners, promociones, WhatsApp y certificados.

## Importante
- Este ZIP **no reemplaza automáticamente** tu proyecto original completo si faltan archivos base de tu repositorio anterior.
- Sí incluye los **archivos implementados y actualizados** de esta fase para que puedas copiarlos dentro de tu proyecto Firebase Hosting.

## Qué revisar antes de desplegar
1. `public/js/firebase-config.js` debe existir en tu proyecto real con tus credenciales Firebase.
2. En `public/index.html` agrega:
   - `<div id="home-banners"></div>`
   - `<div id="whatsapp-widget"></div>`
   - scripts de `firebase-config.js`, `home-banners.js` y `whatsapp-widget.js`
3. Si usas `courses.js` y `course-view.js`, valida que tu HTML ya tenga los IDs esperados.
4. Despliega con:
   - `firebase deploy --only hosting,firestore`

## Colecciones usadas
usuarios, cursos, modulos, lecciones, ordenes, inscripciones, progreso, certificados, promociones, testimonios, faq, blog, banners, contactos, leads, agenda_comercial, cotizaciones, automatizaciones_comerciales, ajustes.
