// Variables globales
let cart = [];
let products = [];

// Cargar productos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadCart();
    initializeSocialButtons();
});

// Inicializar botones sociales
function initializeSocialButtons() {
    // Agregar event listeners para tracking de clics en redes sociales
    const socialButtons = document.querySelectorAll('.social-btn, .social-header a, .footer-social a');
    socialButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const network = btn.title || btn.classList[1];
            console.log(`Click en ${network} - Tracking de evento`);
            // Aquí puedes agregar código de analytics si lo deseas
        });
    });
}

// Cargar productos desde Firebase
async function loadProducts() {
    try {
        const snapshot = await db.collection('products').get();
        products = [];
        snapshot.forEach(doc => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });
        displayProducts(products);
    } catch (error) {
        console.error('Error cargando productos:', error);
        // Cargar datos de ejemplo si no hay conexión
        loadSampleProducts();
    }
}

// Cargar productos de ejemplo (para pruebas)
function loadSampleProducts() {
    products = [
        {
            id: '1',
            name: 'Helecho Boston',
            description: 'Planta de interior de fácil cuidado, purifica el aire',
            price: 35000,
            category: 'plantas',
            image: 'https://images.unsplash.com/photo-1593691509543-55-32e3e373181'
        },
        {
            id: '2',
            name: 'Matera Artesanal',
            description: 'Matera de barro hecha a mano por artesanos locales',
            price: 45000,
            category: 'materas',
            image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411'
        },
        {
            id: '3',
            name: 'Estante Flotante',
            description: 'Estante de madera de pino, ideal para decoración',
            price: 85000,
            category: 'madera',
            image: 'https://images.unsplash.com/photo-1595428774223-ef52b71ac8cf'
        },
        {
            id: '4',
            name: 'Suculenta Echeveria',
            description: 'Suculenta de fácil cuidado, perfecta para principiantes',
            price: 15000,
            category: 'plantas',
            image: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09'
        },
        {
            id: '5',
            name: 'Maceta Colgante',
            description: 'Maceta de cerámica con diseño moderno',
            price: 28000,
            category: 'materas',
            image: 'https://images.unsplash.com/photo-1614597204159-1d9aaf5a9b3c'
        },
        {
            id: '6',
            name: 'Banco de Jardín',
            description: 'Banco de madera tratada para exterior',
            price: 120000,
            category: 'madera',
            image: 'https://images.unsplash.com/photo-1595246140625-573b3c444f8e'
        }
    ];
    displayProducts(products);
}

// Mostrar productos en la grilla
function displayProducts(productsToShow) {
    const container = document.getElementById('products-container');
    container.innerHTML = '';
    
    productsToShow.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        // Crear mensaje personalizado para WhatsApp
        const whatsappMessage = encodeURIComponent(
            `Hola GreenWood, me interesa el producto: ${product.name} - $${product.price.toLocaleString()}\n\n` +
            `Descripción: ${product.description}\n` +
            `¿Podrían darme más información?`
        );
        const whatsappUrl = `https://wa.me/573001234567?text=${whatsappMessage}`;
        
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
            <div class="product-info">
                <h3>${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <p class="product-price">$${product.price.toLocaleString()}</p>
                <button class="add-to-cart" onclick="addToCart('${product.id}')">
                    <i class="fas fa-shopping-cart"></i> Agregar al Carrito
                </button>
                <a href="${whatsappUrl}" target="_blank" class="whatsapp-product">
                    <i class="fab fa-whatsapp"></i> Consultar por WhatsApp
                </a>
            </div>
        `;
        container.appendChild(productCard);
    });
}

// Filtrar productos por categoría
function filterProducts(category) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(category) || 
            (category === 'todos' && btn.textContent === 'Todos')) {
            btn.classList.add('active');
        }
    });

    if (category === 'todos') {
        displayProducts(products);
    } else {
        const filtered = products.filter(p => p.category === category);
        displayProducts(filtered);
    }
}

// Funciones del carrito
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    updateCart();
    saveCart();
    showNotification('✅ Producto agregado al carrito');
}

function updateCart() {
    // Actualizar contador
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalItems;

    // Actualizar items del carrito
    const cartItems = document.getElementById('cart-items');
    if (!cartItems) return;
    
    cartItems.innerHTML = '';

    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" loading="lazy">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">$${item.price.toLocaleString()}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                    <i class="fas fa-trash remove-item" onclick="removeFromCart('${item.id}')" title="Eliminar"></i>
                </div>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });

    document.getElementById('cart-total').textContent = `$${total.toLocaleString()}`;
}

function updateQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCart();
            saveCart();
        }
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
    saveCart();
    showNotification('🗑️ Producto eliminado del carrito');
}

function toggleCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    cartSidebar.classList.toggle('active');
    
    // Bloquear scroll cuando el carrito está abierto
    if (cartSidebar.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCart();
    }
}

function checkout() {
    if (cart.length === 0) {
        alert('🛒 Tu carrito está vacío');
        return;
    }
    
    // Crear mensaje de WhatsApp con el resumen de la compra
    let message = "Hola GreenWood, quiero realizar el siguiente pedido:\n\n";
    let total = 0;
    
    cart.forEach(item => {
        message += `• ${item.name} x${item.quantity} - $${(item.price * item.quantity).toLocaleString()}\n`;
        total += item.price * item.quantity;
    });
    
    message += `\n💰 TOTAL: $${total.toLocaleString()}\n\n`;
    message += "Mis datos de contacto:\n";
    message += "Nombre: [Tu nombre]\n";
    message += "Teléfono: [Tu teléfono]\n";
    message += "Dirección: [Tu dirección]";
    
    const whatsappUrl = `https://wa.me/573001234567?text=${encodeURIComponent(message)}`;
    
    // Abrir WhatsApp y limpiar carrito
    window.open(whatsappUrl, '_blank');
    
    cart = [];
    updateCart();
    saveCart();
    toggleCart();
    showNotification('📱 Redirigiendo a WhatsApp...');
}

function showNotification(message) {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #2e7d32;
        color: white;
        padding: 1rem 2rem;
        border-radius: 5px;
        z-index: 1002;
        animation: slideIn 0.3s ease, fadeOut 0.3s ease 2.7s;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Manejar envío del formulario de contacto
document.getElementById('contact-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Obtener datos del formulario
    const nombre = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelector('input[type="email"]').value;
    const mensaje = e.target.querySelector('textarea').value;
    
    // Crear mensaje para WhatsApp
    const whatsappMessage = encodeURIComponent(
        `*Nuevo mensaje de contacto*\n\n` +
        `*Nombre:* ${nombre}\n` +
        `*Email:* ${email}\n` +
        `*Mensaje:* ${mensaje}`
    );
    
    // Abrir WhatsApp
    window.open(`https://wa.me/573001234567?text=${whatsappMessage}`, '_blank');
    
    alert('📱 Mensaje enviado. Te contactaremos pronto por WhatsApp.');
    e.target.reset();
});

// Cerrar carrito al hacer clic fuera
document.addEventListener('click', (e) => {
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartIcon = document.querySelector('.cart-icon');
    
    if (cartSidebar.classList.contains('active') && 
        !cartSidebar.contains(e.target) && 
        !cartIcon.contains(e.target)) {
        toggleCart();
    }
});

// Animación para el slideIn
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);