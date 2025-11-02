import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, collection, doc, getDoc, getDocs, query, where, addDoc, orderBy, limit, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Import Firebase config
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Global state
let currentProduct = null;
let currentUser = null;
let selectedVariant = null;
let currentImageIndex = 0;

// Get product slug from URL
const urlParams = new URLSearchParams(window.location.search);
const productSlug = urlParams.get('slug');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!productSlug) {
        window.location.href = 'index.html#shop';
        return;
    }

    loadProduct();
    initCartCount();
    initMobileNav();

    // Auth state listener
    onAuthStateChanged(auth, (user) => {
        currentUser = user;
        updateAccountLink(user);
    });
});

// Load product from Firestore
async function loadProduct() {
    try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, where('slug', '==', productSlug), where('isActive', '==', true), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            showError('Product not found');
            setTimeout(() => window.location.href = 'index.html#shop', 2000);
            return;
        }

        const productDoc = querySnapshot.docs[0];
        currentProduct = {
            id: productDoc.id,
            ...productDoc.data()
        };

        await renderProduct();
        loadRelatedProducts();
        loadReviews();

    } catch (error) {
        console.error('Error loading product:', error);
        showError('Failed to load product');
    }
}

// Render product to page
async function renderProduct() {
    const product = currentProduct;

    // Update breadcrumb
    document.getElementById('breadcrumbProduct').textContent = product.name;

    // Get category name
    if (product.categoryId) {
        const categoryDoc = await getDoc(doc(db, 'categories', product.categoryId));
        if (categoryDoc.exists()) {
            document.getElementById('breadcrumbCategory').textContent = categoryDoc.data().name;
        }
    }

    // Build product HTML
    const images = product.images && product.images.length > 0 ? product.images : [product.imageUrl || '/placeholder.jpg'];

    const stockStatus = product.stockQuantity > 10 ? 'in-stock' : product.stockQuantity > 0 ? 'low-stock' : 'out-of-stock';
    const stockText = product.stockQuantity > 10 ? `In Stock (${product.stockQuantity})` : product.stockQuantity > 0 ? `Low Stock (${product.stockQuantity} left)` : 'Out of Stock';

    const compareAtPrice = product.compareAtPrice && product.compareAtPrice > product.price;
    const savings = compareAtPrice ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;

    const html = `
        <div class="product-grid">
            <!-- Image Gallery -->
            <div class="product-gallery">
                <div class="main-image-container">
                    <img src="${images[0]}" alt="${product.name}" class="main-image" id="mainImage">
                    <button class="wishlist-btn" id="wishlistBtn" title="Add to Wishlist">
                        <span id="wishlistIcon">♡</span>
                    </button>
                </div>
                <div class="thumbnail-grid">
                    ${images.map((img, index) => `
                        <div class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                            <img src="${img}" alt="${product.name}">
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Product Info -->
            <div class="product-info">
                <span class="product-category" id="productCategory">Loading...</span>

                <h1 class="product-title">${product.name}</h1>

                <div class="product-rating" id="productRating">
                    <div class="stars">★★★★★</div>
                    <span class="rating-count">(0 reviews)</span>
                </div>

                <div class="product-price">
                    <span class="current-price">$${product.price.toFixed(2)}</span>
                    ${compareAtPrice ? `
                        <span class="compare-price">$${product.compareAtPrice.toFixed(2)}</span>
                        <span class="savings-badge">Save ${savings}%</span>
                    ` : ''}
                </div>

                <div class="product-description">
                    ${product.description || 'No description available.'}
                </div>

                <div class="stock-status ${stockStatus}">
                    <span>●</span>
                    <span>${stockText}</span>
                </div>

                <!-- Variants -->
                ${product.variants && product.variants.length > 0 ? renderVariants(product.variants) : ''}

                <!-- Quantity -->
                <div class="quantity-selector">
                    <label class="variant-label">Quantity</label>
                    <div class="quantity-controls">
                        <button class="quantity-btn" id="decreaseQty">-</button>
                        <input type="number" class="quantity-input" id="quantityInput" value="1" min="1" max="${product.stockQuantity}">
                        <button class="quantity-btn" id="increaseQty">+</button>
                    </div>
                </div>

                <!-- Actions -->
                <div class="product-actions">
                    <button class="btn btn-primary" id="addToCartBtn" ${product.stockQuantity === 0 ? 'disabled' : ''}>
                        ${product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <button class="btn btn-secondary" id="buyNowBtn" ${product.stockQuantity === 0 ? 'disabled' : ''}>
                        ⚡
                    </button>
                </div>

                <!-- Meta -->
                <div class="product-meta">
                    <div class="meta-item">
                        <span class="meta-label">SKU:</span>
                        <span>${product.id}</span>
                    </div>
                    ${product.metadata && product.metadata.material ? `
                        <div class="meta-item">
                            <span class="meta-label">Material:</span>
                            <span>${product.metadata.material}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    document.getElementById('productContent').innerHTML = html;

    // Initialize event listeners
    initImageGallery(images);
    initQuantityControls();
    initAddToCart();
    initWishlist();
    initVariantSelection();
}

// Render product variants
function renderVariants(variants) {
    if (!variants || variants.length === 0) return '';

    // Group variants by type (e.g., size, color)
    const variantGroups = {};
    variants.forEach(variant => {
        const type = variant.type || 'Option';
        if (!variantGroups[type]) {
            variantGroups[type] = [];
        }
        variantGroups[type].push(variant);
    });

    let html = '<div class="product-variants">';

    for (const [type, options] of Object.entries(variantGroups)) {
        html += `
            <div class="variant-group">
                <label class="variant-label">${type}</label>
                <div class="variant-options">
                    ${options.map(option => `
                        <div class="variant-option ${option.stock === 0 ? 'disabled' : ''}"
                             data-variant-id="${option.id}"
                             data-variant-name="${option.name}"
                             data-variant-price="${option.price || currentProduct.price}"
                             data-variant-stock="${option.stock || 0}">
                            ${option.name}
                            ${option.price && option.price !== currentProduct.price ? ` (+$${(option.price - currentProduct.price).toFixed(2)})` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

// Initialize image gallery
function initImageGallery(images) {
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.querySelectorAll('.thumbnail');

    thumbnails.forEach((thumbnail, index) => {
        thumbnail.addEventListener('click', () => {
            currentImageIndex = index;
            mainImage.src = images[index];

            thumbnails.forEach(t => t.classList.remove('active'));
            thumbnail.classList.add('active');
        });
    });

    // Image zoom
    mainImage.addEventListener('click', () => {
        const modal = document.createElement('div');
        modal.className = 'image-zoom-modal show';
        modal.innerHTML = `<img src="${images[currentImageIndex]}" alt="${currentProduct.name}">`;
        document.body.appendChild(modal);

        modal.addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
    });
}

// Initialize quantity controls
function initQuantityControls() {
    const input = document.getElementById('quantityInput');
    const decreaseBtn = document.getElementById('decreaseQty');
    const increaseBtn = document.getElementById('increaseQty');

    decreaseBtn?.addEventListener('click', () => {
        if (input.value > 1) {
            input.value = parseInt(input.value) - 1;
        }
    });

    increaseBtn?.addEventListener('click', () => {
        const maxStock = selectedVariant ? selectedVariant.stock : currentProduct.stockQuantity;
        if (input.value < maxStock) {
            input.value = parseInt(input.value) + 1;
        }
    });

    input?.addEventListener('change', () => {
        const maxStock = selectedVariant ? selectedVariant.stock : currentProduct.stockQuantity;
        if (input.value < 1) input.value = 1;
        if (input.value > maxStock) input.value = maxStock;
    });
}

// Initialize variant selection
function initVariantSelection() {
    const variantOptions = document.querySelectorAll('.variant-option:not(.disabled)');

    variantOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove active from siblings
            const siblings = option.parentElement.querySelectorAll('.variant-option');
            siblings.forEach(s => s.classList.remove('active'));

            option.classList.add('active');

            selectedVariant = {
                id: option.dataset.variantId,
                name: option.dataset.variantName,
                price: parseFloat(option.dataset.variantPrice),
                stock: parseInt(option.dataset.variantStock)
            };

            // Update price display
            document.querySelector('.current-price').textContent = `$${selectedVariant.price.toFixed(2)}`;

            // Update quantity max
            const qtyInput = document.getElementById('quantityInput');
            if (qtyInput) {
                qtyInput.max = selectedVariant.stock;
                if (qtyInput.value > selectedVariant.stock) {
                    qtyInput.value = selectedVariant.stock;
                }
            }
        });
    });
}

// Initialize add to cart
function initAddToCart() {
    const addToCartBtn = document.getElementById('addToCartBtn');
    const buyNowBtn = document.getElementById('buyNowBtn');

    addToCartBtn?.addEventListener('click', () => {
        addToCart(false);
    });

    buyNowBtn?.addEventListener('click', () => {
        addToCart(true);
    });
}

// Add product to cart
function addToCart(buyNow = false) {
    const quantity = parseInt(document.getElementById('quantityInput').value);

    const cartItem = {
        productId: currentProduct.id,
        name: currentProduct.name,
        price: selectedVariant ? selectedVariant.price : currentProduct.price,
        image: currentProduct.images?.[0] || currentProduct.imageUrl,
        quantity: quantity,
        variantId: selectedVariant?.id || null,
        variantName: selectedVariant?.name || null
    };

    // Get existing cart
    let cart = JSON.parse(localStorage.getItem('chordeva_cart') || '[]');

    // Check if item already exists
    const existingIndex = cart.findIndex(item =>
        item.productId === cartItem.productId && item.variantId === cartItem.variantId
    );

    if (existingIndex >= 0) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push(cartItem);
    }

    // Save cart
    localStorage.setItem('chordeva_cart', JSON.stringify(cart));

    // Update cart count
    initCartCount();

    if (buyNow) {
        window.location.href = 'cart.html';
    } else {
        showToast(`Added ${quantity} item(s) to cart!`);
    }
}

// Initialize wishlist
function initWishlist() {
    const wishlistBtn = document.getElementById('wishlistBtn');
    const wishlistIcon = document.getElementById('wishlistIcon');

    // Check if product is in wishlist
    let wishlist = JSON.parse(localStorage.getItem('chordeva_wishlist') || '[]');
    const isInWishlist = wishlist.some(item => item.productId === currentProduct.id);

    if (isInWishlist) {
        wishlistBtn.classList.add('active');
        wishlistIcon.textContent = '♥';
    }

    wishlistBtn?.addEventListener('click', () => {
        wishlist = JSON.parse(localStorage.getItem('chordeva_wishlist') || '[]');
        const index = wishlist.findIndex(item => item.productId === currentProduct.id);

        if (index >= 0) {
            // Remove from wishlist
            wishlist.splice(index, 1);
            wishlistBtn.classList.remove('active');
            wishlistIcon.textContent = '♡';
            showToast('Removed from wishlist');
        } else {
            // Add to wishlist
            wishlist.push({
                productId: currentProduct.id,
                name: currentProduct.name,
                price: currentProduct.price,
                image: currentProduct.images?.[0] || currentProduct.imageUrl
            });
            wishlistBtn.classList.add('active');
            wishlistIcon.textContent = '♥';
            showToast('Added to wishlist!');
        }

        localStorage.setItem('chordeva_wishlist', JSON.stringify(wishlist));
    });
}

// Load related products
async function loadRelatedProducts() {
    try {
        const productsRef = collection(db, 'products');
        const q = query(
            productsRef,
            where('categoryId', '==', currentProduct.categoryId),
            where('isActive', '==', true),
            limit(4)
        );

        const querySnapshot = await getDocs(q);
        const products = [];

        querySnapshot.forEach(doc => {
            if (doc.id !== currentProduct.id) {
                products.push({
                    id: doc.id,
                    ...doc.data()
                });
            }
        });

        if (products.length > 0) {
            renderRelatedProducts(products);
            document.getElementById('relatedProductsSection').style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading related products:', error);
    }
}

// Render related products
function renderRelatedProducts(products) {
    const html = products.map(product => `
        <div class="product-card">
            <a href="product.html?slug=${product.slug}">
                <img src="${product.images?.[0] || product.imageUrl || '/placeholder.jpg'}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p class="price">$${product.price.toFixed(2)}</p>
            </a>
        </div>
    `).join('');

    document.getElementById('relatedGrid').innerHTML = html;
}

// Load reviews
async function loadReviews() {
    try {
        const reviewsRef = collection(db, 'reviews');
        const q = query(
            reviewsRef,
            where('productId', '==', currentProduct.id),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const reviews = [];

        querySnapshot.forEach(doc => {
            reviews.push({
                id: doc.id,
                ...doc.data()
            });
        });

        renderReviews(reviews);
        document.getElementById('reviewsSection').style.display = 'block';

    } catch (error) {
        console.error('Error loading reviews:', error);
        document.getElementById('reviewsSection').style.display = 'block';
    }
}

// Render reviews
function renderReviews(reviews) {
    const averageRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    // Update product rating
    const stars = '★'.repeat(Math.round(averageRating)) + '☆'.repeat(5 - Math.round(averageRating));
    document.querySelector('.product-rating .stars').textContent = stars;
    document.querySelector('.rating-count').textContent = `(${reviews.length} reviews)`;

    // Render summary
    const ratingCounts = [0, 0, 0, 0, 0];
    reviews.forEach(r => ratingCounts[r.rating - 1]++);

    const summaryHTML = `
        <div class="average-rating">
            <div class="average-score">${averageRating}</div>
            <div class="stars">${stars}</div>
            <div>${reviews.length} Reviews</div>
        </div>
        <div class="rating-bars">
            ${[5, 4, 3, 2, 1].map(rating => {
                const count = ratingCounts[rating - 1];
                const percentage = reviews.length > 0 ? (count / reviews.length * 100) : 0;
                return `
                    <div class="rating-bar">
                        <span class="bar-label">${rating} stars</span>
                        <div class="bar-fill">
                            <div class="bar-progress" style="width: ${percentage}%"></div>
                        </div>
                        <span class="bar-count">${count}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;

    document.getElementById('reviewsSummary').innerHTML = summaryHTML;

    // Render reviews list
    const reviewsHTML = reviews.map(review => `
        <div class="review-item">
            <div class="review-header">
                <div>
                    <div class="review-author">${review.userName || 'Anonymous'}</div>
                    <div class="review-stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                </div>
                <div class="review-date">${new Date(review.createdAt?.toDate()).toLocaleDateString()}</div>
            </div>
            <div class="review-title">${review.title}</div>
            <div class="review-text">${review.text}</div>
        </div>
    `).join('');

    document.getElementById('reviewsList').innerHTML = reviewsHTML || '<p>No reviews yet. Be the first to review!</p>';

    // Initialize review form
    initReviewForm();
}

// Initialize review form
function initReviewForm() {
    const stars = document.querySelectorAll('#starRatingInput .star');
    const ratingInput = document.getElementById('reviewRating');
    let selectedRating = 0;

    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            selectedRating = index + 1;
            ratingInput.value = selectedRating;
            updateStarDisplay(selectedRating);
        });

        star.addEventListener('mouseenter', () => {
            updateStarDisplay(index + 1);
        });
    });

    document.getElementById('starRatingInput').addEventListener('mouseleave', () => {
        updateStarDisplay(selectedRating);
    });

    function updateStarDisplay(rating) {
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    document.getElementById('reviewForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitReview();
    });
}

// Submit review
async function submitReview() {
    const rating = parseInt(document.getElementById('reviewRating').value);
    const title = document.getElementById('reviewTitle').value;
    const text = document.getElementById('reviewText').value;

    if (!rating) {
        showToast('Please select a rating');
        return;
    }

    try {
        const reviewData = {
            productId: currentProduct.id,
            userId: currentUser?.uid || null,
            userName: currentUser?.displayName || currentUser?.email || 'Anonymous',
            rating,
            title,
            text,
            createdAt: serverTimestamp()
        };

        await addDoc(collection(db, 'reviews'), reviewData);

        showToast('Review submitted successfully!');

        // Reset form
        document.getElementById('reviewForm').reset();
        document.getElementById('reviewRating').value = '';
        document.querySelectorAll('#starRatingInput .star').forEach(s => s.classList.remove('active'));

        // Reload reviews
        loadReviews();

    } catch (error) {
        console.error('Error submitting review:', error);
        showToast('Failed to submit review');
    }
}

// Update cart count in nav
function initCartCount() {
    const cart = JSON.parse(localStorage.getItem('chordeva_cart') || '[]');
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountEl = document.getElementById('navCartCount');
    if (cartCountEl) {
        cartCountEl.textContent = count;
    }
}

// Update account link
function updateAccountLink(user) {
    const accountLink = document.getElementById('accountLink');
    if (accountLink) {
        accountLink.textContent = user ? 'Account' : 'Login';
    }
}

// Mobile nav toggle
function initMobileNav() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    navToggle?.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Show error
function showError(message) {
    document.getElementById('productContent').innerHTML = `
        <div style="text-align: center; padding: 4rem; color: #ef4444;">
            <h2>${message}</h2>
            <p>Redirecting to shop...</p>
        </div>
    `;
}
