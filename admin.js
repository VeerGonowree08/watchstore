// ========================================
// WATCHSTORE ADMIN JAVASCRIPT
// ========================================


// ========================================
// GLOBAL VARIABLES
// ========================================

let products = [];
let orders = [];
let customers = [];

let editingProductId = null;


// ========================================
// PAGE INITIALIZATION
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    setupNavigation();

    setupProductButton();

    setupProductForm();

    setupOrderFilter();

    loadDashboard();

    loadProducts();

    loadOrders();

    loadCustomers();

});


// ========================================
// SIDEBAR NAVIGATION
// ========================================

function setupNavigation() {

    const navLinks =
        document.querySelectorAll(".nav-link");

    navLinks.forEach(link => {

        link.addEventListener("click", function (event) {

            event.preventDefault();

            const section =
                this.getAttribute("data-section");

            if (section) {

                showSection(section);

            }

        });

    });

}


// ========================================
// SHOW SECTION
// ========================================

function showSection(sectionId) {

    const sections =
        document.querySelectorAll(".content-section");

    sections.forEach(section => {

        section.classList.remove("active-section");

    });


    const selectedSection =
        document.getElementById(sectionId);

    if (selectedSection) {

        selectedSection.classList.add("active-section");

    }


    // Update sidebar

    const navLinks =
        document.querySelectorAll(".nav-link");

    navLinks.forEach(link => {

        link.classList.remove("active");

        if (
            link.getAttribute("data-section") ===
            sectionId
        ) {

            link.classList.add("active");

        }

    });


    // Update page title

    const pageTitle =
        document.getElementById("pageTitle");

    const titles = {

        dashboard: "Dashboard",

        products: "Products",

        orders: "Orders",

        customers: "Customers",

        settings: "Settings"

    };


    if (pageTitle) {

        pageTitle.textContent =
            titles[sectionId] || "Dashboard";

    }


    // Load section data

    if (sectionId === "dashboard") {

        loadDashboard();

    }

    if (sectionId === "products") {

        loadProducts();

    }

    if (sectionId === "orders") {

        loadOrders();

    }

    if (sectionId === "customers") {

        loadCustomers();

    }

}


// ========================================
// MOBILE SIDEBAR
// ========================================

function toggleSidebar() {

    const sidebar =
        document.querySelector(".sidebar");

    if (sidebar) {

        sidebar.classList.toggle("open");

    }

}


// ========================================
// PRODUCT BUTTON
// ========================================

function setupProductButton() {

    const button =
        document.getElementById("addProductBtn");

    if (button) {

        button.addEventListener(
            "click",
            openProductForm
        );

    }

}


// ========================================
// PRODUCT FORM
// ========================================

function setupProductForm() {

    const form =
        document.getElementById("productForm");

    if (!form) {

        return;

    }

    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            saveProduct();

        }
    );

}


// ========================================
// OPEN PRODUCT FORM
// ========================================

function openProductForm() {

    editingProductId = null;

    const modal =
        document.getElementById("productModal");

    const title =
        document.getElementById("modalTitle");

    if (title) {

        title.textContent = "Add Product";

    }

    clearProductForm();

    if (modal) {

        modal.classList.add("active");

    }

}


// ========================================
// CLOSE PRODUCT FORM
// ========================================

function closeProductForm() {

    const modal =
        document.getElementById("productModal");

    if (modal) {

        modal.classList.remove("active");

    }

    editingProductId = null;

}


// Compatibility with old function name

function closeProductModal() {

    closeProductForm();

}


// ========================================
// CLEAR PRODUCT FORM
// ========================================

function clearProductForm() {

    const fields = [

        "productName",

        "productPrice",

        "productStock",

        "productCategory",

        "productImage",

        "productDescription"

    ];


    fields.forEach(id => {

        const element =
            document.getElementById(id);

        if (element) {

            element.value = "";

        }

    });


    const rating =
        document.getElementById("productRating");

    if (rating) {

        rating.value = "5";

    }


    const editId =
        document.getElementById("editProductId");

    if (editId) {

        editId.value = "";

    }

}


// ========================================
// DASHBOARD
// ========================================

async function loadDashboard() {

    try {

        const [
            productsResponse,
            ordersResponse,
            customersResponse
        ] = await Promise.all([

            fetch("/api/products"),

            fetch("/api/orders"),

            fetch("/api/customers")

        ]);


        products =
            await productsResponse.json();

        orders =
            await ordersResponse.json();

        customers =
            await customersResponse.json();


        // Products

        const totalProducts =
            document.getElementById("totalProducts");

        if (totalProducts) {

            totalProducts.textContent =
                products.length;

        }


        // Orders

        const totalOrders =
            document.getElementById("totalOrders");

        if (totalOrders) {

            totalOrders.textContent =
                orders.length;

        }


        // Customers

        const totalCustomers =
            document.getElementById("totalCustomers");

        if (totalCustomers) {

            totalCustomers.textContent =
                customers.length;

        }


        // Revenue

        const totalRevenue =
            document.getElementById("totalRevenue");

        if (totalRevenue) {

            const revenue =
                orders.reduce(
                    (sum, order) =>
                        sum +
                        Number(order.total || 0),
                    0
                );

            totalRevenue.textContent =
                "Rs " +
                revenue.toLocaleString();

        }


        displayRecentOrders();

        displayTopProducts();


    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

    }

}


// ========================================
// RECENT ORDERS
// ========================================

function displayRecentOrders() {

    const table =
        document.getElementById("recentOrdersTable");

    if (!table) {

        return;

    }

    table.innerHTML = "";

    const recentOrders =
        orders.slice(0, 5);

    if (recentOrders.length === 0) {

        table.innerHTML = `

            <tr>

                <td colspan="5">
                    No orders found
                </td>

            </tr>

        `;

        return;

    }


    recentOrders.forEach(order => {

        const row =
            document.createElement("tr");

        row.innerHTML = `

            <td>
                #${order.id}
            </td>

            <td>
                ${escapeHtml(
                    order.customer || "Guest"
                )}
            </td>

            <td>
                ${escapeHtml(
                    order.product || "Order"
                )}
            </td>

            <td>
                Rs ${Number(
                    order.total || 0
                ).toLocaleString()}
            </td>

            <td>
                ${createOrderStatusDropdown(order)}
            </td>

        `;

        table.appendChild(row);

    });

}


// ========================================
// TOP PRODUCTS
// ========================================

function displayTopProducts() {

    const container =
        document.getElementById("topProductsList");

    if (!container) {

        return;

    }

    container.innerHTML = "";

    const topProducts =
        products.slice(0, 5);

    if (topProducts.length === 0) {

        container.innerHTML =
            "<p>No products available.</p>";

        return;

    }


    topProducts.forEach(product => {

        const item =
            document.createElement("div");

        item.className =
            "top-product-item";

        item.innerHTML = `

            <div>

                <strong>
                    ${escapeHtml(product.name)}
                </strong>

                <span>
                    ${escapeHtml(product.category)}
                </span>

            </div>

            <strong>
                Rs ${Number(
                    product.price
                ).toLocaleString()}
            </strong>

        `;

        container.appendChild(item);

    });

}


// ========================================
// PRODUCTS
// ========================================

async function loadProducts() {

    try {

        const response =
            await fetch("/api/products");

        if (!response.ok) {

            throw new Error(
                "Failed to load products"
            );

        }

        products =
            await response.json();

        displayProducts();

        displayTopProducts();


    } catch (error) {

        console.error(
            "Products error:",
            error
        );

    }

}


// ========================================
// DISPLAY PRODUCTS
// ========================================

function displayProducts(
    productList = products
) {

    const table =
        document.getElementById("productsTable");

    if (!table) {

        return;

    }

    table.innerHTML = "";

    if (productList.length === 0) {

        table.innerHTML = `

            <tr>

                <td colspan="6">
                    No products found
                </td>

            </tr>

        `;

        return;

    }


    productList.forEach(product => {

        const row =
            document.createElement("tr");

        let status = "In Stock";

        if (Number(product.stock) === 0) {

            status = "Out of Stock";

        } else if (
            Number(product.stock) <= 5
        ) {

            status = "Low Stock";

        }


        row.innerHTML = `

            <td>

                <div class="product-cell">

                    ${
                        product.image
                        ?
                        `
                        <img
                            src="${escapeAttribute(product.image)}"
                            class="product-table-image"
                            onerror="this.style.display='none'"
                        >
                        `
                        :
                        `
                        <div class="product-placeholder">
                            <i class="fa-solid fa-clock"></i>
                        </div>
                        `
                    }

                    <div>

                        <strong>
                            ${escapeHtml(product.name)}
                        </strong>

                        <span>
                            ⭐ ${product.rating || 0}
                        </span>

                    </div>

                </div>

            </td>

            <td>
                ${escapeHtml(product.category)}
            </td>

            <td>
                Rs ${Number(
                    product.price
                ).toLocaleString()}
            </td>

            <td>
                ${product.stock}
            </td>

            <td>

                <span class="status-badge">
                    ${status}
                </span>

            </td>

            <td>

                <button
                    type="button"
                    class="action-btn edit-btn"
                    onclick="editProduct(${product.id})"
                    title="Edit Product"
                >

                    <i class="fa-solid fa-pen"></i>

                </button>

                <button
                    type="button"
                    class="action-btn delete-btn"
                    onclick="deleteProduct(${product.id})"
                    title="Delete Product"
                >

                    <i class="fa-solid fa-trash"></i>

                </button>

            </td>

        `;

        table.appendChild(row);

    });

}


// ========================================
// SEARCH PRODUCTS
// ========================================

function searchProducts() {

    const input =
        document.getElementById("productSearch");

    const search =
        input
        ?
        input.value.toLowerCase().trim()
        :
        "";

    const filtered =
        products.filter(product =>

            String(product.name || "")
                .toLowerCase()
                .includes(search)

            ||

            String(product.category || "")
                .toLowerCase()
                .includes(search)

        );

    displayProducts(filtered);

}


// ========================================
// FILTER PRODUCTS
// ========================================

function filterProducts() {

    const filter =
        document.getElementById("categoryFilter");

    const value =
        filter
        ?
        filter.value
        :
        "all";

    if (value === "all") {

        displayProducts(products);

        return;

    }


    const filtered =
        products.filter(
            product =>
                String(product.category || "")
                    .toLowerCase() ===
                value.toLowerCase()
        );

    displayProducts(filtered);

}


// ========================================
// EDIT PRODUCT
// ========================================

function editProduct(productId) {

    const product =
        products.find(
            item =>
                Number(item.id) ===
                Number(productId)
        );

    if (!product) {

        alert("Product not found.");

        return;

    }


    editingProductId =
        productId;


    const title =
        document.getElementById("modalTitle");

    if (title) {

        title.textContent =
            "Edit Product";

    }


    const productName =
        document.getElementById("productName");

    const productPrice =
        document.getElementById("productPrice");

    const productStock =
        document.getElementById("productStock");

    const productCategory =
        document.getElementById("productCategory");

    const productRating =
        document.getElementById("productRating");

    const productImage =
        document.getElementById("productImage");

    const productDescription =
        document.getElementById("productDescription");


    if (productName)
        productName.value = product.name || "";

    if (productPrice)
        productPrice.value = product.price || "";

    if (productStock)
        productStock.value = product.stock || "";

    if (productCategory)
        productCategory.value = product.category || "";

    if (productRating)
        productRating.value = product.rating || "5";

    if (productImage)
        productImage.value = product.image || "";

    if (productDescription)
        productDescription.value =
            product.description || "";


    const editId =
        document.getElementById("editProductId");

    if (editId) {

        editId.value =
            productId;

    }


    const modal =
        document.getElementById("productModal");

    if (modal) {

        modal.classList.add("active");

    }

}


// ========================================
// SAVE PRODUCT
// ========================================

async function saveProduct() {

    const name =
        document.getElementById(
            "productName"
        ).value.trim();

    const price =
        document.getElementById(
            "productPrice"
        ).value;

    const stock =
        document.getElementById(
            "productStock"
        ).value;

    const category =
        document.getElementById(
            "productCategory"
        ).value;

    const rating =
        document.getElementById(
            "productRating"
        ).value;

    const image =
        document.getElementById(
            "productImage"
        ).value.trim();

    const description =
        document.getElementById(
            "productDescription"
        ).value.trim();


    if (
        !name ||
        !price ||
        stock === "" ||
        !category ||
        !image
    ) {

        alert(
            "Please fill in all required fields."
        );

        return;

    }


    const productData = {

        name: name,

        price: Number(price),

        stock: Number(stock),

        category: category,

        rating: Number(
            rating || 0
        ),

        image: image,

        description: description

    };


    try {

        let response;

        if (editingProductId) {

            response =
                await fetch(
                    `/api/products/${editingProductId}`,
                    {

                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                productData
                            )

                    }
                );

        } else {

            response =
                await fetch(
                    "/api/products",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                productData
                            )

                    }
                );

        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "Unable to save product."
            );

        }


        alert(
            editingProductId
            ?
            "Product updated successfully!"
            :
            "Product added successfully!"
        );


        closeProductForm();

        await loadProducts();

        await loadDashboard();


    } catch (error) {

        console.error(
            "Save product error:",
            error
        );

        alert(error.message);

    }

}


// ========================================
// DELETE PRODUCT
// ========================================

async function deleteProduct(productId) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this product?"
        );

    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                `/api/products/${productId}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "Unable to delete product."
            );

        }


        alert(
            "Product deleted successfully!"
        );


        await loadProducts();

        await loadDashboard();


    } catch (error) {

        console.error(
            "Delete product error:",
            error
        );

        alert(error.message);

    }

}


// ========================================
// ORDERS
// ========================================

async function loadOrders() {

    try {

        const response =
            await fetch("/api/orders");

        if (!response.ok) {

            throw new Error(
                "Failed to load orders."
            );

        }

        orders =
            await response.json();

        displayOrders();

        displayRecentOrders();


    } catch (error) {

        console.error(
            "Orders error:",
            error
        );

    }

}


// ========================================
// DISPLAY ORDERS
// ========================================

function displayOrders(
    orderList = orders
) {

    const table =
        document.getElementById("ordersTable");

    if (!table) {

        return;

    }

    table.innerHTML = "";


    if (orderList.length === 0) {

        table.innerHTML = `

            <tr>

                <td colspan="7">
                    No orders found
                </td>

            </tr>

        `;

        return;

    }


    orderList.forEach(order => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                #${order.id}
            </td>

            <td>
                ${escapeHtml(
                    order.customer || "Guest"
                )}
            </td>

            <td>
                ${escapeHtml(
                    order.product || "Order"
                )}
            </td>

            <td>
                ${formatDate(
                    order.order_date
                )}
            </td>

            <td>
                Rs ${Number(
                    order.total || 0
                ).toLocaleString()}
            </td>

            <td>
                ${createOrderStatusDropdown(order)}
            </td>

            <td>

                <button
                    type="button"
                    class="action-btn view-btn"
                    title="View Order Details"
                >

                    <i class="fa-solid fa-eye"></i>

                </button>

            </td>

        `;


        // ========================================
        // EYE BUTTON - DIRECT EVENT LISTENER
        // ========================================

        const viewButton =
            row.querySelector(".view-btn");


        if (viewButton) {

            viewButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    event.stopPropagation();

                    console.log(
                        "Eye button clicked. Order ID:",
                        order.id
                    );

                    viewOrderDetails(order.id);

                }
            );

        }


        table.appendChild(row);

    });

}


// ========================================
// SEARCH ORDERS
// ========================================

function searchOrders() {

    const input =
        document.getElementById("orderSearch");

    const search =
        input
        ?
        input.value.toLowerCase().trim()
        :
        "";


    const filtered =
        orders.filter(order =>

            String(order.id)
                .includes(search)

            ||

            String(order.customer || "")
                .toLowerCase()
                .includes(search)

            ||

            String(order.product || "")
                .toLowerCase()
                .includes(search)

        );


    displayOrders(filtered);

}


// ========================================
// FILTER ORDERS
// ========================================

function filterOrders() {

    const filter =
        document.getElementById(
            "orderStatusFilter"
        );

    const value =
        filter
        ?
        filter.value
        :
        "all";


    if (
        value === "all" ||
        value === "All"
    ) {

        displayOrders(orders);

        return;

    }


    const filtered =
        orders.filter(
            order =>
                order.status === value
        );


    displayOrders(filtered);

}


// ========================================
// SETUP ORDER FILTER
// ========================================

function setupOrderFilter() {

    const filter =
        document.getElementById(
            "orderStatusFilter"
        );

    if (!filter) {

        return;

    }


    filter.addEventListener(
        "change",
        filterOrders
    );

}


// ========================================
// ORDER STATUS DROPDOWN
// ========================================

function createOrderStatusDropdown(order) {

    const statuses = [

        "Pending",

        "Processing",

        "Shipped",

        "Delivered",

        "Cancelled"

    ];


    let html = `

        <select
            class="order-status-select"
            onchange="updateOrderStatus(
                ${order.id},
                this.value
            )"
        >

    `;


    statuses.forEach(status => {

        html += `

            <option
                value="${status}"
                ${
                    order.status === status
                    ?
                    "selected"
                    :
                    ""
                }
            >
                ${status}
            </option>

        `;

    });


    html += `

        </select>

    `;


    return html;

}


// ========================================
// UPDATE ORDER STATUS
// ========================================

async function updateOrderStatus(
    orderId,
    status
) {

    try {

        const response =
            await fetch(
                `/api/orders/${orderId}/status`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            status: status
                        })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.error ||
                "Unable to update order."
            );

        }


        const order =
            orders.find(
                item =>
                    Number(item.id) ===
                    Number(orderId)
            );


        if (order) {

            order.status =
                status;

        }


        displayOrders();

        displayRecentOrders();


    } catch (error) {

        console.error(
            "Order status error:",
            error
        );


        alert(error.message);

        loadOrders();

    }

}


// ========================================
// VIEW ORDER DETAILS
// ========================================

async function viewOrderDetails(
    orderId
) {

    console.log(
        "Viewing order:",
        orderId
    );


    try {

        const response =
            await fetch(
                `/api/orders/${orderId}`
            );


        const order =
            await response.json();


        if (!response.ok) {

            throw new Error(
                order.error ||
                "Unable to load order."
            );

        }


        // ========================================
        // ORDER ID
        // ========================================

        const orderIdElement =
            document.getElementById(
                "detailsOrderId"
            );

        if (orderIdElement) {

            orderIdElement.textContent =
                "#" + order.id;

        }


        // ========================================
        // ORDER DATE
        // ========================================

        const orderDateElement =
            document.getElementById(
                "detailsOrderDate"
            );

        if (orderDateElement) {

            orderDateElement.textContent =
                formatDate(
                    order.order_date
                );

        }


        // ========================================
        // CUSTOMER
        // ========================================

        const customerElement =
            document.getElementById(
                "detailsCustomerName"
            );

        if (customerElement) {

            customerElement.textContent =
                order.customer_name ||
                "Guest";

        }


        // ========================================
        // STATUS
        // ========================================

        const statusElement =
            document.getElementById(
                "detailsOrderStatus"
            );

        if (statusElement) {

            statusElement.textContent =
                order.status ||
                "Pending";

        }


        // ========================================
        // FULL CUSTOMER NAME
        // ========================================

        const fullNameElement =
            document.getElementById(
                "detailsCustomerFullName"
            );

        if (fullNameElement) {

            fullNameElement.textContent =
                order.customer_name ||
                "Guest";

        }


        // ========================================
        // EMAIL
        // ========================================

        const emailElement =
            document.getElementById(
                "detailsCustomerEmail"
            );

        if (emailElement) {

            emailElement.textContent =
                order.customer_email ||
                "No email";

        }


        // ========================================
        // ORDER ITEMS
        // ========================================

        const itemsTable =
            document.getElementById(
                "orderItemsTable"
            );


        if (itemsTable) {

            itemsTable.innerHTML = "";


            if (
                !order.items ||
                order.items.length === 0
            ) {

                itemsTable.innerHTML = `

                    <tr>

                        <td colspan="4">
                            No items found
                        </td>

                    </tr>

                `;

            } else {

                order.items.forEach(item => {

                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML = `

                        <td>

                            <div class="order-product-cell">

                                ${
                                    item.image
                                    ?
                                    `
                                    <img
                                        src="${escapeAttribute(item.image)}"
                                        class="order-item-image"
                                        onerror="this.style.display='none'"
                                    >
                                    `
                                    :
                                    ""
                                }

                                <span>
                                    ${escapeHtml(
                                        item.product_name ||
                                        "Product"
                                    )}
                                </span>

                            </div>

                        </td>

                        <td>
                            Rs ${Number(
                                item.price || 0
                            ).toLocaleString()}
                        </td>

                        <td>
                            ${item.quantity}
                        </td>

                        <td>
                            Rs ${Number(
                                item.subtotal || 0
                            ).toLocaleString()}
                        </td>

                    `;


                    itemsTable.appendChild(row);

                });

            }

        }


        // ========================================
        // TOTAL
        // ========================================

        const totalElement =
            document.getElementById(
                "detailsOrderTotal"
            );


        if (totalElement) {

            totalElement.textContent =
                "Rs " +
                Number(
                    order.total || 0
                ).toLocaleString();

        }


        // ========================================
        // OPEN MODAL
        // ========================================

        const modal =
            document.getElementById(
                "orderDetailsModal"
            );


        if (modal) {

            modal.classList.add("active");

        } else {

            console.error(
                "orderDetailsModal was not found in admin.html"
            );

            alert(
                "Order details window could not be opened."
            );

        }


    } catch (error) {

        console.error(
            "Order details error:",
            error
        );


        alert(
            "Unable to load order details."
        );

    }

}


// ========================================
// CLOSE ORDER DETAILS
// ========================================

function closeOrderDetails() {

    const modal =
        document.getElementById(
            "orderDetailsModal"
        );

    if (modal) {

        modal.classList.remove("active");

    }

}


// ========================================
// CUSTOMERS
// ========================================

async function loadCustomers() {

    try {

        const response =
            await fetch("/api/customers");

        if (!response.ok) {

            throw new Error(
                "Failed to load customers."
            );

        }

        customers =
            await response.json();

        displayCustomers();


    } catch (error) {

        console.error(
            "Customers error:",
            error
        );

    }

}


// ========================================
// DISPLAY CUSTOMERS
// ========================================

function displayCustomers() {

    const table =
        document.getElementById(
            "customersTable"
        );

    if (!table) {

        return;

    }

    table.innerHTML = "";


    if (customers.length === 0) {

        table.innerHTML = `

            <tr>

                <td colspan="5">
                    No customers found
                </td>

            </tr>

        `;

        return;

    }


    customers.forEach(customer => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHtml(
                    customer.name
                )}
            </td>

            <td>
                ${escapeHtml(
                    customer.email
                )}
            </td>

            <td>
                ${customer.orders || 0}
            </td>

            <td>
                Rs ${Number(
                    customer.totalSpent || 0
                ).toLocaleString()}
            </td>

            <td>

                <span class="status-badge">

                    ${escapeHtml(
                        customer.status ||
                        "Active"
                    )}

                </span>

            </td>

        `;


        table.appendChild(row);

    });

}


// ========================================
// SETTINGS
// ========================================

function saveSettings() {

    alert(
        "Settings saved successfully!"
    );

}


// ========================================
// LOGOUT
// ========================================

function logout() {

    const confirmed =
        confirm(
            "Are you sure you want to logout?"
        );


    if (!confirmed) {

        return;

    }


    // Use Flask logout route
    window.location.href =
        "/logout";

}


// ========================================
// MODAL CLICK OUTSIDE
// ========================================

window.addEventListener(
    "click",
    function (event) {

        const productModal =
            document.getElementById(
                "productModal"
            );


        const orderModal =
            document.getElementById(
                "orderDetailsModal"
            );


        if (
            productModal &&
            event.target === productModal
        ) {

            closeProductForm();

        }


        if (
            orderModal &&
            event.target === orderModal
        ) {

            closeOrderDetails();

        }

    }
);


// ========================================
// ESC KEY
// ========================================

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            closeProductForm();

            closeOrderDetails();

        }

    }
);


// ========================================
// DATE FORMAT
// ========================================

function formatDate(dateString) {

    if (!dateString) {

        return "-";

    }


    const date =
        new Date(dateString);


    if (isNaN(date.getTime())) {

        return dateString;

    }


    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// ========================================
// SECURITY HELPERS
// ========================================

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


function escapeAttribute(value) {

    if (!value) {

        return "";

    }


    return String(value)

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}