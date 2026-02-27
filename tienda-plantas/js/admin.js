// Verificar autenticación
auth.onAuthStateChanged(user => {
    if (user) {
        loadAdminPanel();
    } else {
        showLoginForm();
    }
});

function showLoginForm() {
    const app = document.getElementById('admin-app');
    app.innerHTML = `
        <div class="login-form">
            <h2><i class="fas fa-leaf" style="color: #2e7d32;"></i> Panel Admin GreenWood</h2>
            <form id="login-form">
                <div class="form-group">
                    <label><i class="fas fa-envelope"></i> Email</label>
                    <input type="email" id="email" placeholder="admin@greenwood.com" required>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-lock"></i> Contraseña</label>
                    <input type="password" id="password" placeholder="••••••••" required>
                </div>
                <button type="submit" class="btn-primary">
                    <i class="fas fa-sign-in-alt"></i> Ingresar
                </button>
            </form>
            <div style="text-align: center; margin-top: 20px;">
                <p>¿Olvidaste tu contraseña? <a href="#" onclick="resetPassword()">Recupérala aquí</a></p>
            </div>
        </div>
    `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await auth.signInWithEmailAndPassword(email, password);
            showNotification('✅ Sesión iniciada correctamente');
        } catch (error) {
            let errorMessage = 'Error: ';
            switch(error.code) {
                case 'auth/user-not-found':
                    errorMessage += 'Usuario no encontrado';
                    break;
                case 'auth/wrong-password':
                    errorMessage += 'Contraseña incorrecta';
                    break;
                case 'auth/invalid-email':
                    errorMessage += 'Email inválido';
                    break;
                default:
                    errorMessage += error.message;
            }
            alert(errorMessage);
        }
    });
}

// Función para restablecer contraseña
async function resetPassword() {
    const email = prompt('Ingresa tu email para restablecer la contraseña:');
    if (email) {
        try {
            await auth.sendPasswordResetEmail(email);
            alert('📧 Se ha enviado un correo para restablecer tu contraseña');
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}

function loadAdminPanel() {
    const app = document.getElementById('admin-app');
    app.innerHTML = `
        <div class="admin-container">
            <div class="admin-header">
                <h1><i class="fas fa-leaf" style="color: #2e7d32;"></i> Panel de Administración</h1>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <!-- Redes sociales del admin -->
                    <a href="https://instagram.com/greenwood_colombia" target="_blank" class="social-btn instagram" style="width: 40px; height: 40px; position: relative;">
                        <i class="fab fa-instagram"></i>
                    </a>
                    <a href="https://tiktok.com/@greenwood_colombia" target="_blank" class="social-btn tiktok" style="width: 40px; height: 40px;">
                        <i class="fab fa-tiktok"></i>
                    </a>
                    <a href="https://facebook.com/greenwood.colombia" target="_blank" class="social-btn facebook" style="width: 40px; height: 40px;">
                        <i class="fab fa-facebook-f"></i>
                    </a>
                    <a href="https://wa.me/573001234567" target="_blank" class="social-btn whatsapp" style="width: 40px; height: 40px;">
                        <i class="fab fa-whatsapp"></i>
                    </a>
                    <span style="color: #666; margin: 0 10px;">|</span>
                    <span style="color: #2e7d32;" id="user-email">${auth.currentUser?.email}</span>
                    <button onclick="logout()" class="btn-primary" style="background: #dc3545;">
                        <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
                    </button>
                </div>
            </div>
            
            <!-- Estadísticas rápidas -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; color: white;">
                    <i class="fas fa-box" style="font-size: 2rem;"></i>
                    <h3 id="total-products">0</h3>
                    <p>Productos Totales</p>
                </div>
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 10px; color: white;">
                    <i class="fas fa-tag" style="font-size: 2rem;"></i>
                    <h3 id="total-categories">0</h3>
                    <p>Categorías</p>
                </div>
                <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 20px; border-radius: 10px; color: white;">
                    <i class="fas fa-dollar-sign" style="font-size: 2rem;"></i>
                    <h3 id="total-value">$0</h3>
                    <p>Valor en Inventario</p>
                </div>
            </div>
            
            <div class="product-form">
                <h3><i class="fas fa-plus-circle"></i> Agregar Nuevo Producto</h3>
                <form id="product-form">
                    <div class="form-group">
                        <label><i class="fas fa-tag"></i> Nombre del Producto</label>
                        <input type="text" id="product-name" placeholder="Ej: Helecho Boston" required>
                    </div>
                    
                    <div class="form-group">
                        <label><i class="fas fa-align-left"></i> Descripción</label>
                        <textarea id="product-description" placeholder="Describe las características del producto..." rows="3" required></textarea>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="form-group">
                            <label><i class="fas fa-dollar-sign"></i> Precio</label>
                            <input type="number" id="product-price" placeholder="35000" min="0" step="1000" required>
                        </div>
                        
                        <div class="form-group">
                            <label><i class="fas fa-folder"></i> Categoría</label>
                            <select id="product-category" required>
                                <option value="">Seleccionar categoría</option>
                                <option value="plantas">🌿 Plantas</option>
                                <option value="materas">🏺 Materas</option>
                                <option value="madera">🪵 Madera</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label><i class="fas fa-image"></i> URL de la Imagen</label>
                        <input type="url" id="product-image" placeholder="https://ejemplo.com/imagen.jpg" required>
                        <small style="color: #666;">Usa imágenes de Unsplash o sube tus propias imágenes</small>
                    </div>
                    
                    <div style="display: flex; gap: 10px;">
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i> Guardar Producto
                        </button>
                        <button type="button" class="btn-primary" onclick="previewImage()" style="background: #17a2b8;">
                            <i class="fas fa-eye"></i> Vista Previa
                        </button>
                    </div>
                </form>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3><i class="fas fa-boxes"></i> Productos Existentes</h3>
                <div>
                    <input type="text" id="search-product" placeholder="Buscar producto..." style="padding: 8px; border: 1px solid #ddd; border-radius: 5px; width: 250px;">
                </div>
            </div>
            
            <div id="admin-products" class="admin-products-grid"></div>
        </div>
        
        <!-- Modal para vista previa -->
        <div id="imagePreviewModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; justify-content: center; align-items: center;">
            <div style="background: white; padding: 20px; border-radius: 10px; max-width: 500px;">
                <h4>Vista Previa de la Imagen</h4>
                <img id="preview-img" src="" alt="Vista previa" style="width: 100%; max-height: 300px; object-fit: contain;">
                <button onclick="closePreview()" style="margin-top: 10px; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">Cerrar</button>
            </div>
        </div>
    `;

    loadProducts();
    setupProductForm();
    setupSearch();
}

// Función para vista previa de imagen
function previewImage() {
    const imageUrl = document.getElementById('product-image').value;
    if (imageUrl) {
        document.getElementById('preview-img').src = imageUrl;
        document.getElementById('imagePreviewModal').style.display = 'flex';
    } else {
        alert('Por favor ingresa una URL de imagen primero');
    }
}

function closePreview() {
    document.getElementById('imagePreviewModal').style.display = 'none';
}

// Configurar búsqueda
function setupSearch() {
    document.getElementById('search-product').addEventListener('keyup', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        filterProducts(searchTerm);
    });
}

// Filtrar productos por búsqueda
function filterProducts(searchTerm) {
    const cards = document.querySelectorAll('.admin-product-card');
    cards.forEach(card => {
        const title = card.querySelector('h4').textContent.toLowerCase();
        if (title.includes(searchTerm)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

async function loadProducts() {
    const container = document.getElementById('admin-products');
    let totalValue = 0;
    let categories = new Set();
    
    try {
        const snapshot = await db.collection('products').get();
        container.innerHTML = '';
        
        if (snapshot.empty) {
            container.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No hay productos. ¡Agrega tu primer producto!</p>';
        }
        
        snapshot.forEach(doc => {
            const product = doc.data();
            totalValue += product.price || 0;
            categories.add(product.category);
            
            const card = document.createElement('div');
            card.className = 'admin-product-card';
            card.innerHTML = `
                <img src="${product.image}" alt="${product.name}" style="width:100%;height:150px;object-fit:cover;border-radius:5px;">
                <h4>${product.name}</h4>
                <p style="color: #2e7d32; font-weight: bold; font-size: 1.2rem;">$${(product.price || 0).toLocaleString()}</p>
                <p style="color: #666; font-size: 0.9rem;">
                    <i class="fas fa-folder"></i> ${product.category || 'Sin categoría'}
                </p>
                <p style="color: #666; font-size: 0.9rem; margin-top: 5px;">
                    ${product.description?.substring(0, 50)}${product.description?.length > 50 ? '...' : ''}
                </p>
                <div class="admin-product-actions">
                    <button class="btn-edit" onclick="editProduct('${doc.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn-delete" onclick="deleteProduct('${doc.id}')">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
        
        // Actualizar estadísticas
        document.getElementById('total-products').textContent = snapshot.size;
        document.getElementById('total-categories').textContent = categories.size;
        document.getElementById('total-value').textContent = `$${totalValue.toLocaleString()}`;
        
    } catch (error) {
        console.error('Error cargando productos:', error);
        container.innerHTML = '<p style="color: red; text-align: center;">Error cargando productos. Verifica la conexión.</p>';
    }
}

function setupProductForm() {
    document.getElementById('product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const product = {
            name: document.getElementById('product-name').value,
            description: document.getElementById('product-description').value,
            price: parseFloat(document.getElementById('product-price').value),
            category: document.getElementById('product-category').value,
            image: document.getElementById('product-image').value,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Validaciones
        if (product.price <= 0) {
            alert('El precio debe ser mayor a 0');
            return;
        }

        try {
            await db.collection('products').add(product);
            showNotification('✅ Producto agregado exitosamente');
            e.target.reset();
            loadProducts();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    });
}

async function editProduct(id) {
    try {
        const doc = await db.collection('products').doc(id).get();
        const product = doc.data();
        
        // Llenar el formulario con los datos existentes
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-description').value = product.description;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-image').value = product.image;
        
        // Cambiar el botón de submit para actualizar
        const form = document.getElementById('product-form');
        const submitBtn = form.querySelector('button[type="submit"]');
        
        // Remover event listener anterior (manera simple)
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updatedProduct = {
                name: document.getElementById('product-name').value,
                description: document.getElementById('product-description').value,
                price: parseFloat(document.getElementById('product-price').value),
                category: document.getElementById('product-category').value,
                image: document.getElementById('product-image').value,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                await db.collection('products').doc(id).update(updatedProduct);
                showNotification('✅ Producto actualizado exitosamente');
                newForm.reset();
                setupProductForm(); // Restaurar formulario
                loadProducts();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
        
        submitBtn.textContent = 'Actualizar Producto';
        
        // Agregar botón de cancelar
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-primary';
        cancelBtn.style.background = '#6c757d';
        cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancelar';
        cancelBtn.onclick = () => {
            newForm.reset();
            setupProductForm();
            loadProducts();
        };
        newForm.appendChild(cancelBtn);
        
    } catch (error) {
        alert('Error cargando producto: ' + error.message);
    }
}

async function deleteProduct(id) {
    if (confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
        try {
            await db.collection('products').doc(id).delete();
            showNotification('🗑️ Producto eliminado');
            loadProducts();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2e7d32;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        z-index: 1001;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function logout() {
    auth.signOut().then(() => {
        showNotification('👋 Sesión cerrada');
    });
}

// Agregar estilos adicionales para el admin
const adminStyles = document.createElement('style');
adminStyles.textContent = `
    .admin-product-card {
        transition: transform 0.3s, box-shadow 0.3s;
    }
    .admin-product-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    .btn-edit, .btn-delete {
        transition: opacity 0.3s;
    }
    .btn-edit:hover, .btn-delete:hover {
        opacity: 0.8;
    }
`;
document.head.appendChild(adminStyles);