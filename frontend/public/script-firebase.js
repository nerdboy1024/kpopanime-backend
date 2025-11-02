// ===========================
// FIREBASE IMPORTS & INITIALIZATION
// ===========================

import { db } from '/firebase-config.js';
import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// ===========================
// CATEGORY MAPPING
// ===========================

let categoryMap = {}; // Maps categoryId to category data (slug, name, etc.)

async function loadCategories() {
    try {
        const querySnapshot = await getDocs(collection(db, 'categories'));

        querySnapshot.forEach((doc) => {
            const category = doc.data();
            categoryMap[doc.id] = {
                id: doc.id,
                slug: category.slug,
                name: category.name,
                icon: category.icon
            };
        });

        console.log(`✓ Loaded ${querySnapshot.size} categories from Firestore`);

    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function getCategorySlug(categoryId) {
    return categoryMap[categoryId]?.slug || 'general';
}

// ===========================
// LOAD PRODUCTS FROM FIRESTORE
// ===========================

async function loadProducts() {
    try {
        // Simple query without composite index requirement
        const productsQuery = query(
            collection(db, 'products'),
            where('isActive', '==', true)
        );

        const querySnapshot = await getDocs(productsQuery);
        const shopGrid = document.getElementById('shopGrid');

        // Clear existing placeholder products
        shopGrid.innerHTML = '';

        // Sort products by createdAt in JavaScript
        const products = [];
        querySnapshot.forEach((doc) => {
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Sort by createdAt (newest first)
        products.sort((a, b) => {
            const dateA = a.createdAt?.toDate() || new Date(0);
            const dateB = b.createdAt?.toDate() || new Date(0);
            return dateB - dateA;
        });

        // Render sorted products
        products.forEach((product) => {
            // Create product card HTML (EXACT same structure as your design!)
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.setAttribute('data-category', getCategorySlug(product.categoryId));
            productCard.setAttribute('data-product-id', product.id);

            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${product.imageUrl || 'https://via.placeholder.com/300x300/1a0033/8b5cf6?text=' + encodeURIComponent(product.name)}" alt="${product.name}">
                    <div class="product-overlay">
                        <button class="btn-quick-view">Quick View</button>
                    </div>
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="product-description">${product.description || ''}</p>
                    <p class="product-price">$${product.price.toFixed(2)}</p>
                    <button class="btn btn-cart">Add to Cart</button>
                </div>
            `;

            shopGrid.appendChild(productCard);
        });

        console.log(`✓ Loaded ${products.length} products from Firestore`);

        // Re-initialize interactions for new elements
        initializeProductInteractions();

    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// ===========================
// LOAD BLOG POSTS FROM FIRESTORE
// ===========================

async function loadBlogPosts() {
    try {
        // Simple query without composite index requirement
        const blogQuery = query(
            collection(db, 'blog'),
            where('isPublished', '==', true)
        );

        const querySnapshot = await getDocs(blogQuery);
        const blogGrid = document.querySelector('.blog-grid');

        // Clear existing placeholder posts
        blogGrid.innerHTML = '';

        // Collect, sort, and limit posts in JavaScript
        const posts = [];
        querySnapshot.forEach((doc) => {
            posts.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Sort by publishedAt (newest first)
        posts.sort((a, b) => {
            const dateA = a.publishedAt?.toDate() || new Date(0);
            const dateB = b.publishedAt?.toDate() || new Date(0);
            return dateB - dateA;
        });

        // Take only the first 3 posts
        const recentPosts = posts.slice(0, 3);

        recentPosts.forEach((post) => {

            // Create blog card HTML (EXACT same structure as your design!)
            const blogCard = document.createElement('article');
            blogCard.className = 'blog-card';

            // Format date
            const publishedDate = post.publishedAt?.toDate();
            const dateStr = publishedDate ? publishedDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }) : 'Recent';

            blogCard.innerHTML = `
                <div class="blog-image">
                    <img src="${post.featuredImage || 'https://via.placeholder.com/400x250/1a0033/8b5cf6?text=' + encodeURIComponent(post.title)}" alt="${post.title}">
                    <div class="blog-category">${post.category || 'Uncategorized'}</div>
                </div>
                <div class="blog-content">
                    <h3>${post.title}</h3>
                    <p class="blog-meta">${dateStr} • ${post.readTime || 5} min read</p>
                    <p>${post.excerpt || post.content.substring(0, 150) + '...'}</p>
                    <a href="/blog/${post.slug}" class="blog-read-more">Read More →</a>
                </div>
            `;

            blogGrid.appendChild(blogCard);
        });

        console.log(`✓ Loaded ${recentPosts.length} blog posts from Firestore`);

    } catch (error) {
        console.error('Error loading blog posts:', error);
    }
}

// ===========================
// INITIALIZE PRODUCT INTERACTIONS
// (Re-attach event listeners after loading from Firestore)
// ===========================

function initializeProductInteractions() {
    // Re-attach Add to Cart buttons
    const cartButtons = document.querySelectorAll('.btn-cart');
    cartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();

            const productCard = this.closest('.product-card');
            const productId = productCard.getAttribute('data-product-id');
            const productName = productCard.querySelector('h3').textContent;
            const productPrice = productCard.querySelector('.product-price').textContent;
            const productImage = productCard.querySelector('.product-image img').src;

            // Add to cart
            addToCart({
                id: productId,
                name: productName,
                price: productPrice,
                image: productImage
            });

            // Visual feedback
            const originalText = this.textContent;
            this.textContent = 'Added! ✓';
            this.style.background = 'var(--primary-pink)';
            this.style.color = 'white';

            setTimeout(() => {
                this.textContent = originalText;
                this.style.background = '';
                this.style.color = '';
            }, 2000);

            showNotification(`${productName} added to cart!`);
        });
    });

    // Re-attach Quick View buttons
    const quickViewButtons = document.querySelectorAll('.btn-quick-view');
    quickViewButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();

            const productCard = this.closest('.product-card');
            const productName = productCard.querySelector('h3').textContent;
            const productDescription = productCard.querySelector('.product-description').textContent;
            const productPrice = productCard.querySelector('.product-price').textContent;
            const productImage = productCard.querySelector('.product-image img').src;

            showQuickViewModal({
                name: productName,
                description: productDescription,
                price: productPrice,
                image: productImage
            });
        });
    });

    // Re-attach scroll animations
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });
}

// ===========================
// SHOPPING CART (with localStorage)
// ===========================

let cart = JSON.parse(localStorage.getItem('chordeva_cart')) || [];

function addToCart(product) {
    // Parse price to ensure it's a number
    let price = product.price;
    if (typeof price === 'string') {
        price = parseFloat(price.replace(/[^0-9.]/g, ''));
    }

    // Check if product already in cart
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.push({
            ...product,
            price: price,  // Store numeric price
            quantity: 1
        });
    }

    // Save to localStorage
    localStorage.setItem('chordeva_cart', JSON.stringify(cart));

    console.log('Cart updated:', cart);
}

function getCartCount() {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
}

function getCartTotal() {
    return cart.reduce((total, item) => {
        const price = parseFloat(item.price.replace('$', ''));
        return total + (price * (item.quantity || 1));
    }, 0);
}

// ===========================
// LOAD DATA ON PAGE LOAD
// ===========================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔥 Loading data from Firestore...');

    // Load categories first (needed for product category mapping)
    await loadCategories();

    // Then load products and blog posts
    await Promise.all([
        loadProducts(),
        loadBlogPosts()
    ]);

    console.log('✨ All data loaded!');
});

// ===========================
// ALL YOUR EXISTING CODE BELOW
// (100% UNCHANGED - keeping every animation and interaction!)
// ===========================

// Mobile Navigation Toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');

    const spans = navToggle.querySelectorAll('span');
    if (navMenu.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
    } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    }
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        const spans = navToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    });
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');

        if (href === '#' || href === '') {
            e.preventDefault();
            return;
        }

        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            const offsetTop = target.offsetTop - 80;

            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Shop Filters
const filterButtons = document.querySelectorAll('.filter-btn');

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const filter = button.getAttribute('data-filter');
        const productCards = document.querySelectorAll('.product-card');

        productCards.forEach(card => {
            if (filter === 'all') {
                card.style.display = 'block';
                card.style.animation = 'fadeInUp 0.5s ease-out';
            } else {
                const category = card.getAttribute('data-category');
                if (category === filter) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeInUp 0.5s ease-out';
                } else {
                    card.style.display = 'none';
                }
            }
        });
    });
});

// Navbar Background on Scroll
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.style.background = 'rgba(10, 0, 20, 0.98)';
        navbar.style.boxShadow = '0 5px 20px rgba(255, 105, 180, 0.2)';
    } else {
        navbar.style.background = 'rgba(10, 0, 20, 0.95)';
        navbar.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
});

// Notification System
function showNotification(message) {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, var(--primary-pink), var(--dark-pink));
        color: white;
        padding: 1rem 2rem;
        border-radius: 5px;
        box-shadow: 0 10px 30px rgba(255, 105, 180, 0.4);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        font-family: 'Cinzel', serif;
        font-weight: 600;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles for notification
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Newsletter Form
const newsletterForm = document.querySelector('.newsletter-form');

newsletterForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const emailInput = this.querySelector('input[type="email"]');
    const email = emailInput.value;

    if (email) {
        console.log('Newsletter signup:', email);
        showNotification('Welcome to the Coven! Check your email.');
        emailInput.value = '';
    }
});

// Intersection Observer for Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.8s ease-out forwards';
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements for scroll animations
document.querySelectorAll('.featured-card, .blog-card, .video-card').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
});

// Quick View Modal
function showQuickViewModal(product) {
    const existingModal = document.querySelector('.quick-view-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <button class="modal-close">&times;</button>
            <div class="modal-body">
                <div class="modal-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="modal-info">
                    <h2>${product.name}</h2>
                    <p class="modal-description">${product.description}</p>
                    <p class="modal-price">${product.price}</p>
                    <button class="btn btn-primary btn-add-to-cart">Add to Cart</button>
                </div>
            </div>
        </div>
    `;

    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10001;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    const closeModal = () => {
        modal.remove();
        document.body.style.overflow = '';
    };

    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.modal-overlay').addEventListener('click', closeModal);

    modal.querySelector('.btn-add-to-cart').addEventListener('click', () => {
        // Add product to cart
        const cart = getCart();

        // Check if product already exists in cart
        const existingItemIndex = cart.findIndex(item => item.name === product.name);

        if (existingItemIndex > -1) {
            // Increment quantity if item exists
            cart[existingItemIndex].quantity += 1;
        } else {
            // Add new item to cart
            cart.push({
                name: product.name,
                price: parseFloat(product.price.replace('$', '')),
                quantity: 1,
                image: product.image
            });
        }

        saveCart(cart);
        showNotification(`${product.name} added to cart!`);
        closeModal();
    });
}

// Add modal styles
const modalStyle = document.createElement('style');
modalStyle.textContent = `
    .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
    }

    .modal-content {
        position: relative;
        background: var(--bg-card);
        border: 2px solid var(--border-color);
        border-radius: 15px;
        max-width: 800px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        animation: fadeInUp 0.3s ease-out;
    }

    .modal-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        color: var(--text-light);
        font-size: 2rem;
        cursor: pointer;
        z-index: 1;
        width: 40px;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        transition: all 0.3s ease;
    }

    .modal-close:hover {
        background: var(--primary-pink);
    }

    .modal-body {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        padding: 2rem;
    }

    .modal-image img {
        width: 100%;
        border-radius: 10px;
    }

    .modal-info h2 {
        font-size: 2rem;
        margin-bottom: 1rem;
        color: var(--text-light);
    }

    .modal-description {
        color: var(--text-gray);
        font-size: 1.1rem;
        margin-bottom: 1.5rem;
        line-height: 1.6;
    }

    .modal-price {
        font-size: 2rem;
        color: var(--primary-pink);
        font-weight: 700;
        margin-bottom: 2rem;
    }

    @media (max-width: 768px) {
        .modal-body {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(modalStyle);

// Video Card Click Handlers
const videoCards = document.querySelectorAll('.video-card');

videoCards.forEach(card => {
    card.addEventListener('click', function() {
        showNotification('Opening video...');
        console.log('Video clicked:', this.querySelector('h4').textContent);
    });
});

// Console Message
console.log('%c🌙 Welcome to Chordeva\'s Cave 🌙', 'color: #FF1493; font-size: 20px; font-weight: bold;');
console.log('%cMagic is real, and so is good code ✨', 'color: #FF69B4; font-size: 14px;');
console.log('%c🔥 Powered by Firebase', 'color: #fbbf24; font-size: 14px;');

// ===========================
// SHOPPING CART MODAL
// ===========================

// Cart management functions
function getCart() {
    const cart = JSON.parse(localStorage.getItem('chordeva_cart') || '[]');
    // Normalize prices to ensure they're numbers
    return cart.map(item => {
        let price = item.price;

        // If price is a string, try to parse it
        if (typeof price === 'string') {
            // Remove $ and other non-numeric characters except decimal point
            price = price.replace(/[^0-9.]/g, '');
            price = parseFloat(price);
        }

        // If still not a valid number, default to 0
        if (isNaN(price) || price === null || price === undefined) {
            console.warn('Invalid price for item:', item.name, 'Original price:', item.price);
            price = 0;
        }

        return {
            ...item,
            price: price
        };
    });
}

function saveCart(cart) {
    localStorage.setItem('chordeva_cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountEl = document.getElementById('navCartCount');
    if (cartCountEl) {
        cartCountEl.textContent = count;
    }
}

function openCartModal() {
    console.log('[Cart Modal] openCartModal called');
    const modal = document.getElementById('cartModal');
    console.log('[Cart Modal] modal element:', modal);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    renderCartModal();
}

function closeCartModal() {
    const modal = document.getElementById('cartModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function renderCartModal() {
    console.log('[Cart Modal] renderCartModal called');
    const cart = getCart();
    console.log('[Cart Modal] Cart contents:', cart);
    const modalBody = document.getElementById('cartModalBody');
    const modalFooter = document.getElementById('cartModalFooter');
    console.log('[Cart Modal] modalBody:', modalBody);
    console.log('[Cart Modal] modalFooter:', modalFooter);

    if (cart.length === 0) {
        modalBody.innerHTML = `
            <div class="cart-empty">
                <div class="cart-empty-icon">🛒</div>
                <h3>Your Cart is Empty</h3>
                <p>Add some mystical treasures to your cart!</p>
                <button class="btn btn-primary" onclick="closeCartModal(); document.getElementById('shop').scrollIntoView({ behavior: 'smooth' });">
                    Browse Shop
                </button>
            </div>
        `;
        modalFooter.innerHTML = '';
        return;
    }

    // Render cart items
    modalBody.innerHTML = cart.map((item, index) => {
        // Ensure price is a number
        const price = typeof item.price === 'number' ? item.price : parseFloat(item.price);

        return `
            <div class="cart-item-modal">
                <div class="cart-item-image-modal">
                    <img src="${item.image || '/placeholder.jpg'}" alt="${item.name}">
                </div>
                <div class="cart-item-details-modal">
                    <h4 class="cart-item-name-modal">${item.name}</h4>
                    <div class="cart-item-price-modal">$${price.toFixed(2)}</div>
                    <div class="cart-item-quantity-modal">
                        <button onclick="updateCartQuantity(${index}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateCartQuantity(${index}, 1)">+</button>
                    </div>
                    <button class="cart-item-remove-modal" onclick="removeFromCart(${index})">Remove</button>
                </div>
            </div>
        `;
    }).join('');

    // Calculate total
    const total = cart.reduce((sum, item) => {
        const price = typeof item.price === 'number' ? item.price : parseFloat(item.price);
        return sum + (price * item.quantity);
    }, 0);

    // Render footer with total and checkout button
    modalFooter.innerHTML = `
        <div class="cart-total-modal">
            <span>Total:</span>
            <span>$${total.toFixed(2)}</span>
        </div>
        <button class="cart-checkout-btn" onclick="proceedToCheckoutFromModal()">
            Proceed to Checkout
        </button>
    `;
}

function updateCartQuantity(index, change) {
    const cart = getCart();
    if (cart[index]) {
        cart[index].quantity = Math.max(1, cart[index].quantity + change);
        saveCart(cart);
        renderCartModal();
        showNotification(change > 0 ? 'Quantity increased' : 'Quantity decreased');
    }
}

function removeFromCart(index) {
    const cart = getCart();
    if (cart[index]) {
        const itemName = cart[index].name;
        cart.splice(index, 1);
        saveCart(cart);
        renderCartModal();
        showNotification(`${itemName} removed from cart`);
    }
}

async function proceedToCheckoutFromModal() {
    const cart = getCart();
    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }

    // Prompt for customer email
    const email = prompt('Please enter your email address for order confirmation:');
    if (!email) {
        return; // User cancelled
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    // Show loading state
    const checkoutBtn = document.querySelector('.cart-checkout-btn');
    const originalBtnText = checkoutBtn.textContent;
    checkoutBtn.textContent = 'Processing...';
    checkoutBtn.disabled = true;

    try {
        // Call Square checkout API (works both locally and in production)
        const apiUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:8081/api/checkout.php'
            : '/api/checkout.php';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cart: cart,
                customerEmail: email
            })
        });

        const data = await response.json();

        if (data.success && data.checkoutUrl) {
            // Redirect to Square checkout page
            window.location.href = data.checkoutUrl;
        } else {
            throw new Error(data.error || 'Failed to create checkout session');
        }
    } catch (error) {
        console.error('Checkout error:', error);
        showNotification('Checkout failed: ' + error.message, 'error');

        // Restore button state
        checkoutBtn.textContent = originalBtnText;
        checkoutBtn.disabled = false;
    }
}

// Make functions globally available
window.openCartModal = openCartModal;
window.closeCartModal = closeCartModal;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.proceedToCheckoutFromModal = proceedToCheckoutFromModal;

// Initialize cart count on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});
