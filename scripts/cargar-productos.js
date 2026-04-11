const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const productosBase = [
  { id: "1", name: "Matera Artesanal", description: "Matera de barro hecha a mano", price: 45000, category: "materas", image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400" },
  { id: "2", name: "Estante Flotante", description: "Estante de madera de pino", price: 85000, category: "madera", image: "./img/estanteflotante.png" },
  { id: "3", name: "Jarra", description: "Pintada a mano única y exclusiva", price: 55000, category: "materas", image: "./img/jarraPequeña.png" },
  { id: "4", name: "Pesebres", description: "Jarrones tipo pesebre", price: 49000, category: "materas", image: "./img/jarronesPesebre.png" },
  { id: "5", name: "Arbol de tazas", description: "Tazas con soporte, artesanía única", price: 65000, category: "materas", image: "./img/arbolTazas.png" },
  { id: "6", name: "Arbol tazas", description: "Arbol tazas Ding-Dong, pintadas a mano", price: 68000, category: "materas", image: "./img/arbolTazazDing.png" },
  { id: "7", name: "Cafetera", description: "Cafetera Ding-Dong", price: 45000, category: "materas", image: "./img/cafetera.png" },
  { id: "8", name: "Matera", description: "Matera mariposa, en barro y pintada a mano", price: 49000, category: "materas", image: "./img/materaMaripoza.png" },
  { id: "9", name: "Pocillo", description: "Pocillo Ding-Dong", price: 30000, category: "materas", image: "./img/taza.png" },
  { id: "10", name: "Taza", description: "Taza Ding-Dong pintada a mano", price: 25000, category: "materas", image: "./img/tazasSinOrejas.png" },
  { id: "11", name: "Azucareras", description: "Azucareras Ding-Dong pintadas a mano", price: 25000, category: "materas", image: "./img/tazaTapa.png" },

  { id: "101", name: "Helecho Boston", description: "Planta de interior de fácil cuidado", price: 75000, category: "plantas", image: "./img/helechoboston.png" },
  { id: "102", name: "Arturio Rojo", description: "Este Anturio Rojo requiere riego moderado y prefiere la semi luz. Es una planta con flor que alcanza una altura promedio de 50 cm y puede llegar hasta los 70 cm a los 2 años. Se recomienda fertilizar cada 15 días y no exponerla directamente al sol.", price: 45000, category: "plantas", image: "./img/anturioRojo.png" },
  { id: "103", name: "Arbol de Jade", description: "Es ideal para quienes buscan una planta de bajo mantenimiento. Requiere riego escaso y prefiere la exposición directa al sol. Su altura promedio es de 80 cm. Se recomienda plantarlo a una distancia de 50 cm.", price: 35000, category: "plantas", image: "./img/arbolJade.png" },
  { id: "104", name: "Cinata", description: "Purificadora de aire: Es excelente para eliminar contaminantes del hogar como el monóxido de carbono y el formaldehído.", price: 48000, category: "plantas", image: "./img/cinta.png" },
  { id: "105", name: "Cuerno de Alce", description: "Requiere luz brillante indirecta. Evita el sol directo, ya que sus hojas son muy sensibles y pueden quemarse fácilmente, apareciendo manchas negras o amarillentas.", price: 40000, category: "plantas", image: "./img/cuernoDeAlce.png" },
  { id: "106", name: "Espatifilo", description: "Conocido también como cuna de Moisés o lirio de la paz, es una de las plantas de interior más completas: es elegante, purifica el aire y es sorprendentemente resistente.", price: 55000, category: "plantas", image: "./img/espatifilo.png" },
  { id: "107", name: "Jeranios Rojos", description: "Son los reyes de los balcones y terrazas gracias a su color vibrante y su resistencia extrema al sol. Simbolizan fuerza y protección, y son ideales para dar un toque mediterráneo a cualquier espacio exterior.", price: 65000, category: "plantas", image: "./img/geraniosRojos.png" },
  { id: "108", name: "Planta de Jade", description: "También conocida como árbol de la abundancia o del dinero, es una de las suculentas más apreciadas en el mundo por su longevidad y su asociación con la prosperidad en el Feng Shui.", price: 39000, category: "plantas", image: "./img/jade.png" },
  { id: "109", name: "Lavanda", description: "Planta aromática mediterránea sumamente valorada por su fragancia relajante, su color púrpura vibrante y su capacidad para atraer polinizadores como abejas y mariposas. Es una especie rústica que, aunque fácil de cuidar, requiere condiciones específicas de luz y drenaje para no morir.", price: 45000, category: "plantas", image: "./img/lavanda.png" },
  { id: "110", name: "Lengua de Suegra", description: "También conocida como planta de serpiente o espada de San Jorge, es probablemente la planta de interior más resistente que existe. Es la opción ideal para principiantes o personas con poco tiempo, ya que es casi indestructible.", price: 45000, category: "plantas", image: "./img/LenguaSuegra.png" },
  { id: "111", name: "Costilla de Adán", description: "Es una planta trepadora de la selva tropical que destaca por los agujeros naturales de sus hojas (fenestraciones), que permiten que la luz y el viento pasen a través de ellas sin romperlas.", price: 42000, category: "plantas", image: "./img/Monstera.png" },
  { id: "112", name: "El Potos", description: "Es la planta de interior por excelencia: es casi imposible de matar, crece rapidísimo y queda espectacular colgando de estantes o trepando por las paredes.", price: 35000, category: "plantas", image: "./img/potos.png" },
  { id: "113", name: "Suculentas", description: "Son plantas fascinantes que almacenan agua en sus hojas, tallos o raíces, lo que las hace extremadamente resistentes a la sequía. Son ideales para interiores y exteriores debido a su gran variedad de formas, colores y facilidad de mantenimiento.", price: 55000, category: "plantas", image: "./img/suculentas.png" },

  { id: "201", name: "Soporte Pared", description: "Elegante y sutil. El negro en la madera es perfecto para esa pared que quieres adornar.", price: 55000, category: "madera", image: "./img/dosNe.jpeg" },
  { id: "202", name: "Esquinero", description: "Del color que quieras, perfecto para darle tu toque a esos espacios especiales.", price: 180000, category: "madera", image: "./img/esquineroB.jpeg" },
  { id: "203", name: "Esquinero", description: "Del color que quieras, perfecto para darle tu toque a esos espacios especiales.", price: 180000, category: "madera", image: "./img/esquineroM.jpeg" },
  { id: "204", name: "Esquinero", description: "Crea un ambiente elegante y moderno en la sala de estar con un color de pintura negro nítido.", price: 180000, category: "madera", image: "./img/esquineroN.jpeg" },
  { id: "205", name: "Butaco", description: "Para dos materas, minimalista, perfecto para cualquier espacio.", price: 110000, category: "madera", image: "./img/soDos.jpeg" },
  { id: "206", name: "Soporte", description: "Para esas suculentas que tanto te gustan.", price: 60000, category: "madera", image: "./img/soP.jpeg" },
  { id: "207", name: "Soporte", description: "Queda elegante para tu sala y balcón.", price: 75000, category: "madera", image: "./img/soUno.jpeg" },
  { id: "208", name: "Bancos", description: "Bancos para darle ese toque especial a tu jardín.", price: 125000, category: "madera", image: "./img/btres.jpeg" },
  { id: "209", name: "Butaco", description: "Esa matera que te gusta espera este butaco. ¡Espectacular!.", price: 65000, category: "madera", image: "./img/soU.jpeg" },
  { id: "210", name: "Estante Nelson", description: "Dale un toque cálido y orgánico a tus espacios con nuestra estantería fabricada 100% en madera de pino. Este mueble no solo es una solución de almacenamiento robusta, sino también una pieza decorativa que resalta la belleza de las vetas naturales de la madera.", price: 180000, category: "madera", image: "./img/estante_nelson.png" },
  { id: "211", name: "Porta retrato", description: "Dale vida a tus recuerdos con la calidez de la madera auténtica. Nuestro portarretrato de diseño minimalista y robusto es la pieza perfecta para cualquier rincón de tu hogar, desde una repisa con plantas hasta tu escritorio favorito. Pequeños: 8 x 12 cm, 9 x 14 cm, 10 x 15 cm. Medianos: 13 x 18 cm, 20 x 15 cm, Grande: 28 x 30 cm.", price: 45000, category: "madera", image: "./img/porta_retrato.png" },

  { id: "301", name: "Soporte de piso en metal", description: "Amarillo vibrante con un arco decorativo en la parte superior. Dispone de tres bases circulares a diferentes alturas y una repisa rectangular con varillas en la parte inferior, lo que permite organizar varias macetas en un espacio compacto.", price: 150000, category: "metal", image: "./img/a2.jpeg" },
  { id: "302", name: "Base tipo mesa", description: "Es una base de metal negro de estilo moderno de mediados de siglo. Cuenta con una estructura circular en la parte inferior para mayor estabilidad y cuatro patas delgadas que elevan la maceta a una altura de mesa.", price: 85000, category: "metal", image: "./img/b1.jpeg" },
  { id: "303", name: "Esquinero rojo", description: "Presenta un estilo funcional y decorativo con un arco superior que le da un toque clásico. Las baldas tienen una forma de cuarto de círculo para encajar perfectamente en las esquinas.", price: 255000, category: "metal", image: "./img/e5.jpeg" },
  { id: "304", name: "Soporte negro", description: "¡Imperdible! Soporte para plantas de varios niveles con un diseño asimétrico y moderno, ideal para organizar macetas en espacios verticales.", price: 320000, category: "metal", image: "./img/e6.jpeg" },
  { id: "305", name: "Soporte Pared", description: "Es ideal para macetas pequeñas de entre 10 y 12 cm de diámetro. Al ser un diseño vertical, es perfecto para decorar paredes en espacios reducidos como pasillos, balcones o estudios.", price: 155000, category: "metal", image: "./img/n3.jpeg" },
  { id: "306", name: "Base piso", description: "Transforma cualquier rincón de tu hogar u oficina con este elegante soporte metálico de doble nivel. Diseñado para quienes buscan un toque de diseño contemporáneo y funcionalidad, este organizador eleva la belleza de tus plantas favoritas mientras ahorra espacio en tus superficies.", price: 155000, category: "metal", image: "./img/r2.jpeg" },
  { id: "307", name: "Soporte Pared ¡Jardín Vertical!", description: "Dale vida a tus paredes con este exclusivo estante metálico de 4 niveles. Diseñado para transformar espacios vacíos en oasis vibrantes, este soporte combina un diseño minimalista con la máxima eficiencia espacial, ideal para los amantes de la decoración botánica moderna.", price: 55000, category: "metal", image: "./img/v4.jpeg" }
];

async function cargar() {
  let batch = db.batch();
  let count = 0;

  for (const p of productosBase) {
    const ref = db.collection("productos").doc(String(p.id));

    batch.set(
      ref,
      {
        nombre: p.name,
        descripcion: p.description,
        precio: Number(p.price || 0),
        categoria: String(p.category || "").toLowerCase(),
        imagen: p.image,
        activo: true,
        stock: 10,
        actualizadoEn: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    count += 1;

    if (count % 400 === 0) {
      await batch.commit();
      console.log(`Lote cargado: ${count}`);
      batch = db.batch();
    }
  }

  if (count % 400 !== 0) {
    await batch.commit();
  }

  console.log(`Carga completa. Productos cargados: ${count}`);
  process.exit(0);
}

cargar().catch((error) => {
  console.error("Error cargando productos:", error);
  process.exit(1);
});
