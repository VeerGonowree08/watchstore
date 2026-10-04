
from flask import Flask, jsonify, request, send_from_directory, session, redirect
import mysql.connector
import os

app = Flask(__name__)

# ========================================
# FLASK SESSION SECRET KEY
# ========================================

app.secret_key = os.environ.get(
    "SECRET_KEY",
    "change-this-secret-key"
)


# ========================================
# MYSQL CONNECTION
# ========================================

def get_db_connection():

    connection = mysql.connector.connect(

        host=os.environ.get(
            "MYSQLHOST",
            "localhost"
        ),

        port=int(
            os.environ.get(
                "MYSQLPORT",
                3306
            )
        ),

        user=os.environ.get(
            "MYSQLUSER",
            "root"
        ),

        password=os.environ.get(
            "MYSQLPASSWORD",
            ""
        ),

        database=os.environ.get(
            "MYSQLDATABASE",
            "watchstore"
        )
    )

    return connection


# ========================================
# ADMIN AUTHENTICATION HELPER
# ========================================

def admin_required():
    return "admin_id" in session


# ========================================
# HOME PAGE
# ========================================

@app.route("/")
def home():

    return send_from_directory(
        ".",
        "index.html"
    )


# ========================================
# LOGIN PAGE
# ========================================

@app.route("/login")
def login_page():

    if "admin_id" in session:

        return redirect("/admin")

    return send_from_directory(
        ".",
        "login.html"
    )


# ========================================
# ADMIN PAGE
# ========================================

@app.route("/admin")
def admin():

    if not admin_required():

        return redirect("/login")

    return send_from_directory(
        ".",
        "admin.html"
    )


# ========================================
# LOGIN API
# ========================================

@app.route(
    "/api/login",
    methods=["POST"]
)
def login():

    data = request.json or {}

    email = data.get(
        "email",
        ""
    ).strip()

    password = data.get(
        "password",
        ""
    )

    if not email or not password:

        return jsonify({
            "error": "Email and password are required"
        }), 400

    connection = get_db_connection()

    cursor = connection.cursor(
        dictionary=True
    )

    try:

        cursor.execute("""
            SELECT
                id,
                name,
                email,
                password
            FROM admins
            WHERE email = %s
        """, (
            email,
        ))

        admin_user = cursor.fetchone()

        if not admin_user:

            return jsonify({
                "error": "Invalid email or password"
            }), 401

        if admin_user["password"] != password:

            return jsonify({
                "error": "Invalid email or password"
            }), 401

        # ========================================
        # CREATE SESSION
        # ========================================

        session["admin_id"] = admin_user["id"]

        session["admin_name"] = admin_user["name"]

        session["admin_email"] = admin_user["email"]

        return jsonify({

            "message": "Login successful",

            "admin": {

                "id": admin_user["id"],

                "name": admin_user["name"],

                "email": admin_user["email"]

            }

        })

    except Exception as error:

        return jsonify({
            "error": str(error)
        }), 500

    finally:

        cursor.close()

        connection.close()


# ========================================
# CHECK AUTHENTICATION
# ========================================

@app.route(
    "/api/check-auth",
    methods=["GET"]
)
def check_auth():

    if "admin_id" not in session:

        return jsonify({
            "authenticated": False
        })

    return jsonify({

        "authenticated": True,

        "admin": {

            "id": session["admin_id"],

            "name": session["admin_name"],

            "email": session["admin_email"]

        }

    })


# ========================================
# LOGOUT
# ========================================

@app.route("/logout")
def logout():

    session.clear()

    return redirect("/login")


# ========================================
# BLOCK DIRECT ACCESS TO admin.html
# ========================================

@app.route("/admin.html")
def direct_admin_html():

    if not admin_required():

        return redirect("/login")

    return send_from_directory(
        ".",
        "admin.html"
    )


# ========================================
# CSS / JS / OTHER FILES
# ========================================

@app.route("/<path:filename>")
def serve_files(filename):

    if filename == "admin.html":

        if not admin_required():

            return redirect("/login")

    return send_from_directory(
        ".",
        filename
    )


# ========================================
# GET ALL PRODUCTS
# ========================================

@app.route(
    "/api/products",
    methods=["GET"]
)
def get_products():

    connection = get_db_connection()

    cursor = connection.cursor(
        dictionary=True
    )

    cursor.execute("""
        SELECT
            id,
            name,
            category,
            price,
            stock,
            rating,
            image,
            description
        FROM products
        ORDER BY id DESC
    """)

    products = cursor.fetchall()

    cursor.close()

    connection.close()

    return jsonify(products)


# ========================================
# GET ONE PRODUCT
# ========================================

@app.route(
    "/api/products/<int:product_id>",
    methods=["GET"]
)
def get_product(product_id):

    connection = get_db_connection()

    cursor = connection.cursor(
        dictionary=True
    )

    cursor.execute("""
        SELECT
            id,
            name,
            category,
            price,
            stock,
            rating,
            image,
            description
        FROM products
        WHERE id = %s
    """, (
        product_id,
    ))

    product = cursor.fetchone()

    cursor.close()

    connection.close()

    if product is None:

        return jsonify({
            "error": "Product not found"
        }), 404

    return jsonify(product)


# ========================================
# ADD PRODUCT
# ========================================

@app.route(
    "/api/products",
    methods=["POST"]
)
def add_product():

    if not admin_required():

        return jsonify({
            "error": "Authentication required"
        }), 401

    data = request.json or {}

    connection = get_db_connection()

    cursor = connection.cursor()

    try:

        query = """
            INSERT INTO products
            (
                name,
                category,
                price,
                stock,
                rating,
                image,
                description
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
        """

        values = (

            data["name"],

            data["category"],

            data["price"],

            data["stock"],

            data.get(
                "rating",
                0
            ),

            data.get(
                "image",
                ""
            ),

            data.get(
                "description",
                ""
            )

        )

        cursor.execute(
            query,
            values
        )

        connection.commit()

        return jsonify({

            "message":
                "Product added successfully",

            "id":
                cursor.lastrowid

        }), 201

    except Exception as error:

        connection.rollback()

        return jsonify({
            "error": str(error)
        }), 400

    finally:

        cursor.close()

        connection.close()


# ========================================
# UPDATE PRODUCT
# ========================================

@app.route(
    "/api/products/<int:product_id>",
    methods=["PUT"]
)
def update_product(product_id):

    if not admin_required():

        return jsonify({
            "error": "Authentication required"
        }), 401

    data = request.json or {}

    connection = get_db_connection()

    cursor = connection.cursor()

    try:

        query = """
            UPDATE products
            SET
                name = %s,
                category = %s,
                price = %s,
                stock = %s,
                rating = %s,
                image = %s,
                description = %s
            WHERE id = %s
        """

        values = (

            data["name"],

            data["category"],

            data["price"],

            data["stock"],

            data.get(
                "rating",
                0
            ),

            data.get(
                "image",
                ""
            ),

            data.get(
                "description",
                ""
            ),

            product_id

        )

        cursor.execute(
            query,
            values
        )

        if cursor.rowcount == 0:

            return jsonify({
                "error": "Product not found"
            }), 404

        connection.commit()

        return jsonify({

            "message":
                "Product updated successfully"

        })

    except Exception as error:

        connection.rollback()

        return jsonify({
            "error": str(error)
        }), 400

    finally:

        cursor.close()

        connection.close()


# ========================================
# DELETE PRODUCT
# ========================================

@app.route(
    "/api/products/<int:product_id>",
    methods=["DELETE"]
)
def delete_product(product_id):

    if not admin_required():

        return jsonify({
            "error": "Authentication required"
        }), 401

    connection = get_db_connection()

    cursor = connection.cursor()

    try:

        cursor.execute(
            "DELETE FROM products WHERE id = %s",
            (product_id,)
        )

        if cursor.rowcount == 0:

            return jsonify({
                "error": "Product not found"
            }), 404

        connection.commit()

        return jsonify({

            "message":
                "Product deleted successfully"

        })

    except Exception as error:

        connection.rollback()

        return jsonify({
            "error": str(error)
        }), 400

    finally:

        cursor.close()

        connection.close()


# ========================================
# GET ALL ORDERS
# ========================================

@app.route(
    "/api/orders",
    methods=["GET"]
)
def get_orders():

    if not admin_required():

        return jsonify({
            "error": "Authentication required"
        }), 401

    connection = get_db_connection()

    cursor = connection.cursor(
        dictionary=True
    )

    try:

        cursor.execute("""
            SELECT
                o.id,
                o.customer_id,

                COALESCE(
                    c.name,
                    'Guest'
                ) AS customer,

                COALESCE(
                    GROUP_CONCAT(
                        p.name
                        SEPARATOR ', '
                    ),
                    'Order'
                ) AS product,

                o.total_amount AS total,
                o.status,
                o.order_date

            FROM orders o

            LEFT JOIN customers c
                ON o.customer_id = c.id

            LEFT JOIN order_items oi
                ON o.id = oi.order_id

            LEFT JOIN products p
                ON oi.product_id = p.id

            GROUP BY
                o.id,
                o.customer_id,
                c.name,
                o.total_amount,
                o.status,
                o.order_date

            ORDER BY o.id DESC
        """)

        orders = cursor.fetchall()

        return jsonify(orders)

    except Exception as error:

        return jsonify({
            "error": str(error)
        }), 500

    finally:

        cursor.close()

        connection.close()


# ========================================
# GET ORDER DETAILS
# ========================================

@app.route(
    "/api/orders/<int:order_id>",
    methods=["GET"]
)
def get_order_details(order_id):

    if not admin_required():

        return jsonify({
            "error": "Authentication required"
        }), 401

    connection = get_db_connection()

    cursor = connection.cursor(
        dictionary=True
    )

    try:

        cursor.execute("""
            SELECT
                o.id,
                o.total_amount AS total,
                o.status,
                o.order_date,

                c.id AS customer_id,
                c.name AS customer_name,
                c.email AS customer_email

            FROM orders o

            LEFT JOIN customers c
                ON o.customer_id = c.id

            WHERE o.id = %s
        """, (
            order_id,
        ))

        order = cursor.fetchone()

        if not order:

            return jsonify({
                "error": "Order not found"
            }), 404

        cursor.execute("""
            SELECT
                oi.product_id,
                p.name AS product_name,
                p.image,
                oi.quantity,
                oi.price,

                (
                    oi.quantity *
                    oi.price
                ) AS subtotal

            FROM order_items oi

            LEFT JOIN products p
                ON oi.product_id = p.id

            WHERE oi.order_id = %s
        """, (
            order_id,
        ))

        order["items"] = cursor.fetchall()

        return jsonify(order)

    except Exception as error:

        return jsonify({
            "error": str(error)
        }), 500

    finally:

        cursor.close()

        connection.close()


# ========================================
# GET CUSTOMERS
# ========================================

@app.route(
    "/api/customers",
    methods=["GET"]
)
def get_customers():

    if not admin_required():

        return jsonify({
            "error": "Authentication required"
        }), 401

    connection = get_db_connection()

    cursor = connection.cursor(
        dictionary=True
    )

    try:

        cursor.execute("""
            SELECT
                c.id,
                c.name,
                c.email,

                COUNT(
                    DISTINCT o.id
                ) AS orders,

                COALESCE(
                    SUM(
                        o.total_amount
                    ),
                    0
                ) AS totalSpent,

                'Active' AS status

            FROM customers c

            LEFT JOIN orders o
                ON c.id = o.customer_id

            GROUP BY
                c.id,
                c.name,
                c.email

            ORDER BY c.id DESC
        """)

        customers = cursor.fetchall()

        return jsonify(customers)

    except Exception as error:

        return jsonify({
            "error": str(error)
        }), 500

    finally:

        cursor.close()

        connection.close()


# ========================================
# CREATE CUSTOMER ORDER
# ========================================

@app.route(
    "/api/orders",
    methods=["POST"]
)
def create_order():

    data = request.json or {}

    customer_name = data.get(
        "customer_name"
    )

    customer_email = data.get(
        "customer_email"
    )

    items = data.get(
        "items",
        []
    )

    if not customer_name or not customer_email:

        return jsonify({
            "error":
                "Customer name and email are required"
        }), 400

    if not items:

        return jsonify({
            "error":
                "Cart is empty"
        }), 400

    connection = get_db_connection()

    cursor = connection.cursor(
        dictionary=True
    )

    try:

        # ========================================
        # FIND CUSTOMER
        # ========================================

        cursor.execute("""
            SELECT id
            FROM customers
            WHERE email = %s
        """, (
            customer_email,
        ))

        customer = cursor.fetchone()

        if customer:

            customer_id = customer["id"]

        else:

            cursor.execute("""
                INSERT INTO customers
                (name, email)
                VALUES
                (%s, %s)
            """, (
                customer_name,
                customer_email
            ))

            customer_id = cursor.lastrowid

        # ========================================
        # CHECK PRODUCTS
        # ========================================

        total_amount = 0

        verified_items = []

        for item in items:

            product_id = item.get("id")

            quantity = int(
                item.get(
                    "quantity",
                    1
                )
            )

            if quantity <= 0:

                raise Exception(
                    "Invalid quantity"
                )

            cursor.execute("""
                SELECT
                    id,
                    name,
                    price,
                    stock
                FROM products
                WHERE id = %s
            """, (
                product_id,
            ))

            product = cursor.fetchone()

            if not product:

                raise Exception(
                    f"Product {product_id} not found"
                )

            if product["stock"] < quantity:

                raise Exception(
                    f"Not enough stock for {product['name']}"
                )

            price = float(
                product["price"]
            )

            total_amount += (
                price * quantity
            )

            verified_items.append({

                "product_id":
                    product["id"],

                "quantity":
                    quantity,

                "price":
                    price

            })

        # ========================================
        # CREATE ORDER
        # ========================================

        cursor.execute("""
            INSERT INTO orders
            (
                customer_id,
                total_amount,
                status
            )
            VALUES
            (
                %s,
                %s,
                %s
            )
        """, (
            customer_id,
            total_amount,
            "Pending"
        ))

        order_id = cursor.lastrowid

        # ========================================
        # CREATE ORDER ITEMS + REDUCE STOCK
        # ========================================

        for item in verified_items:

            cursor.execute("""
                INSERT INTO order_items
                (
                    order_id,
                    product_id,
                    quantity,
                    price
                )
                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s
                )
            """, (
                order_id,
                item["product_id"],
                item["quantity"],
                item["price"]
            ))

            cursor.execute("""
                UPDATE products
                SET stock = stock - %s
                WHERE id = %s
            """, (
                item["quantity"],
                item["product_id"]
            ))

        connection.commit()

        return jsonify({

            "message":
                "Order created successfully",

            "order_id":
                order_id,

            "total":
                total_amount

        }), 201

    except Exception as error:

        connection.rollback()

        return jsonify({
            "error": str(error)
        }), 400

    finally:

        cursor.close()

        connection.close()


# ========================================
# UPDATE ORDER STATUS
# ========================================

@app.route(
    "/api/orders/<int:order_id>/status",
    methods=["PUT"]
)
def update_order_status(order_id):

    if not admin_required():

        return jsonify({
            "error": "Authentication required"
        }), 401

    data = request.json or {}

    status = data.get(
        "status"
    )

    allowed_statuses = [

        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled"

    ]

    if status not in allowed_statuses:

        return jsonify({
            "error": "Invalid order status"
        }), 400

    connection = get_db_connection()

    cursor = connection.cursor()

    try:

        cursor.execute("""
            UPDATE orders
            SET status = %s
            WHERE id = %s
        """, (
            status,
            order_id
        ))

        if cursor.rowcount == 0:

            return jsonify({
                "error": "Order not found"
            }), 404

        connection.commit()

        return jsonify({

            "message":
                "Order status updated successfully",

            "order_id":
                order_id,

            "status":
                status

        })

    except Exception as error:

        connection.rollback()

        return jsonify({
            "error": str(error)
        }), 500

    finally:

        cursor.close()

        connection.close()


# ========================================
# RUN APPLICATION
# ========================================

if __name__ == "__main__":

    app.run(

        host="0.0.0.0",

        port=int(
            os.environ.get(
                "PORT",
                5000
            )
        ),

        debug=False

    )
