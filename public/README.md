# Ding-Dong Cursos con Firebase + checkout Nequi

Este paquete implementa el flujo:

1. El cliente entra a la web.
2. Va a cursos y se autentica.
3. Ve el catálogo de cursos.
4. Agrega al carrito.
5. Crea una orden.
6. Inicia pago por Nequi desde un backend seguro.
7. El backend confirma el pago y activa la inscripción.
8. El alumno ve el curso en "Mis cursos".

## Importante sobre Nequi directo

- No debes llamar la API de Nequi directamente desde el navegador.
- La firma y credenciales deben vivir en backend.
- Este paquete deja lista la arquitectura con Firebase Functions.
- Si tu comercio no tiene acceso aprobado a Nequi Conecta, usa Wompi con Nequi.

## Colecciones Firestore

- usuarios/{uid}
- cursos/{cursoId}
- ordenes/{ordenId}
- inscripciones/{inscripcionId}

## Variables de entorno sugeridas en Functions

- NEQUI_BASE_URL
- NEQUI_CLIENT_ID
- NEQUI_CLIENT_SECRET
- NEQUI_API_KEY
- NEQUI_MERCHANT_ID
- APP_BASE_URL

## Despliegue rápido

1. Crea tu proyecto Firebase.
2. Activa Authentication, Firestore y Storage.
3. Copia tu configuración en `js/firebase-config.js`.
4. Despliega las funciones de `functions/index.js`.
5. Publica los archivos web.
6. Crea cursos en Firestore.
