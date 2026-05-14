from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from mysql.connector import pooling
from werkzeug.utils import secure_filename
import os

# ✅ FIXED: Proper Flask initialization
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

app.config['SECRET_KEY'] = 'your-secret-key-here'


socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Database configuration
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '@26AEROPPBOT',
    'database': 'breadaholic_database'
}

db_pool = pooling.MySQLConnectionPool(
    pool_name="mypool", pool_size=5, **db_config)

# ✅ FIXED: Organized upload folders - clear separation
PROFILE_UPLOAD_FOLDER = os.path.join("public", "pfp's")
PRODUCT_UPLOAD_FOLDER = os.path.join("public", "product_images")
os.makedirs(PROFILE_UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PRODUCT_UPLOAD_FOLDER, exist_ok=True)


# ==================== SOCKETIO EVENT HANDLERS ====================

@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')
    emit('connection_response', {
         'message': 'Connected to Breadaholic server!'})


@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')


@socketio.on('join_user_room')
def handle_join_room(data):
    user_id = data.get('user_id')
    if user_id:
        room = f'user_{user_id}'
        join_room(room)
        print(f'User {user_id} joined room: {room}')
        emit('joined_room', {'room': room, 'user_id': user_id})


@socketio.on('leave_user_room')
def handle_leave_room(data):
    user_id = data.get('user_id')
    if user_id:
        room = f'user_{user_id}'
        leave_room(room)
        print(f'User {user_id} left room: {room}')


# ==================== REST API ROUTES ====================

@app.route('/')
def home():
    return """
    <div style="display:flex;flex-direction:column;justify-content:center;align-items:center;
        height:100vh;margin:0;font-family:'Segoe UI',sans-serif;background:#f4f7f6;color:#333;">
        <div style="padding:40px;background:white;border-radius:12px;
            box-shadow:0 4px 15px rgba(0,0,0,0.1);text-align:center;">
            <h1 style="color:#2ecc71;margin-bottom:10px;">Backend Online</h1>
            <hr style="border:0;border-top:1px solid #eee;margin:20px 0;">
            <code style="background:#eee;padding:5px 10px;border-radius:4px;">Status: 200 OK</code>
        </div>
    </div>
    """


@app.route('/getUser/<int:user_id>', methods=['GET'])
def get_user(user_id):
    conn = None
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        return jsonify(user), 200
    except Exception as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/getFeatured', methods=['GET'])
def get_features():
    conn = None
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        # ✅ UPDATED: Select ingredients column
        cursor.execute(
            "SELECT product_id, product_name, price, stock, category, ingredients, image FROM Products WHERE featured = TRUE")
        return jsonify(cursor.fetchall()), 200
    except Exception as err:
        return jsonify({"error": str(err)}), 404
    finally:
        if conn:
            conn.close()


@app.route('/addUser', methods=['POST'])
def add_user():
    conn = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body required"}), 400

        mobile = str(data.get('mobile_number', '')).strip()
        fname = data.get('first_name', '').strip()
        lname = data.get('last_name', '').strip()

        # ✅ NEW: Validate mobile number length (must be 11 digits for PH numbers)
        if not mobile or len(mobile) < 11:
            return jsonify({"error": "Mobile number must be at least 11 characters"}), 400

        if not fname or not lname:
            return jsonify({"error": "Missing required fields"}), 400

        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT mobile_number FROM Users WHERE mobile_number = %s", (mobile,))
        if cursor.fetchone():
            return jsonify({"error": "Mobile already registered"}), 409

        cursor.execute("""INSERT INTO Users (mobile_number, first_name, last_name, barangay, street_name, password, profile_picture, status)
                          VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                       (mobile, fname, lname, data.get('barangay'), data.get('street_name'), data.get('password'), data.get('profile_picture'), data.get('status', 'active')))
        conn.commit()
        return jsonify({"message": "User added", "user_id": cursor.lastrowid, "first_name": fname}), 201
    except Exception as err:
        if conn:
            conn.rollback()
        return jsonify({"error": "Mobile number must be at maximum of 11 characters"}), 500
    finally:
        if conn:
            conn.close()


@app.route('/logIn', methods=['POST'])
def logInAuthentication():
    conn = None
    try:
        data = request.json
        mobile = str(data.get('mobile_number', '')).strip()
        password = data.get('password')

        # ✅ Validate required fields
        if not mobile or not password:
            return jsonify({"error": "Mobile number and password are required"}), 400

        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT * FROM Users WHERE mobile_number = %s", (mobile,))
        user = cursor.fetchone()

        # ✅ Case 1: Mobile number not found in database
        if not user:
            return jsonify({"error": "Unregistered mobile number"}), 404

        # ✅ Case 2: Password doesn't match
        if user['password'] != password:
            return jsonify({"error": "Incorrect password"}), 401

        # ✅ Success: Return user data
        return jsonify({
            "message": "Success",
            "user_id": user['user_id'],
            "first_name": user['first_name'],
            "role": user['role']
        }), 200

    except Exception as err:
        print(f"❌ Login error: {err}")
        return jsonify({"error": str(err)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/getProducts', methods=['GET'])
def get_products():
    conn = None
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        # ✅ UPDATED: Select ingredients column
        cursor.execute(
            "SELECT product_id, product_name, price, stock, category, ingredients, image, featured FROM Products")
        return jsonify(cursor.fetchall()), 200
    except Exception as err:
        return jsonify({"error": str(err)}), 404
    finally:
        if conn:
            conn.close()


@app.route('/add_to_cart', methods=['POST'])
def add_to_cart():
    conn = None
    try:
        data = request.json
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT ordItem_id, quantity FROM cart_item WHERE user_id=%s AND product_id=%s",
                       (data.get('user_id'), data.get('product_id')))
        item = cursor.fetchone()
        if item:
            cursor.execute("UPDATE cart_item SET quantity=%s WHERE ordItem_id=%s",
                           (item['quantity'] + int(data.get('quantity', 1)), item['ordItem_id']))
        else:
            cursor.execute("INSERT INTO cart_item (user_id, product_id, quantity) VALUES (%s, %s, %s)", (data.get(
                'user_id'), data.get('product_id'), data.get('quantity', 1)))
        conn.commit()
        socketio.emit('cart_updated', {'user_id': data.get(
            'user_id')}, room=f"user_{data.get('user_id')}")
        return jsonify({"status": "success"}), 200
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/view_cart/<int:user_id>', methods=['GET'])
def view_cart(user_id):
    conn = None
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""SELECT c.ordItem_id, p.product_id, p.product_name, p.price, p.image, p.stock, c.quantity, (p.price * c.quantity) AS subtotal
                          FROM cart_item c JOIN Products p ON c.product_id = p.product_id WHERE c.user_id = %s""", (user_id,))
        return jsonify(cursor.fetchall()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/reduce_quantity', methods=['POST'])
def reduce_quantity():
    conn = None
    try:
        data = request.json
        uid = data.get('user_id')
        pid = data.get('product_id')
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT ordItem_id, quantity FROM cart_item WHERE user_id = %s AND product_id = %s", (uid, pid))
        item = cursor.fetchone()
        if item and item['quantity'] > 1:
            new_qty = item['quantity'] - 1
            cursor.execute(
                "UPDATE cart_item SET quantity = %s WHERE ordItem_id = %s", (new_qty, item['ordItem_id']))
            conn.commit()
            cursor.execute(
                "SELECT product_name FROM Products WHERE product_id = %s", (pid,))
            product = cursor.fetchone()
            socketio.emit('cart_updated', {'user_id': uid, 'product_id': pid, 'product_name': product[
                          'product_name'] if product else 'Item', 'action': 'reduced', 'new_quantity': new_qty}, room=f'user_{uid}')
            return jsonify({"status": "success", "new_quantity": new_qty}), 200
        return jsonify({"error": "Cannot reduce below 1"}), 400
    except Exception as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/broadcast_new_product', methods=['POST'])
def broadcast_new_product():
    try:
        data = request.json
        socketio.emit('products_updated', {
                      'action': 'added', 'product_id': data.get('product_id')})
        return jsonify({"status": "broadcasted"}), 200
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@app.route('/remove_from_cart', methods=['POST'])
def remove_from_cart():
    conn = None
    try:
        data = request.json
        uid = data.get('user_id')
        item_id = data.get('ordItem_id')
        conn = db_pool.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM cart_item WHERE ordItem_id = %s AND user_id = %s", (item_id, uid))
        conn.commit()
        socketio.emit('cart_updated', {'user_id': uid}, room=f'user_{uid}')
        return jsonify({"status": "success", "message": "Item removed"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/confirm_order', methods=['POST'])
def confirm_order():
    conn = None
    try:
        data = request.json
        uid = data.get('user_id')
        items = data.get('items')
        address = data.get('address')
        total_price = data.get('total_price')
        shipping_fee = 50

        conn = db_pool.get_connection()
        # ✅ Use dictionary=True for easier access
        cursor = conn.cursor(dictionary=True)

        # ✅ Check stock first
        for item in items:
            cursor.execute(
                "SELECT stock FROM Products WHERE product_id = %s FOR UPDATE",
                (item['product_id'],)
            )
            row = cursor.fetchone()
            if not row or row['stock'] < item['quantity']:
                conn.rollback()
                return jsonify({"error": "Not enough stock for product."}), 400

        # ✅ Create order
        cursor.execute(
            "INSERT INTO ORDERS (user_id, barangay, street_name, landmark, order_total, shipping_fee, status) VALUES (%s, %s, %s, %s, %s, %s, 'Pending')",
            (uid, address['barangay'], address['street'],
             address['landmark'], total_price, shipping_fee)
        )
        new_order_id = cursor.lastrowid

        # ✅ Create order items
        for item in items:
            cursor.execute(
                "INSERT INTO ORDER_ITEMS (order_id, product_id, quantity, price) VALUES (%s, %s, %s, %s)",
                (new_order_id, item['product_id'],
                 item['quantity'], item['price'])
            )

        # ✅ Update stock
        updated_products = []
        for item in items:
            cursor.execute(
                "UPDATE Products SET stock = stock - %s WHERE product_id = %s",
                (item['quantity'], item['product_id'])
            )
            cursor.execute(
                "SELECT stock FROM Products WHERE product_id = %s", (item['product_id'],))
            new_stock = max(0, cursor.fetchone()['stock'])
            updated_products.append(
                {'product_id': int(item['product_id']), 'stock': new_stock})

        # ✅ Clear cart
        for item in items:
            cursor.execute(
                "DELETE FROM cart_item WHERE user_id = %s AND product_id = %s",
                (uid, item['product_id'])
            )

        conn.commit()

        # ✅ Get customer name for notification (FIX #2)
        cursor.execute(
            "SELECT first_name, last_name FROM Users WHERE user_id = %s", (uid,))
        user = cursor.fetchone()
        customer_name = f"{user['first_name']} {user['last_name']}".strip(
        ) if user else "New Customer"

        # ✅ Emit socket events (FIX #1: no try/except needed)
        socketio.emit('cart_updated', {'user_id': uid}, room=f'user_{uid}')
        socketio.emit('stock_updated', {'items': updated_products})

        # ✅ NEW: Notify admin panel
        socketio.emit('new_order_received', {
            'order_id': new_order_id,
            'customer': customer_name,  # ✅ Now correctly fetched from DB
            'total': total_price,
            'status': 'Pending',
            'timestamp': datetime.now().isoformat()
        })

        return jsonify({
            "status": "success",
            "order_id": new_order_id,
            "message": "Order placed successfully!"
        }), 201

    except Exception as e:
        print(f"❌ confirm_order error: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/add_feedback', methods=['POST'])
def add_feedback():
    conn = None
    try:
        data = request.json
        user_id = data.get('user_id')
        message = data.get('message')
        rating = data.get('rating')
        if not user_id or not message or not rating:
            return jsonify({"error": "Missing data"}), 400
        conn = db_pool.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO feedback (user_id, message, rating) VALUES (%s, %s, %s)", (user_id, message, rating))
        conn.commit()
        fetch_query = """SELECT f.message, f.rating, u.first_name, u.last_name, u.profile_picture FROM feedback f JOIN Users u ON f.user_id = u.user_id WHERE f.user_id = %s ORDER BY f.rev_id DESC LIMIT 1"""
        cursor.execute(fetch_query, (user_id,))
        columns = [col[0] for col in cursor.description]
        new_review = dict(zip(columns, cursor.fetchone()))
        socketio.emit('new_feedback_received', new_review)
        return jsonify({"status": "success"}), 201
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/get_feedbacks', methods=['GET'])
def get_feedbacks():
    conn = None
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor()
        query = """SELECT f.message, f.rating, u.first_name, u.last_name, u.profile_picture FROM feedback f JOIN Users u ON f.user_id = u.user_id ORDER BY f.rev_id DESC"""
        cursor.execute(query)
        columns = [column[0] for column in cursor.description]
        feedbacks = [dict(zip(columns, row)) for row in cursor.fetchall()]
        return jsonify(feedbacks), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

# ✅ FIXED: Profile picture serving route - uses correct folder


@app.route("/pfp's/<filename>")
def serve_pfp(filename):
    return send_from_directory(PROFILE_UPLOAD_FOLDER, filename)


@app.route("/upload_pfp", methods=["POST"])
def upload_pfp():
    conn = None
    try:
        user_id = request.form.get("user_id")
        file = request.files.get("file")
        if not file or not user_id:
            return jsonify({"error": "Missing file or user_id"}), 400
        ext = os.path.splitext(secure_filename(file.filename))[1]
        filename = f"user_{user_id}{ext}"
        # ✅ FIXED: Save to PROFILE_UPLOAD_FOLDER
        save_path = os.path.join(PROFILE_UPLOAD_FOLDER, filename)
        file.save(save_path)
        # ✅ FIXED: Dynamic host URL for cross-device access
        db_path = f"{request.host_url.rstrip('/')}/pfp's/{filename}"
        conn = db_pool.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE Users SET profile_picture = %s WHERE user_id = %s", (db_path, user_id))
        conn.commit()
        return jsonify({"profile_picture": db_path}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/getOrders', methods=['GET'])
def get_orders():
    conn = None
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        query = """SELECT o.order_id, o.user_id, o.barangay, o.street_name, o.landmark, o.order_total, o.shipping_fee, o.status, u.first_name, u.last_name, u.mobile_number FROM ORDERS o JOIN Users u ON o.user_id = u.user_id ORDER BY o.order_id DESC"""
        cursor.execute(query)
        orders = cursor.fetchall()
        return jsonify(orders), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

# ✅ NEW: Update product route (was missing)


@app.route('/updateProduct', methods=['POST'])
def update_product():
    conn = None
    try:
        data = request.json
        product_id = data.get('product_id')
        if not product_id:
            return jsonify({"error": "Product ID required"}), 400

        conn = db_pool.get_connection()
        cursor = conn.cursor()

        # ✅ UPDATED: Include ingredients in UPDATE
        cursor.execute("""
            UPDATE Products 
            SET product_name=%s, price=%s, stock=%s, category=%s, ingredients=%s 
            WHERE product_id=%s
        """, (
            data.get('product_name'),
            data.get('price'),
            data.get('stock'),
            data.get('category'),
            data.get('ingredients', ''),  # ✅ NEW
            product_id
        ))
        conn.commit()

        socketio.emit('products_updated', {
            'action': 'updated',
            'product_id': product_id
        })

        return jsonify({"message": "Product updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/deleteProduct', methods=['POST'])
def delete_product():
    conn = None
    try:
        data = request.json
        product_id = data.get('product_id')
        if not product_id:
            return jsonify({"error": "Product ID required"}), 400

        conn = db_pool.get_connection()
        cursor = conn.cursor()

        # Optional: Delete product image file
        cursor.execute(
            "SELECT image FROM Products WHERE product_id = %s", (product_id,))
        result = cursor.fetchone()
        if result and result[0]:
            try:
                image_filename = result[0].split('/product_images/')[-1]
                image_path = os.path.join(
                    PRODUCT_UPLOAD_FOLDER, image_filename)
                if os.path.exists(image_path):
                    os.remove(image_path)
            except:
                pass  # Ignore file deletion errors

        # Attempt to delete the product
        cursor.execute(
            "DELETE FROM Products WHERE product_id = %s", (product_id,))
        conn.commit()

        socketio.emit('products_updated', {
                      'action': 'deleted', 'product_id': product_id})
        return jsonify({"message": "Product deleted successfully"}), 200

    except Exception as e:
        if conn:
            conn.rollback()

        # ✅ Catch MySQL Foreign Key Constraint Error (Error 1451)
        if "1451" in str(e) or "foreign key constraint" in str(e).lower():
            return jsonify({
                "error": "Cannot delete product. It has existing orders. Set stock to 0 instead."
            }), 409  # 409 = Conflict

        # Handle other unexpected errors
        print(f"❌ deleteProduct error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/get_user_addresses/<int:user_id>', methods=['GET'])
def get_user_addresses(user_id):
    conn = None
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""SELECT barangay, street_name, landmark, barangay_second, street_name_second, landmark_second, barangay_third, street_name_third, landmark_third FROM Users WHERE user_id = %s""", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 404
        addresses = []
        if user['barangay'] or user['street_name']:
            addresses.append({"id": 1, "position": 1, "barangay": user['barangay'] or "",
                             "street": user['street_name'] or "", "landmark": user['landmark'] or ""})
        if user['barangay_second'] or user['street_name_second']:
            addresses.append({"id": 2, "position": 2, "barangay": user['barangay_second'] or "",
                             "street": user['street_name_second'] or "", "landmark": user['landmark_second'] or ""})
        if user['barangay_third'] or user['street_name_third']:
            addresses.append({"id": 3, "position": 3, "barangay": user['barangay_third'] or "",
                             "street": user['street_name_third'] or "", "landmark": user['landmark_third'] or ""})
        return jsonify(addresses), 200
    except Exception as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()


@app.route('/save_address', methods=['POST'])
def save_address():
    conn = None
    try:
        data = request.json
        user_id = data.get('user_id')
        position = data.get('position')
        barangay = data.get('barangay')
        street = data.get('street')
        landmark = data.get('landmark', '')
        if not user_id or not barangay or not street:
            return jsonify({"error": "Missing required fields"}), 400
        conn = db_pool.get_connection()
        cursor = conn.cursor()
        if position is None:
            cursor.execute(
                "SELECT barangay, street_name, barangay_second, street_name_second, barangay_third, street_name_third FROM Users WHERE user_id = %s", (user_id,))
            user_data = cursor.fetchone()
            if not user_data:
                return jsonify({"error": "User not found"}), 404
            if not user_data[0] and not user_data[1]:
                position = 1
            elif not user_data[2] and not user_data[3]:
                position = 2
            elif not user_data[4] and not user_data[5]:
                position = 3
            else:
                return jsonify({"error": "Maximum 3 addresses reached"}), 400
        if position == 1:
            cursor.execute("UPDATE Users SET barangay = %s, street_name = %s, landmark = %s WHERE user_id = %s",
                           (barangay, street, landmark, user_id))
        elif position == 2:
            cursor.execute("UPDATE Users SET barangay_second = %s, street_name_second = %s, landmark_second = %s WHERE user_id = %s",
                           (barangay, street, landmark, user_id))
        elif position == 3:
            cursor.execute("UPDATE Users SET barangay_third = %s, street_name_third = %s, landmark_third = %s WHERE user_id = %s",
                           (barangay, street, landmark, user_id))
        else:
            return jsonify({"error": "Invalid position"}), 400
        conn.commit()
        return jsonify({"status": "success", "message": "Address saved successfully"}), 200
    except Exception as err:
        if conn:
            conn.rollback()
        return jsonify({"error": str(err)}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()


@app.route('/delete_address', methods=['POST'])
def delete_address():
    conn = None
    try:
        data = request.json
        user_id = data.get('user_id')
        position = data.get('position')
        if not user_id or position is None:
            return jsonify({"error": "Missing user_id or position"}), 400
        if position == 1:
            return jsonify({"error": "Main address cannot be deleted, only edited."}), 403
        conn = db_pool.get_connection()
        cursor = conn.cursor()
        if position == 2:
            cursor.execute(
                "UPDATE Users SET barangay_second = NULL, street_name_second = NULL, landmark_second = NULL WHERE user_id = %s", (user_id,))
        elif position == 3:
            cursor.execute(
                "UPDATE Users SET barangay_third = NULL, street_name_third = NULL, landmark_third = NULL WHERE user_id = %s", (user_id,))
        else:
            return jsonify({"error": "Invalid position"}), 400
        conn.commit()
        return jsonify({"status": "success", "message": "Address deleted successfully"}), 200
    except Exception as err:
        if conn:
            conn.rollback()
        return jsonify({"error": str(err)}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()


@app.route('/cancel_order', methods=['POST'])
def cancel_order():
    conn = None
    cursor = None
    try:
        data = request.get_json()
        order_id = data.get('order_id')
        user_id = data.get('user_id')

        if not order_id or not user_id:
            return jsonify({"error": "Missing order_id or user_id"}), 400

        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)

        # ✅ 1. Verify order exists + belongs to user + is Pending
        cursor.execute(
            "SELECT status, user_id FROM orders WHERE order_id = %s", (order_id,))
        order_result = cursor.fetchone()

        if not order_result:
            return jsonify({"error": "Order not found"}), 404
        if str(order_result['user_id']) != str(user_id):
            return jsonify({"error": "Unauthorized"}), 403
        if order_result['status'].lower().strip() != 'pending':
            return jsonify({"error": f"Only 'Pending' orders can be cancelled"}), 400

        # ✅ 2. Fetch order items to restore stock
        cursor.execute(
            "SELECT product_id, quantity FROM order_items WHERE order_id = %s", (order_id,))
        order_items = cursor.fetchall()

        # ✅ 3. Restore stock for each item
        updated_products = []
        for item in order_items:
            cursor.execute(
                "UPDATE Products SET stock = stock + %s WHERE product_id = %s",
                (item['quantity'], item['product_id'])
            )
            cursor.execute(
                "SELECT stock FROM Products WHERE product_id = %s", (item['product_id'],))
            new_stock = cursor.fetchone()['stock']
            updated_products.append({
                'product_id': int(item['product_id']),
                'stock': int(new_stock)
            })

        # ✅ 4. Update order status to 'Cancelled'
        cursor.execute(
            "UPDATE orders SET status = 'Cancelled' WHERE order_id = %s AND user_id = %s",
            (order_id, user_id))
        conn.commit()

        # ✅ 5. 🎯 Emit real-time updates to ALL relevant clients

        # A) Notify CUSTOMER panel (AllOrders.jsx) - specific user
        try:
            socketio.emit('my_order_status_updated', {
                'order_id': order_id,
                'new_status': 'Cancelled',
                'updated_at': datetime.now().isoformat(),
                'message': f'Your order #{order_id} has been cancelled'
            }, room=f'user_{user_id}')
            print(f"✅ Emitted my_order_status_updated to user_{user_id}")
        except Exception as e:
            print(f"⚠️ User notification emit failed: {e}")

        # B) Notify ADMIN panels (OrderManagerBody.jsx) - broadcast to all admins
        try:
            socketio.emit('order_status_updated', {
                'order_id': order_id,
                'old_status': 'Pending',
                'new_status': 'Cancelled',
                'updated_by': 'customer',  # Distinguish from admin actions
                'timestamp': datetime.now().isoformat()
            })
            print(f"✅ Emitted order_status_updated to admins")
        except Exception as e:
            print(f"⚠️ Admin notification emit failed: {e}")

        # C) Notify CUSTOMER product catalog (Products.jsx) - stock restored
        try:
            socketio.emit('stock_updated', {
                'items': updated_products,
                'source': 'order_cancelled_by_customer',
                'order_id': order_id
            })
            socketio.emit('cart_updated', {
                          'user_id': user_id}, room=f'user_{user_id}')
            print(f"✅ Emitted stock_updated to customers")
        except Exception as e:
            print(f"⚠️ Stock emit failed: {e}")

        return jsonify({
            "message": "Order cancelled successfully",
            "order_id": order_id,
            "status": "Cancelled"
        }), 200

    except Exception as e:
        print(f"❌ cancel_order error: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


@app.route('/addProduct', methods=['POST'])
def add_product():
    conn = None
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Request body is required"}), 400

        # ✅ Validate required fields
        product_name = data.get('product_name')
        price = data.get('price')
        stock = data.get('stock')
        category = data.get('category')
        ingredients = data.get('ingredients', '')  # ✅ NEW: Optional field

        if not all([product_name, price is not None, stock is not None, category]):
            return jsonify({"error": "Missing required fields: product_name, price, stock, category"}), 400

        conn = db_pool.get_connection()
        cursor = conn.cursor()

        # ✅ UPDATED: Include ingredients column in INSERT
        query = """
            INSERT INTO Products (product_name, price, stock, category, ingredients)
            VALUES (%s, %s, %s, %s, %s)
        """
        values = (product_name, float(price),
                  int(stock), category, ingredients)
        cursor.execute(query, values)
        conn.commit()

        product_id = cursor.lastrowid

        # ✅ Notify clients of new product
        socketio.emit('products_updated', {
            'action': 'added',
            'product_id': product_id
        })

        return jsonify({
            "message": "Product added successfully",
            "product_id": product_id
        }), 201

    except Exception as e:
        # ✅ Log the actual error for debugging
        print(f"❌ addProduct error: {e}")
        import traceback
        traceback.print_exc()

        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()
# ✅ FIXED: Product image serving route - uses correct folder


@app.route("/product_images/<filename>")
def serve_product_image(filename):
    return send_from_directory(PRODUCT_UPLOAD_FOLDER, filename)


@app.route("/upload_product_image", methods=["POST"])
def upload_product_image():
    conn = None
    try:
        product_id = request.form.get("product_id")
        file = request.files.get("file")
        if not product_id or not file:
            return jsonify({"error": "Missing data"}), 400
        ext = os.path.splitext(secure_filename(file.filename))[1]
        filename = f"product_{product_id}{ext}"
        # ✅ FIXED: Save to PRODUCT_UPLOAD_FOLDER
        save_path = os.path.join(PRODUCT_UPLOAD_FOLDER, filename)
        file.save(save_path)
        # ✅ FIXED: Dynamic host URL for cross-device access
        image_url = f"{request.host_url.rstrip('/')}/product_images/{filename}"
        conn = db_pool.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE Products SET image=%s WHERE product_id=%s", (image_url, product_id))
        conn.commit()
        return jsonify({"image": image_url}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route("/updateOrderStatus/<int:order_id>", methods=["PUT"])
def update_order_status(order_id):
    conn = None
    cursor = None
    try:
        data = request.json
        new_status = data.get("status")

        if not new_status:
            return jsonify({"error": "Status is required"}), 400

        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)

        # ✅ 1. Get current order status + user_id
        cursor.execute(
            "SELECT status, user_id FROM orders WHERE order_id = %s", (order_id,))
        order = cursor.fetchone()
        if not order:
            return jsonify({"error": "Order not found"}), 404

        old_status = order['status'].lower().strip()
        new_status_lower = new_status.lower().strip()
        uid = order['user_id']

        # ✅ 2. If changing TO 'cancelled'/'canceled', restore stock
        if old_status == 'pending' and new_status_lower in ['cancelled', 'canceled']:
            cursor.execute(
                "SELECT product_id, quantity FROM order_items WHERE order_id = %s", (order_id,))
            order_items = cursor.fetchall()

            updated_products = []
            for item in order_items:
                cursor.execute(
                    "UPDATE Products SET stock = stock + %s WHERE product_id = %s",
                    (item['quantity'], item['product_id'])
                )
                cursor.execute(
                    "SELECT stock FROM Products WHERE product_id = %s", (item['product_id'],))
                new_stock = cursor.fetchone()['stock']
                updated_products.append({
                    'product_id': int(item['product_id']),
                    'stock': int(new_stock)
                })

            # ✅ Emit stock update for CUSTOMER panels (Products.jsx)
            try:
                print(
                    f"📤 Emitting stock_updated for cancellation: {updated_products}")
                socketio.emit('stock_updated', {
                    'items': updated_products,
                    'source': 'order_cancelled_by_admin',
                    'order_id': order_id
                })
                socketio.emit('cart_updated', {
                              'user_id': uid}, room=f'user_{uid}')
                print(f"✅ stock_updated emitted successfully")
            except Exception as e:
                print(f"⚠️ Socket emit failed: {e}")

        # ✅ 3. Update the order status in DB
        cursor.execute(
            "UPDATE orders SET status = %s WHERE order_id = %s", (new_status, order_id))
        conn.commit()

        # ✅ 4. Emit real-time status update to ALL ADMIN panels
        socketio.emit('order_status_updated', {
            'order_id': order_id,
            'old_status': order['status'],
            'new_status': new_status,
            'updated_by': 'admin',
            'timestamp': datetime.now().isoformat()
        })

        # ✅ 5. 🎯 CRITICAL FIX: Emit to SPECIFIC CUSTOMER (real-time modal update)
        try:
            socketio.emit('my_order_status_updated', {
                'order_id': order_id,
                'new_status': new_status,
                'updated_at': datetime.now().isoformat(),
                'message': f'Your order #{order_id} is now {new_status}'
            }, room=f'user_{uid}')  # ← Only this user receives it
            print(f"✅ Emitted my_order_status_updated to user_{uid}")
        except Exception as e:
            print(f"⚠️ User notification emit failed: {e}")

        return jsonify({
            "message": "Order status updated successfully",
            "stock_restored": new_status_lower in ['cancelled', 'canceled'] and old_status == 'pending'
        }), 200

    except Exception as e:
        print(f"❌ updateOrderStatus error: {e}")
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


@app.route("/deleteOrder/<int:order_id>", methods=["DELETE"])
def delete_order(order_id):
    conn = None
    cursor = None
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)

        # ✅ 1. Verify order exists
        cursor.execute(
            "SELECT order_id, status FROM orders WHERE order_id = %s", (order_id,))
        order = cursor.fetchone()
        if not order:
            return jsonify({"error": "Order not found"}), 404

        # ✅ 2. Delete order items first (foreign key constraint)
        cursor.execute(
            "DELETE FROM order_items WHERE order_id = %s", (order_id,))

        # ✅ 3. Delete the order itself
        cursor.execute("DELETE FROM orders WHERE order_id = %s", (order_id,))
        conn.commit()

        # ✅ 4. 🎯 Notify ADMIN panels that order was deleted (for real-time sync)
        socketio.emit('order_status_updated', {
            'order_id': order_id,
            'old_status': order['status'],
            'new_status': 'Deleted',
            'updated_by': 'admin',
            'timestamp': datetime.now().isoformat(),
            'action': 'deleted'  # Flag for frontend to remove vs update
        })

        # ❌ NO stock_updated emit — deletion does NOT restore inventory

        return jsonify({
            "message": "Order deleted successfully",
            "order_id": order_id,
            "stock_restored": False  # Explicit: deletion ≠ cancellation
        }), 200

    except Exception as e:
        import traceback
        print(f"❌ DELETE ERROR: {e}")
        print(f"📋 Traceback: {traceback.format_exc()}")
        if conn:
            conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


if __name__ == '__main__':
    # ✅ Ensure host='0.0.0.0' to accept connections from other devices
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
