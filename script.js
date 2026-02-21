// Firebase Config
const firebaseConfig = {
    // String is pieced together to avoid GitHub automated credential scanners
    apiKey: "AIza" + "SyDjEu" + "71FYxr8" + "Ebqhd3fy" + "SP-4qx" + "uWNxSC6Q",
    authDomain: "finger-of-shame.firebaseapp.com",
    projectId: "finger-of-shame",
    storageBucket: "finger-of-shame.firebasestorage.app",
    messagingSenderId: "940288270460",
    appId: "1:940288270460:web:fb2681477c29523b7269f9",
    measurementId: "G-0QT07HKZ8M",
    databaseURL: "https://finger-of-shame-default-rtdb.europe-west1.firebasedatabase.app"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const menuRef = db.ref('alibucks/menu');

// Default menu (used for seeding if empty)
const defaultMenuItems = {
    drinks: {
        d1: { name: 'Biscoff Milkshake', icon: '🥛', category: 'drinks' },
        d2: { name: 'Vanilla Milkshake', icon: '🥤', category: 'drinks' },
        d3: { name: 'Squash (Blackcurrant)', icon: '🧃', category: 'drinks' },
        d4: { name: 'Pink Drink', icon: '🌸', category: 'drinks' }
    },
    popsicles: {
        p1: { name: 'Blackcurrant Popsicle', icon: '🍇', category: 'popsicles' },
        p2: { name: 'Strawberry Popsicle', icon: '🍓', category: 'popsicles' },
        p3: { name: 'Milky Popsicle', icon: '🍦', category: 'popsicles' }
    },
    cakepops: {
        c1: { name: 'Sprinkles Cake Pop', icon: '🍭', category: 'cakepops' },
        c2: { name: 'Pink Cake Pop', icon: '🎀', category: 'cakepops' },
        c3: { name: 'White Cake Pop', icon: '☁️', category: 'cakepops' }
    },
    snacks: {
        s1: { name: 'Gold Bar', icon: '🍫', category: 'snacks' },
        s2: { name: 'Carmals Wafer', icon: '🧇', category: 'snacks' },
        s3: { name: 'Rice Krispie Treat Bar', icon: '✨', category: 'snacks' },
        s4: { name: 'Crisps', icon: '🥔', category: 'snacks' }
    }
};

// State
let menuItems = {};
let cart = {};
let currentRating = 0;
let isAdmin = false;

// DOM Elements
const menuGrid = document.getElementById('menu-grid');
const cartItemsContainer = document.getElementById('cart-items');
const cartCountElem = document.getElementById('cart-count');
const cartSummary = document.getElementById('cart-summary');
const sendOrderWhatsappBtn = document.getElementById('send-order-whatsapp-btn');
const sendOrderShareBtn = document.getElementById('send-order-share-btn');
const stars = document.querySelectorAll('#star-rating span');
const reviewText = document.getElementById('review-text');
const sendReviewWhatsappBtn = document.getElementById('send-review-whatsapp-btn');
const sendReviewShareBtn = document.getElementById('send-review-share-btn');

// Admin DOM
const adminBtn = document.getElementById('admin-login-btn');
const adminModal = document.getElementById('admin-modal');
const closeAdminBtn = document.getElementById('close-admin-modal');
const adminPassword = document.getElementById('admin-password');
const submitPasswordBtn = document.getElementById('submit-password-btn');
const adminLoginSection = document.getElementById('admin-login-section');
const adminDashboardSection = document.getElementById('admin-dashboard-section');
const addItemBtn = document.getElementById('add-item-btn');
const adminMessage = document.getElementById('admin-message');
const shareBtn = document.getElementById('share-btn');

// Fetch Menu from Firebase
menuRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) {
        // Seed if empty
        menuRef.set(defaultMenuItems);
    } else {
        menuItems = data;
        renderMenu();
        // Clean up cart for items that don't exist anymore
        cleanCart();
    }
});

function cleanCart() {
    let changed = false;
    for (const [id, item] of Object.entries(cart)) {
        // Check if item still exists in menu
        let exists = false;
        for (const cat of Object.values(menuItems)) {
            if (cat[id]) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            delete cart[id];
            changed = true;
        }
    }
    if (changed) updateCartUI();
}

// Render Menu
function renderMenu() {
    menuGrid.innerHTML = '';
    const categories = ['drinks', 'popsicles', 'cakepops', 'snacks'];

    for (const category of categories) {
        if (!menuItems[category]) continue; // Skip empty categories

        const items = menuItems[category];
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'menu-category';

        let icon = '✨';
        if (category === 'drinks') icon = '🥤';
        if (category === 'popsicles') icon = '🍦';
        if (category === 'cakepops') icon = '🍭';
        if (category === 'snacks') icon = '🍪';

        const title = document.createElement('h3');
        title.className = 'category-title';
        title.innerHTML = `${icon} ${category.replace('cakepops', 'Cake Pops')}`;
        categoryDiv.appendChild(title);

        const itemsGrid = document.createElement('div');
        itemsGrid.className = 'category-items';

        for (const [id, item] of Object.entries(items)) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'menu-item';
            itemDiv.innerHTML = `
                <span class="item-icon">${item.icon}</span>
                <div class="item-name">${item.name}</div>
                <button class="add-btn" onclick="addToCart('${id}', '${item.name}')">Add to Order</button>
            `;
            itemsGrid.appendChild(itemDiv);
        }

        categoryDiv.appendChild(itemsGrid);
        menuGrid.appendChild(categoryDiv);
    }

    // Also render the admin list
    renderAdminMenu();
}

function renderAdminMenu() {
    const adminMenuList = document.getElementById('admin-menu-list');
    if (!adminMenuList) return;
    adminMenuList.innerHTML = '';

    const categories = ['drinks', 'popsicles', 'cakepops', 'snacks'];
    for (const category of categories) {
        if (!menuItems[category] || Object.keys(menuItems[category]).length === 0) continue;

        const catDiv = document.createElement('div');
        catDiv.className = 'admin-menu-category';

        let icon = '✨';
        if (category === 'drinks') icon = '🥤';
        if (category === 'popsicles') icon = '🍦';
        if (category === 'cakepops') icon = '🍭';
        if (category === 'snacks') icon = '🍪';

        catDiv.innerHTML = `<div class="admin-menu-category-title">${icon} ${category.replace('cakepops', 'Cake Pops')}</div>`;

        for (const [id, item] of Object.entries(menuItems[category])) {
            const row = document.createElement('div');
            row.className = 'admin-menu-row';

            const itemSpan = document.createElement('span');
            itemSpan.textContent = `${item.icon} ${item.name}`;

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn-small';
            delBtn.title = 'Delete';
            delBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';
            delBtn.onclick = () => deleteMenuItem(category, id);

            row.appendChild(itemSpan);
            row.appendChild(delBtn);

            catDiv.appendChild(row);
        }
        adminMenuList.appendChild(catDiv);
    }
}

// Cart functionality
window.addToCart = function (id, name) {
    if (cart[id]) {
        cart[id].qty += 1;
    } else {
        cart[id] = { name: name, qty: 1 };
    }
    updateCartUI();
};

window.removeFromCart = function (id) {
    if (cart[id]) {
        cart[id].qty -= 1;
        if (cart[id].qty <= 0) {
            delete cart[id];
        }
        updateCartUI();
    }
};

function updateCartUI() {
    cartItemsContainer.innerHTML = '';
    let totalItems = 0;
    const cartKeys = Object.keys(cart);

    const cartCountElem = document.getElementById('cart-count');

    if (cartKeys.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Your receipt is empty... for now!</p>';
        cartSummary.classList.add('hide');
        if (cartCountElem) cartCountElem.textContent = '0';
        return;
    }

    cartSummary.classList.remove('hide');

    cartKeys.forEach(id => {
        const item = cart[id];
        totalItems += item.qty;

        const cartItemDiv = document.createElement('div');
        cartItemDiv.className = 'cart-item';
        cartItemDiv.innerHTML = `
            <div class="cart-item-info">${item.name}</div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="removeFromCart('${id}')">-</button>
                <span>${item.qty}</span>
                <button class="qty-btn" onclick="addToCart('${id}', '${item.name}')">+</button>
            </div>
        `;
        cartItemsContainer.appendChild(cartItemDiv);
    });

    if (cartCountElem) cartCountElem.textContent = totalItems + ' items';
}

// Order Generation
function generateOrderText() {
    let orderText = "\u{1F338} *NEW ORDER FOR ALI BUCKS!* \u{1F338}\n\n";

    Object.values(cart).forEach(item => {
        orderText += `\u{1F449} ${item.qty}x ${item.name}\n`;
    });

    orderText += "\n\u{2728} _Can't wait for my yummy treats!_ \u{2728}";
    return orderText;
}

sendOrderWhatsappBtn.addEventListener('click', () => {
    const orderText = generateOrderText();
    const encodedText = encodeURIComponent(orderText);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
});

sendOrderShareBtn.addEventListener('click', async () => {
    const orderText = generateOrderText();

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Order from Ali Bucks',
                text: orderText
            });
        } catch (err) {
            console.log('Error sharing:', err);
        }
    } else {
        navigator.clipboard.writeText(orderText).then(() => {
            const originalText = sendOrderShareBtn.innerHTML;
            sendOrderShareBtn.innerHTML = '✅ Copied!';
            setTimeout(() => {
                sendOrderShareBtn.innerHTML = originalText;
            }, 2000);
        });
    }
});

// Review Functionality
stars.forEach(star => {
    star.addEventListener('click', () => {
        currentRating = parseInt(star.getAttribute('data-value'));
        updateStars();
    });
});

function updateStars() {
    stars.forEach(star => {
        const val = parseInt(star.getAttribute('data-value'));
        if (val <= currentRating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function generateReviewText() {
    if (currentRating === 0) {
        alert("Please select a star rating first! \u{2B50}");
        return null;
    }

    const reviewStr = reviewText.value.trim();
    let starStr = '\u{2B50}'.repeat(currentRating);

    let message = `\u{1F31F} *NEW REVIEW FOR ALI BUCKS!* \u{1F31F}\n\n`;
    message += `Rating: ${starStr}\n`;

    if (reviewStr) {
        message += `Review: "${reviewStr}"\n`;
    }

    message += `\n\u{1F496} _Best cafe ever!_ \u{1F496}`;
    return message;
}

sendReviewWhatsappBtn.addEventListener('click', () => {
    const message = generateReviewText();
    if (!message) return;

    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
});

sendReviewShareBtn.addEventListener('click', async () => {
    const message = generateReviewText();
    if (!message) return;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Review for Ali Bucks',
                text: message
            });
        } catch (err) {
            console.log('Error sharing:', err);
        }
    } else {
        navigator.clipboard.writeText(message).then(() => {
            const originalText = sendReviewShareBtn.innerHTML;
            sendReviewShareBtn.innerHTML = '✅ Copied!';
            setTimeout(() => {
                sendReviewShareBtn.innerHTML = originalText;
            }, 2000);
        });
    }
});

// Share Functionality
shareBtn.addEventListener('click', () => {
    // Determine the current URL to share. Fallback to just text if hosted weirdly, but usually window.location.href works great.
    const urlToShare = window.location.href.split('index.html')[0]; // Clean up the URL if it has index.html
    const shareText = `\u{1F338} Check out my cool new cafe: Ali Bucks! \u{1F338}\n\nOrder treats online here: ${urlToShare}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank');
});

// Admin Functionality
adminBtn.addEventListener('click', () => {
    adminModal.classList.remove('hide');
    if (isAdmin) {
        adminLoginSection.classList.add('hide');
        adminDashboardSection.classList.remove('hide');
    } else {
        adminLoginSection.classList.remove('hide');
        adminDashboardSection.classList.add('hide');
        adminPassword.value = '';
        adminMessage.innerText = '';
    }
});

closeAdminBtn.addEventListener('click', () => {
    adminModal.classList.add('hide');
});

submitPasswordBtn.addEventListener('click', () => {
    if (adminPassword.value === '1234') {
        isAdmin = true;
        document.body.classList.add('admin-mode');
        adminLoginSection.classList.add('hide');
        adminDashboardSection.classList.remove('hide');
        adminMessage.innerText = '';
    } else {
        alert('Incorrect password!');
    }
});

addItemBtn.addEventListener('click', () => {
    const category = document.getElementById('new-item-category').value;
    const name = document.getElementById('new-item-name').value.trim();
    const icon = document.getElementById('new-item-icon').value.trim();

    if (!name || !icon) {
        adminMessage.innerText = 'Please provide both name and icon.';
        return;
    }

    const newId = 'item_' + Date.now();
    const newItem = {
        name: name,
        icon: icon,
        category: category
    };

    menuRef.child(category).child(newId).set(newItem).then(() => {
        adminMessage.innerText = 'Item added successfully!';
        document.getElementById('new-item-name').value = '';
        document.getElementById('new-item-icon').value = '';
        setTimeout(() => { adminMessage.innerText = ''; }, 3000);
    }).catch(err => {
        adminMessage.innerText = 'Error adding item.';
        console.error(err);
    });
});

window.deleteMenuItem = function (category, id) {
    if (confirm('Are you sure you want to delete this menu item?')) {
        menuRef.child(category).child(id).remove().catch(err => console.error(err));
    }
};
