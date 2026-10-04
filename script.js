// ========================================
// WATCHSTORE - MAIN JAVASCRIPT
// ========================================

let products = [];

let cart = JSON.parse(
    localStorage.getItem("watchCart")
) || [];

let wishlist = JSON.parse(
    localStorage.getItem("watchWishlist")
) || [];

let selectedProductId = null;
let modalQuantity = 1;


// ========================================
// LOAD PRODUCTS
// ========================================

async function loadProducts() {

    try {

        const response = await fetch("/api/products");

        if (!response.ok) {
            throw new Error("Failed to load products");
        }

        products = await response.json();

        console.log("Products loaded:", products);

        displayProducts();

        updateCartUI();

        updateWishlistCount();

    } catch (error) {

        console.error(
            "Error loading products:",
            error
        );

        const productsGrid =
            document.getElementById("productsGrid");

        if (productsGrid) {

            productsGrid.innerHTML = `
                <div style="
                    grid-column: 1/-1;
                    text-align: center;
                    padding: 50px;
                ">
                    <h3>Unable to load products</h3>
                    <p>Please make sure Flask is running.</p>
                </div>
            `;
        }
    }
}


// ========================================
// FORMAT PRICE
// ========================================

function formatPrice(price) {

    return "Rs " + Number(price).toLocaleString("en-MU", {

        minimumFractionDigits: 0,

        maximumFractionDigits: 2

    });
}


// ========================================
// DISPLAY PRODUCTS
// ========================================

function displayProducts(productList = products) {

    const productsGrid =
        document.getElementById("productsGrid");

    if (!productsGrid) return;


    if (productList.length === 0) {

        productsGrid.innerHTML = `
            <div style="
                grid-column: 1/-1;
                text-align: center;
                padding: 50px;
            ">
                <h3>No products found</h3>
            </div>
        `;

        return;
    }


    productsGrid.innerHTML = productList.map(product => {

        const isWishlisted =
            wishlist.includes(Number(product.id));


        return `
            <div class="product-card">

                <div class="product-image">

                    <img
                        src="${product.image || ""}"
                        alt="${product.name}"
                        onerror="
                            this.src='https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80'
                        "
                    >

                    <button
                        type="button"
                        class="wishlist-btn ${isWishlisted ? "active" : ""}"
                        onclick="toggleWishlist(${product.id})"
                    >
                        <i class="${isWishlisted ? "fas" : "far"} fa-heart"></i>
                    </button>

                    <span class="product-category">
                        ${product.category}
                    </span>

                </div>


                <div class="product-info">

                    <div class="product-rating">

                        ${generateStars(product.rating)}

                        <span>
                            (${product.rating || 0})
                        </span>

                    </div>


                    <h3>
                        ${product.name}
                    </h3>


                    <p class="product-description">
                        ${product.description || ""}
                    </p>


                    <div class="product-bottom">

                        <span class="product-price">
                            ${formatPrice(product.price)}
                        </span>


                        <button
                            type="button"
                            class="add-cart-btn"
                            onclick="addToCart(${product.id})"
                            title="Add to Cart"
                        >
                            <i class="fas fa-shopping-bag"></i>
                        </button>

                    </div>

                </div>

            </div>
        `;

    }).join("");
}


// ========================================
// STAR RATING
// ========================================

function generateStars(rating) {

    rating = Number(rating) || 0;

    let stars = "";


    for (let i = 1; i <= 5; i++) {

        if (i <= Math.floor(rating)) {

            stars += `
                <i class="fas fa-star"></i>
            `;

        } else if (i - rating < 1) {

            stars += `
                <i class="fas fa-star-half-alt"></i>
            `;

        } else {

            stars += `
                <i class="far fa-star"></i>
            `;
        }
    }


    return stars;
}


// ========================================
// CATEGORY FILTER
// ========================================

function filterProducts(category) {

    document
        .querySelectorAll(".category-btn")
        .forEach(button => {

            button.classList.remove("active");

        });


    const button =
        document.querySelector(
            `.category-btn[data-category="${category}"]`
        );


    if (button) {

        button.classList.add("active");

    }


    if (category === "all") {

        displayProducts(products);

        return;
    }


    const filteredProducts =
        products.filter(product => {

            return String(product.category)
                .toLowerCase()
                === String(category).toLowerCase();

        });


    displayProducts(filteredProducts);
}


// ========================================
// ADD TO CART
// ========================================

function addToCart(productId, quantity = 1) {

    console.log(
        "ADD TO CART CLICKED:",
        productId
    );


    const product =
        products.find(product =>
            Number(product.id) === Number(productId)
        );


    if (!product) {

        console.error(
            "Product not found:",
            productId
        );

        showNotification(
            "Product not found"
        );

        return;
    }


    if (Number(product.stock) <= 0) {

        showNotification(
            "This product is out of stock"
        );

        return;
    }


    const existingItem =
        cart.find(item =>
            Number(item.id) === Number(productId)
        );


    if (existingItem) {

        const newQuantity =
            existingItem.quantity +
            Number(quantity);


        if (
            newQuantity >
            Number(product.stock)
        ) {

            showNotification(
                "Not enough stock available"
            );

            return;
        }


        existingItem.quantity =
            newQuantity;

    } else {

        if (
            Number(quantity) >
            Number(product.stock)
        ) {

            showNotification(
                "Not enough stock available"
            );

            return;
        }


        cart.push({

            id: Number(product.id),

            name: product.name,

            price: Number(product.price),

            image: product.image,

            quantity: Number(quantity)

        });
    }


    saveCart();

    updateCartUI();


    showNotification(
        product.name +
        " added to cart"
    );


    console.log(
        "CURRENT CART:",
        cart
    );
}


// ========================================
// REMOVE FROM CART
// ========================================

function removeFromCart(productId) {

    cart = cart.filter(item =>
        Number(item.id) !==
        Number(productId)
    );


    saveCart();

    updateCartUI();
}


// ========================================
// UPDATE CART QUANTITY
// ========================================

function updateCartQuantity(
    productId,
    change
) {

    const item =
        cart.find(item =>
            Number(item.id) ===
            Number(productId)
        );


    if (!item) return;


    item.quantity += Number(change);


    if (item.quantity <= 0) {

        removeFromCart(productId);

        return;
    }


    const product =
        products.find(product =>
            Number(product.id) ===
            Number(productId)
        );


    if (
        product &&
        item.quantity >
        Number(product.stock)
    ) {

        item.quantity =
            Number(product.stock);

        showNotification(
            "Maximum stock reached"
        );
    }


    saveCart();

    updateCartUI();
}


// ========================================
// SAVE CART
// ========================================

function saveCart() {

    localStorage.setItem(
        "watchCart",
        JSON.stringify(cart)
    );
}


// ========================================
// UPDATE CART UI
// ========================================

function updateCartUI() {

    const cartItems =
        document.getElementById("cartItems");

    const cartCount =
        document.getElementById("cartCount");

    const cartTotal =
        document.getElementById("cartTotal");


    let totalItems = 0;

    let totalPrice = 0;


    cart.forEach(item => {

        totalItems +=
            Number(item.quantity);

        totalPrice +=
            Number(item.price) *
            Number(item.quantity);

    });


    // CART COUNT

    if (cartCount) {

        cartCount.textContent =
            totalItems;

        cartCount.style.display =
            totalItems > 0
                ? "flex"
                : "none";
    }


    // CART ITEMS

    if (!cartItems) return;


    if (cart.length === 0) {

        cartItems.innerHTML = `
            <div class="empty-cart">

                <i class="fas fa-shopping-bag"></i>

                <h3>
                    Your cart is empty
                </h3>

                <p>
                    Add some watches to your cart.
                </p>

            </div>
        `;

    } else {

        cartItems.innerHTML =
            cart.map(item => {

                return `
                    <div class="cart-item">

                        <img
                            src="${item.image || ""}"
                            alt="${item.name}"
                        >


                        <div class="cart-item-info">

                            <h4>
                                ${item.name}
                            </h4>


                            <p>
                                ${formatPrice(item.price)}
                            </p>


                            <div class="cart-quantity">

                                <button
                                    type="button"
                                    onclick="updateCartQuantity(${item.id}, -1)"
                                >
                                    -
                                </button>


                                <span>
                                    ${item.quantity}
                                </span>


                                <button
                                    type="button"
                                    onclick="updateCartQuantity(${item.id}, 1)"
                                >
                                    +
                                </button>

                            </div>

                        </div>


                        <button
                            type="button"
                            class="remove-cart"
                            onclick="removeFromCart(${item.id})"
                        >
                            <i class="fas fa-trash"></i>
                        </button>

                    </div>
                `;

            }).join("");
    }


    // TOTAL

    if (cartTotal) {

        cartTotal.textContent =
            formatPrice(totalPrice);

    }
}


// ========================================
// OPEN CART
// ========================================

function openCart() {

    const cartSidebar =
        document.getElementById("cartSidebar");

    const cartOverlay =
        document.getElementById("cartOverlay");


    if (cartSidebar) {

        cartSidebar.classList.add("active");

    }


    if (cartOverlay) {

        cartOverlay.classList.add("active");

    }
}


// ========================================
// CLOSE CART
// ========================================

function closeCart() {

    const cartSidebar =
        document.getElementById("cartSidebar");

    const cartOverlay =
        document.getElementById("cartOverlay");


    if (cartSidebar) {

        cartSidebar.classList.remove("active");

    }


    if (cartOverlay) {

        cartOverlay.classList.remove("active");

    }
}


// ========================================
// PRODUCT MODAL
// ========================================

function openProductModal(productId) {

    const product =
        products.find(product =>
            Number(product.id) ===
            Number(productId)
        );


    if (!product) return;


    const modal =
        document.getElementById(
            "productModal"
        );


    if (!modal) return;


    selectedProductId =
        Number(product.id);


    modalQuantity = 1;


    const modalImage =
        document.getElementById(
            "modalImage"
        );

    const modalCategory =
        document.getElementById(
            "modalCategory"
        );

    const modalName =
        document.getElementById(
            "modalName"
        );

    const modalRating =
        document.getElementById(
            "modalRating"
        );

    const modalPrice =
        document.getElementById(
            "modalPrice"
        );

    const modalDescription =
        document.getElementById(
            "modalDescription"
        );

    const quantityValue =
        document.getElementById(
            "quantityValue"
        );


    if (modalImage) {

        modalImage.src =
            product.image || "";

        modalImage.alt =
            product.name;

    }


    if (modalCategory) {

        modalCategory.textContent =
            product.category;

    }


    if (modalName) {

        modalName.textContent =
            product.name;

    }


    if (modalRating) {

        modalRating.innerHTML =
            generateStars(
                product.rating
            );

    }


    if (modalPrice) {

        modalPrice.textContent =
            formatPrice(
                product.price
            );

    }


    if (modalDescription) {

        modalDescription.textContent =
            product.description || "";

    }


    if (quantityValue) {

        quantityValue.textContent =
            modalQuantity;

    }


    modal.classList.add("active");
}


// ========================================
// CLOSE PRODUCT MODAL
// ========================================

function closeProductModal() {

    const modal =
        document.getElementById(
            "productModal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );
    }
}


// ========================================
// MODAL QUANTITY
// ========================================

function changeModalQuantity(change) {

    const product =
        products.find(product =>
            Number(product.id) ===
            Number(selectedProductId)
        );


    if (!product) return;


    modalQuantity +=
        Number(change);


    if (modalQuantity < 1) {

        modalQuantity = 1;

    }


    if (
        product.stock &&
        modalQuantity >
        Number(product.stock)
    ) {

        modalQuantity =
            Number(product.stock);

    }


    const quantityValue =
        document.getElementById(
            "quantityValue"
        );


    if (quantityValue) {

        quantityValue.textContent =
            modalQuantity;

    }
}


// ========================================
// ADD MODAL PRODUCT TO CART
// ========================================

function addModalProductToCart() {

    if (!selectedProductId) return;


    addToCart(
        selectedProductId,
        modalQuantity
    );


    closeProductModal();
}


// ========================================
// WISHLIST
// ========================================

function toggleWishlist(productId) {

    productId =
        Number(productId);


    const index =
        wishlist.indexOf(productId);


    if (index !== -1) {

        wishlist.splice(
            index,
            1
        );

        showNotification(
            "Removed from wishlist"
        );

    } else {

        wishlist.push(
            productId
        );

        showNotification(
            "Added to wishlist"
        );
    }


    localStorage.setItem(
        "watchWishlist",
        JSON.stringify(wishlist)
    );


    updateWishlistCount();

    displayProducts();
}


// ========================================
// WISHLIST COUNT
// ========================================

function updateWishlistCount() {

    const wishlistCount =
        document.getElementById(
            "wishlistCount"
        );


    if (wishlistCount) {

        wishlistCount.textContent =
            wishlist.length;

    }
}


// ========================================
// SEARCH
// ========================================

function openSearch() {

    const searchOverlay =
        document.getElementById(
            "searchOverlay"
        );


    if (!searchOverlay) return;


    searchOverlay.classList.add(
        "active"
    );


    const searchInput =
        document.getElementById(
            "searchInput"
        );


    if (searchInput) {

        setTimeout(() => {

            searchInput.focus();

        }, 200);
    }
}


function closeSearch() {

    const searchOverlay =
        document.getElementById(
            "searchOverlay"
        );


    if (searchOverlay) {

        searchOverlay.classList.remove(
            "active"
        );

    }
}


function searchProducts() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );


    if (!searchInput) return;


    const searchTerm =
        searchInput.value
            .toLowerCase()
            .trim();


    if (searchTerm === "") {

        displayProducts();

        return;
    }


    const results =
        products.filter(product => {

            return (

                product.name
                    .toLowerCase()
                    .includes(searchTerm)

                ||

                product.category
                    .toLowerCase()
                    .includes(searchTerm)

                ||

                (product.description || "")
                    .toLowerCase()
                    .includes(searchTerm)

            );

        });


    displayProducts(results);
}


// ========================================
// MOBILE MENU
// ========================================

function toggleMobileMenu() {

    const navbar =
        document.getElementById(
            "navbar"
        );


    if (navbar) {

        navbar.classList.toggle(
            "active"
        );

    }
}


// ========================================
// NEWSLETTER
// ========================================

function subscribeNewsletter(event) {

    if (event) {

        event.preventDefault();

    }


    const emailInput =
        document.getElementById(
            "newsletterEmail"
        );


    if (!emailInput) return;


    const email =
        emailInput.value.trim();


    if (email === "") {

        showNotification(
            "Please enter your email"
        );

        return;
    }


    showNotification(
        "Thank you for subscribing!"
    );


    emailInput.value = "";
}


// ========================================
// CHECKOUT - SHOW CUSTOMER FORM
// ========================================

function checkout() {

    if (cart.length === 0) {

        showNotification(
            "Your cart is empty"
        );

        return;
    }


    const checkoutForm =
        document.getElementById(
            "checkoutForm"
        );


    if (checkoutForm) {

        checkoutForm.classList.add(
            "active"
        );

    }


    const customerName =
        document.getElementById(
            "customerName"
        );


    if (customerName) {

        customerName.focus();

    }
}


// ========================================
// PLACE ORDER
// ========================================

async function placeOrder() {

    if (cart.length === 0) {

        showNotification(
            "Your cart is empty"
        );

        return;
    }


    const customerNameInput =
        document.getElementById(
            "customerName"
        );


    const customerEmailInput =
        document.getElementById(
            "customerEmail"
        );


    if (
        !customerNameInput ||
        !customerEmailInput
    ) {

        showNotification(
            "Checkout form not found"
        );

        return;
    }


    const customerName =
        customerNameInput.value.trim();


    const customerEmail =
        customerEmailInput.value.trim();


    // ========================================
    // VALIDATE NAME
    // ========================================

    if (customerName === "") {

        showNotification(
            "Please enter your full name"
        );

        customerNameInput.focus();

        return;
    }


    // ========================================
    // VALIDATE EMAIL
    // ========================================

    if (customerEmail === "") {

        showNotification(
            "Please enter your email address"
        );

        customerEmailInput.focus();

        return;
    }


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
        !emailPattern.test(
            customerEmail
        )
    ) {

        showNotification(
            "Please enter a valid email address"
        );

        customerEmailInput.focus();

        return;
    }


    // ========================================
    // DISABLE BUTTON
    // ========================================

    const placeOrderBtn =
        document.getElementById(
            "placeOrderBtn"
        );


    if (placeOrderBtn) {

        placeOrderBtn.disabled = true;

        placeOrderBtn.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            Processing...
        `;
    }


    try {

        showNotification(
            "Processing your order..."
        );


        // ========================================
        // SEND ORDER TO FLASK
        // ========================================

        const response =
            await fetch(
                "/api/orders",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        customer_name:
                            customerName,

                        customer_email:
                            customerEmail,

                        items:
                            cart.map(item => ({

                                id:
                                    Number(item.id),

                                quantity:
                                    Number(item.quantity)

                            }))

                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to create order"
            );
        }


        // ========================================
        // SAVE ORDER INFORMATION
        // ========================================

        const orderNumber =
            "ORD-" + data.order_id;


        const orderTotal =
            formatPrice(data.total);


        // ========================================
        // CLEAR CART
        // ========================================

        cart = [];


        saveCart();

        updateCartUI();


        // ========================================
        // CLEAR CHECKOUT FORM
        // ========================================

        customerNameInput.value = "";

        customerEmailInput.value = "";


        const checkoutForm =
            document.getElementById(
                "checkoutForm"
            );


        if (checkoutForm) {

            checkoutForm.classList.remove(
                "active"
            );
        }


        // ========================================
        // CLOSE CART
        // ========================================

        closeCart();


        // ========================================
        // RELOAD PRODUCTS
        // ========================================

        await loadProducts();


        // ========================================
        // SHOW SUCCESS SCREEN
        // ========================================

        showOrderSuccess(
            orderNumber,
            orderTotal
        );


    } catch (error) {

        console.error(
            "Checkout error:",
            error
        );


        showNotification(
            error.message
        );


    } finally {

        // ========================================
        // RESTORE BUTTON
        // ========================================

        if (placeOrderBtn) {

            placeOrderBtn.disabled = false;

            placeOrderBtn.innerHTML = `
                <i class="fa-solid fa-check"></i>
                Place Order
            `;
        }
    }
}


// ========================================
// ORDER SUCCESS POPUP
// ========================================

function showOrderSuccess(
    orderNumber,
    orderTotal
) {

    // Remove old success popup if it exists

    const oldPopup =
        document.getElementById(
            "orderSuccessPopup"
        );


    if (oldPopup) {

        oldPopup.remove();

    }


    // ========================================
    // CREATE POPUP
    // ========================================

    const popup =
        document.createElement("div");


    popup.id =
        "orderSuccessPopup";


    popup.innerHTML = `

        <div class="order-success-overlay">

            <div class="order-success-box">

                <button
                    type="button"
                    class="order-success-close"
                    id="closeOrderSuccess"
                >
                    <i class="fas fa-times"></i>
                </button>


                <div class="success-icon">

                    <i class="fas fa-check"></i>

                </div>


                <h2>
                    Order Confirmed!
                </h2>


                <p class="success-message">

                    Thank you for shopping with
                    <strong>WATCHSTORE</strong>.

                    Your order has been successfully
                    placed.

                </p>


                <div class="order-success-details">

                    <div class="success-detail">

                        <span>
                            Order Number
                        </span>

                        <strong>
                            ${orderNumber}
                        </strong>

                    </div>


                    <div class="success-detail">

                        <span>
                            Total Amount
                        </span>

                        <strong>
                            ${orderTotal}
                        </strong>

                    </div>

                </div>


                <div class="success-info">

                    <i class="fas fa-info-circle"></i>

                    <span>
                        We have received your order
                        and will process it shortly.
                    </span>

                </div>


                <button
                    type="button"
                    class="success-continue-btn"
                    id="continueShoppingBtn"
                >
                    Continue Shopping
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        popup
    );


    // ========================================
    // CLOSE BUTTON
    // ========================================

    const closeButton =
        document.getElementById(
            "closeOrderSuccess"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeOrderSuccess
        );

    }


    // ========================================
    // CONTINUE SHOPPING
    // ========================================

    const continueButton =
        document.getElementById(
            "continueShoppingBtn"
        );


    if (continueButton) {

        continueButton.addEventListener(
            "click",
            closeOrderSuccess
        );

    }


    // ========================================
    // CLICK OUTSIDE
    // ========================================

    const overlay =
        popup.querySelector(
            ".order-success-overlay"
        );


    if (overlay) {

        overlay.addEventListener(
            "click",
            function(event) {

                if (
                    event.target === overlay
                ) {

                    closeOrderSuccess();

                }

            }
        );
    }


    // ========================================
    // ESCAPE KEY
    // ========================================

    document.addEventListener(
        "keydown",
        handleSuccessEscape
    );
}


// ========================================
// CLOSE ORDER SUCCESS
// ========================================

function closeOrderSuccess() {

    const popup =
        document.getElementById(
            "orderSuccessPopup"
        );


    if (popup) {

        popup.remove();

    }


    document.removeEventListener(
        "keydown",
        handleSuccessEscape
    );
}


// ========================================
// ESCAPE SUCCESS POPUP
// ========================================

function handleSuccessEscape(event) {

    if (event.key === "Escape") {

        closeOrderSuccess();

    }
}


// ========================================
// NOTIFICATION
// ========================================

function showNotification(message) {

    let notification =
        document.getElementById(
            "notification"
        );


    let notificationText =
        document.getElementById(
            "notificationText"
        );


    if (
        notification &&
        notificationText
    ) {

        notificationText.textContent =
            message;


        notification.classList.add(
            "show"
        );


        clearTimeout(
            notification.notificationTimer
        );


        notification.notificationTimer =
            setTimeout(() => {

                notification.classList.remove(
                    "show"
                );

            }, 3000);


        return;
    }


    // ========================================
    // FALLBACK NOTIFICATION
    // ========================================

    if (!notification) {

        notification =
            document.createElement(
                "div"
            );


        notification.id =
            "notification";


        notification.style.position =
            "fixed";

        notification.style.bottom =
            "30px";

        notification.style.right =
            "30px";

        notification.style.padding =
            "15px 25px";

        notification.style.background =
            "#111";

        notification.style.color =
            "#d4af37";

        notification.style.border =
            "1px solid #d4af37";

        notification.style.borderRadius =
            "5px";

        notification.style.zIndex =
            "99999";


        document.body.appendChild(
            notification
        );
    }


    notification.textContent =
        message;


    notification.style.display =
        "block";


    clearTimeout(
        notification.notificationTimer
    );


    notification.notificationTimer =
        setTimeout(() => {

            notification.style.display =
                "none";

        }, 3000);
}


// ========================================
// PAGE INITIALIZATION
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    function() {


        // ========================================
        // LOAD PRODUCTS
        // ========================================

        loadProducts();


        // ========================================
        // CART
        // ========================================

        updateCartUI();


        // ========================================
        // WISHLIST
        // ========================================

        updateWishlistCount();


        // ========================================
        // CART BUTTON
        // ========================================

        const cartBtn =
            document.getElementById(
                "cartBtn"
            );


        if (cartBtn) {

            cartBtn.addEventListener(
                "click",
                openCart
            );

        }


        // ========================================
        // CLOSE CART
        // ========================================

        const closeCartBtn =
            document.getElementById(
                "closeCart"
            );


        if (closeCartBtn) {

            closeCartBtn.addEventListener(
                "click",
                closeCart
            );

        }


        // ========================================
        // CART OVERLAY
        // ========================================

        const cartOverlay =
            document.getElementById(
                "cartOverlay"
            );


        if (cartOverlay) {

            cartOverlay.addEventListener(
                "click",
                closeCart
            );

        }


        // ========================================
        // SEARCH
        // ========================================

        const searchBtn =
            document.getElementById(
                "searchBtn"
            );


        if (searchBtn) {

            searchBtn.addEventListener(
                "click",
                openSearch
            );

        }


        const closeSearchBtn =
            document.getElementById(
                "closeSearch"
            );


        if (closeSearchBtn) {

            closeSearchBtn.addEventListener(
                "click",
                closeSearch
            );

        }


        const searchInput =
            document.getElementById(
                "searchInput"
            );


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                searchProducts
            );

        }


        // ========================================
        // MOBILE MENU
        // ========================================

        const mobileMenuBtn =
            document.getElementById(
                "mobileMenuBtn"
            );


        if (mobileMenuBtn) {

            mobileMenuBtn.addEventListener(
                "click",
                toggleMobileMenu
            );

        }


        // ========================================
        // PRODUCT MODAL
        // ========================================

        const modalClose =
            document.getElementById(
                "modalClose"
            );


        if (modalClose) {

            modalClose.addEventListener(
                "click",
                closeProductModal
            );

        }


        const quantityMinus =
            document.getElementById(
                "quantityMinus"
            );


        if (quantityMinus) {

            quantityMinus.addEventListener(
                "click",
                function() {

                    changeModalQuantity(-1);

                }
            );

        }


        const quantityPlus =
            document.getElementById(
                "quantityPlus"
            );


        if (quantityPlus) {

            quantityPlus.addEventListener(
                "click",
                function() {

                    changeModalQuantity(1);

                }
            );

        }


        const addModalCart =
            document.getElementById(
                "addModalCart"
            );


        if (addModalCart) {

            addModalCart.addEventListener(
                "click",
                addModalProductToCart
            );

        }


        // ========================================
        // CATEGORY BUTTONS
        // ========================================

        document
            .querySelectorAll(".category-btn")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    function() {

                        filterProducts(
                            this.dataset.category
                        );

                    }
                );

            });


        // ========================================
        // NEWSLETTER
        // ========================================

        const newsletterForm =
            document.getElementById(
                "newsletterForm"
            );


        if (newsletterForm) {

            newsletterForm.addEventListener(
                "submit",
                subscribeNewsletter
            );

        }


        // ========================================
        // PROCEED TO CHECKOUT
        // ========================================

        const checkoutBtn =
            document.getElementById(
                "checkoutBtn"
            );


        if (checkoutBtn) {

            checkoutBtn.addEventListener(
                "click",
                checkout
            );

        }


        // ========================================
        // PLACE ORDER
        // ========================================

        const placeOrderBtn =
            document.getElementById(
                "placeOrderBtn"
            );


        if (placeOrderBtn) {

            placeOrderBtn.addEventListener(
                "click",
                placeOrder
            );

        }


        // ========================================
        // CLOSE PRODUCT MODAL
        // WHEN CLICKING OUTSIDE
        // ========================================

        const productModal =
            document.getElementById(
                "productModal"
            );


        if (productModal) {

            productModal.addEventListener(
                "click",
                function(event) {

                    if (
                        event.target ===
                        productModal
                    ) {

                        closeProductModal();

                    }

                }
            );

        }


        // ========================================
        // ESCAPE KEY
        // ========================================

        document.addEventListener(
            "keydown",
            function(event) {

                if (event.key === "Escape") {

                    closeSearch();

                    closeProductModal();

                    closeCart();

                }

            }
        );


        console.log(
            "WATCHSTORE initialized successfully."
        );

    }
);