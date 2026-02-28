// Variables globales
let cart = [];
let products = [];
let searchTerm = '';
let selectedPayment = null;

// Cargar productos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    loadCart();
    initializeSocialButtons();

    // Inicializar búsqueda
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value.toLowerCase().trim();
            applyFiltersAndSearch();
        });
    }
});

// Inicializar botones sociales
function initializeSocialButtons() {
    const socialButtons = document.querySelectorAll('.social-header a, .footer-social a, .social-connect-btn, .whatsapp-float, .social-menu-item');
    socialButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const network = btn.title || btn.classList[1] || 'social';
            console.log(`🔗 Click en ${network}`);
        });
    });
}

// Cargar productos desde Firebase
async function loadProducts() {
    try {
        if (typeof db !== 'undefined') {
            const snapshot = await db.collection('products').get();
            products = [];
            snapshot.forEach(doc => {
                products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
        } else {
            console.log('Firebase no disponible, cargando productos de ejemplo');
            loadSampleProducts();
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
        loadSampleProducts();
    }
    applyFiltersAndSearch();
}

// Productos de ejemplo
function loadSampleProducts() {
    products = [
        { id: '1', name: 'Helecho Boston', description: 'Planta de interior de fácil cuidado', price: 35000, category: 'plantas', image: 'https://images.unsplash.com/photo-1593691509543-55-32e3e373181?w=400' },
        { id: '2', name: 'Matera Artesanal', description: 'Matera de barro hecha a mano', price: 45000, category: 'materas', image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400' },
        { id: '3', name: 'Estante Flotante', description: 'Estante de madera de pino', price: 85000, category: 'madera', image: 'https://images.unsplash.com/photo-1595428774223-ef52b71ac8cf?w=400' },
        { id: '4', name: 'Suculenta Echeveria', description: 'Suculenta de fácil cuidado', price: 15000, category: 'plantas', image: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400' },
        { id: '5', name: 'Maceta Colgante', description: 'Maceta de cerámica con diseño moderno', price: 28000, category: 'materas', image: 'https://images.unsplash.com/photo-1614597204159-1d9aaf5a9b3c?w=400' },
        { id: '6', name: 'Banco de Jardín', description: 'Banco de madera tratada para exterior', price: 120000, category: 'madera', image: 'https://images.unsplash.com/photo-1595246140625-573b3c444f8e?w=400' }
    ];
    applyFiltersAndSearch();
}

// Aplicar filtros y búsqueda combinados
function applyFiltersAndSearch() {
    const activeFilter = document.querySelector('.filter-btn.active');
    let category = 'todos';
    if (activeFilter) {
        const filterText = activeFilter.textContent.toLowerCase();
        if (filterText === 'plantas') category = 'plantas';
        else if (filterText === 'materas') category = 'materas';
        else if (filterText === 'madera') category = 'madera';
    }

    let filtered = products;

    if (category !== 'todos') {
        filtered = filtered.filter(p => p.category === category);
    }

    if (searchTerm) {
        filtered = filtered.filter(p =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm)
        );
    }

    displayProducts(filtered);
}

// Mostrar productos
function displayProducts(productsToShow) {
    const container = document.getElementById('products-container');
    if (!container) return;

    container.innerHTML = '';

    if (productsToShow.length === 0) {
        container.innerHTML = '<p style="text-align: center; grid-column: 1/-1; padding: 2rem;">No se encontraron productos 😢</p>';
        return;
    }

    productsToShow.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';

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
                <a href="${whatsappUrl}" target="_blank" class="whatsapp-product" onclick="trackSocialClick('WhatsApp-Producto')">
                    <i class="fab fa-whatsapp"></i> Consultar por WhatsApp
                </a>
            </div>
        `;
        container.appendChild(productCard);
    });
}

// Filtrar por categoría
function filterProducts(category) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(category) ||
            (category === 'todos' && btn.textContent === 'Todos')) {
            btn.classList.add('active');
        }
    });
    applyFiltersAndSearch();
}

// Carrito
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCart();
    saveCart();
    showNotification('✅ Producto agregado al carrito');
}

function updateCart() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = document.getElementById('cart-count');
    if (cartCount) cartCount.textContent = totalItems;

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

    const cartTotal = document.getElementById('cart-total');
    if (cartTotal) cartTotal.textContent = `$${total.toLocaleString()}`;
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
    if (!cartSidebar) return;
    cartSidebar.classList.toggle('active');
    document.body.style.overflow = cartSidebar.classList.contains('active') ? 'hidden' : 'auto';
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
            updateCart();
        } catch (e) {
            cart = [];
        }
    }
}

// Notificaciones
function showNotification(message) {
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed; top: 80px; right: 20px; background: #2e7d32; color: white;
        padding: 1rem 2rem; border-radius: 5px; z-index: 1002; box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2700);
}

// Métodos de pago
function openPaymentModal() {
    if (cart.length === 0) {
        alert('🛒 Tu carrito está vacío');
        return;
    }
    document.getElementById('payment-modal').style.display = 'flex';
}

function togglePaymentModal() {
    const modal = document.getElementById('payment-modal');
    modal.style.display = 'none';
    document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
    document.getElementById('payment-instructions').style.display = 'none';
    document.getElementById('confirm-payment-btn').style.display = 'none';
    selectedPayment = null;
}

function selectPayment(method) {
    document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    selectedPayment = method;

    const instructionsDiv = document.getElementById('payment-instructions');
    const instructionText = document.getElementById('instruction-text');
    let text = '';

    switch (method) {
        case 'nequi':
            text = '💰 *Nequi*\nNúmero: 300 123 4567\nA nombre de: GreenWood Tienda\n\n*Pasos:*\n1. Abre Nequi\n2. Selecciona "Enviar dinero"\n3. Ingresa el número y el valor total\n4. Confirma y envía el comprobante por este chat';
            break;
        case 'daviplata':
            text = '💰 *DaviPlata*\nNúmero: 300 123 4567\nA nombre de: GreenWood Tienda\n\n*Pasos:*\n1. Abre DaviPlata\n2. Selecciona "Enviar dinero"\n3. Ingresa el número y el valor total\n4. Confirma y envía el comprobante por este chat';
            break;
        case 'dale':
            text = '💰 *Dale*\nNúmero: 300 123 4567\nA nombre de: GreenWood Tienda\n\n*Pasos:*\n1. Abre Dale\n2. Selecciona "Enviar dinero"\n3. Ingresa el número y el valor total\n4. Confirma y envía el comprobante por este chat';
            break;
        case 'tarjeta':
            text = '💳 *Pago con tarjeta*\nAceptamos todas las tarjetas de crédito y débito.\n\n*Pasos:*\n1. Te enviaremos un enlace seguro de pago\n2. Ingresa los datos de tu tarjeta\n3. Confirma la transacción\n\nNota: El enlace se enviará por WhatsApp';
            break;
    }
    instructionText.textContent = text.replace(/\*/g, '');
    instructionsDiv.style.display = 'block';
    document.getElementById('confirm-payment-btn').style.display = 'block';
}

function confirmPayment() {
    if (!selectedPayment) {
        alert('Por favor selecciona un método de pago');
        return;
    }

    let message = "Hola GreenWood, quiero realizar el siguiente pedido:\n\n";
    let total = 0;
    cart.forEach(item => {
        message += `• ${item.name} x${item.quantity} - $${(item.price * item.quantity).toLocaleString()}\n`;
        total += item.price * item.quantity;
    });

    const paymentNames = { nequi: 'Nequi', daviplata: 'DaviPlata', dale: 'Dale', tarjeta: 'Tarjeta' };
    message += `\n💰 TOTAL: $${total.toLocaleString()}\n`;
    message += `\n💳 Método de pago: ${paymentNames[selectedPayment]}\n\n`;
    message += "Mis datos:\nNombre: [Tu nombre]\nTeléfono: [Tu teléfono]\nDirección: [Tu dirección]";

    const whatsappUrl = `https://wa.me/573001234567?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    cart = [];
    updateCart();
    saveCart();
    togglePaymentModal();
    if (document.getElementById('cart-sidebar').classList.contains('active')) toggleCart();
    showNotification('📱 Pedido enviado por WhatsApp');
}

// Cerrar modal al hacer clic fuera
window.onclick = function (event) {
    const modal = document.getElementById('payment-modal');
    if (event.target == modal) togglePaymentModal();
};

// Menú social
function toggleSocialMenu() {
    const menu = document.getElementById('socialMenu');
    const btn = document.getElementById('socialMainBtn');
    if (!menu || !btn) return;
    menu.classList.toggle('active');
    btn.classList.toggle('active');
    const icon = btn.querySelector('i');
    if (icon) {
        icon.className = menu.classList.contains('active') ? 'fas fa-times' : 'fas fa-share-alt';
    }
}

function trackSocialClick(network) {
    console.log(`🔗 Click en ${network}`);
    if (network !== 'WhatsApp' && network !== 'WhatsApp-Producto') {
        setTimeout(() => {
            const menu = document.getElementById('socialMenu');
            const btn = document.getElementById('socialMainBtn');
            if (menu && btn) {
                menu.classList.remove('active');
                btn.classList.remove('active');
                const icon = btn.querySelector('i');
                if (icon) icon.className = 'fas fa-share-alt';
            }
        }, 500);
    }
}

// Cerrar menú social al hacer clic fuera
document.addEventListener('click', (e) => {
    const socialDropdown = document.querySelector('.social-dropdown');
    const menu = document.getElementById('socialMenu');
    const btn = document.getElementById('socialMainBtn');
    const whatsappFloat = document.querySelector('.whatsapp-float');

    if (whatsappFloat && whatsappFloat.contains(e.target)) return;

    if (socialDropdown && !socialDropdown.contains(e.target) && menu && menu.classList.contains('active')) {
        menu.classList.remove('active');
        btn.classList.remove('active');
        const icon = btn.querySelector('i');
        if (icon) icon.className = 'fas fa-share-alt';
    }
});

// Prevenir cierre del menú al hacer clic dentro
document.addEventListener('DOMContentLoaded', () => {
    const socialMenu = document.getElementById('socialMenu');
    if (socialMenu) {
        socialMenu.addEventListener('click', (e) => e.stopPropagation());
    }
});

// Cerrar carrito al hacer clic fuera
document.addEventListener('click', (e) => {
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartIcon = document.querySelector('.cart-icon');
    if (cartSidebar && cartSidebar.classList.contains('active') &&
        !cartSidebar.contains(e.target) && cartIcon && !cartIcon.contains(e.target)) {
        toggleCart();
    }
});

// Animaciones
(function addAnimationStyles() {
    if (!document.getElementById('social-animation-styles')) {
        const style = document.createElement('style');
        style.id = 'social-animation-styles';
        style.textContent = `
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
            @keyframes modalSlideDown { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        `;
        document.head.appendChild(style);
    }
})();

// Exportar funciones globales
window.addToCart = addToCart;
window.filterProducts = filterProducts;
window.toggleCart = toggleCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.toggleSocialMenu = toggleSocialMenu;
window.trackSocialClick = trackSocialClick;
window.openPaymentModal = openPaymentModal;
window.togglePaymentModal = togglePaymentModal;
window.selectPayment = selectPayment;
window.confirmPayment = confirmPayment;