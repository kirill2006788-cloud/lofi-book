let cart = JSON.parse(localStorage.getItem('lofi_cart')) || [];

function saveCart() {
    localStorage.setItem('lofi_cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalItems;
    }
}

function addToCart(name, price) {
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    saveCart();
    showCartNotification(`📖 ${name} добавлен(а) в корзину!`);
}

let notificationTimer;

function showCartNotification(message) {
    let notification = document.getElementById('cart-notification');

    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'cart-notification';
        notification.className = 'cart-notification';
        document.body.appendChild(notification);
    }

    notification.textContent = message;
    notification.classList.add('cart-notification--show');

    if (notificationTimer) {
        clearTimeout(notificationTimer);
    }

    notificationTimer = setTimeout(() => {
        notification.classList.remove('cart-notification--show');
    }, 2200);
}

function closeAddConfirmDialog() {
    const overlay = document.getElementById('add-confirm-overlay');
    if (overlay) {
        overlay.classList.remove('add-confirm-overlay--show');
    }
}

function openAddConfirmDialog(name, price) {
    let overlay = document.getElementById('add-confirm-overlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'add-confirm-overlay';
        overlay.className = 'add-confirm-overlay';
        overlay.innerHTML = `
            <div class="add-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="addConfirmTitle">
                <h3 id="addConfirmTitle">Добавить в корзину?</h3>
                <p id="add-confirm-text"></p>
                <div class="add-confirm-actions">
                    <button type="button" id="add-confirm-no" class="add-confirm-btn add-confirm-btn--ghost">Отмена</button>
                    <button type="button" id="add-confirm-yes" class="add-confirm-btn add-confirm-btn--primary">Добавить</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                closeAddConfirmDialog();
            }
        });
    }

    const text = document.getElementById('add-confirm-text');
    const yesBtn = document.getElementById('add-confirm-yes');
    const noBtn = document.getElementById('add-confirm-no');

    if (text && yesBtn && noBtn) {
        text.textContent = `📖 ${name} — ${price} ₽`;

        yesBtn.onclick = () => {
            closeAddConfirmDialog();
            addToCart(name, price);
        };

        noBtn.onclick = () => {
            closeAddConfirmDialog();
        };

        overlay.classList.add('add-confirm-overlay--show');
    }
}

function displayCart() {
    const container = document.getElementById('cart-items');
    const totalContainer = document.getElementById('cart-total');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-cart">✨ Корзина пуста. Добавь книги, которые хочется читать ✨</p>';
        totalContainer.innerHTML = '';
        return;
    }

    let html = '<div class="cart__list">';
    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        html += `
            <div class="cart__item">
                <div class="cart__item-info">
                    <h3>${item.name}</h3>
                    <p>${item.price} ₽ × ${item.quantity}</p>
                </div>
                <div class="cart__item-total">${itemTotal} ₽</div>
                <button class="remove-item" data-index="${index}">🗑</button>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
    totalContainer.innerHTML = `<div class="cart__total">Итого: ${total} ₽</div>`;

    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', () => {
            cart.splice(parseInt(btn.dataset.index), 1);
            saveCart();
            displayCart();
        });
    });
}

function clearCart() {
    cart = [];
    saveCart();
    if (document.getElementById('cart-items')) displayCart();
    alert('🧹 Корзина очищена');
}

function checkout() {
    if (cart.length === 0) {
        alert('📖 Корзина пуста. Добавь книги для заказа :)');
        return;
    }
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    alert(`🎉 Спасибо за заказ! Твои книги ждут тебя. Сумма: ${total} ₽\n\nСкоро свяжемся с тобой для уточнения деталей 🧸`);
    cart = [];
    saveCart();
    if (document.getElementById('cart-items')) displayCart();
}

document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => openAddConfirmDialog(btn.dataset.name, parseInt(btn.dataset.price)));
});

document.addEventListener('DOMContentLoaded', () => {
    displayCart();
    updateCartCount();
});

document.getElementById('clear-cart-btn')?.addEventListener('click', clearCart);
document.getElementById('checkout-btn')?.addEventListener('click', checkout);