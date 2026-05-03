from flask import send_from_directory
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from mysql.connector import pooling
from werkzeug.utils import secure_filename
import os

app = Flask(__name__)
# Change this to a secure random key
app.config['SECRET_KEY'] = 'your-secret-key-here'
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize SocketIO with CORS support
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '@26AEROPPBOT',
    'database': 'breadaholic_database'
}

db_pool = pooling.MySQLConnectionPool(
    pool_name="mypool", pool_size=5, **db_config)


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
    """Allow users to join their personal room for targeted notifications"""
    user_id = data.get('user_id')
    if user_id:
        room = f'user_{user_id}'
        join_room(room)
        print(f'User {user_id} joined room: {room}')
        emit('joined_room', {'room': room, 'user_id': user_id})


@socketio.on('leave_user_room')
def handle_leave_room(data):
    """Allow users to leave their personal room"""
    user_id = data.get('user_id')
    if user_id:
        room = f'user_{user_id}'
        leave_room(room)
        print(f'User {user_id} left room: {room}')


# ==================== REST API ROUTES ====================

@app.route('/')
def home():
    return """
    <div style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f4f7f6;
        color: #333;
    ">
        <div style="
            padding: 40px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            text-align: center;
        ">
            <h1 style="color: #2ecc71; margin-bottom: 10px;">Backend Online</h1>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <code style="background: #eee; padding: 5px 10px; border-radius: 4px;">Status: 200 OK</code>
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

        cursor.close()
        conn.close()

        return jsonify(user), 200
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@app.route('/getFeatured', methods=['GET'])
def get_features():
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM Products WHERE featured = TRUE;")
        featured_product = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify(featured_product), 200
    except Exception as err:
        return jsonify({"error": str(err)}), 404


@app.route('/addUser', methods=['POST'])
def add_user():
    conn = None
    try:
        data = request.json

        fname = data.get('first_name')
        lname = data.get('last_name')
        mobile = data.get('mobile_number')
        barangay = data.get('barangay')
        street = data.get('street_name')
        password = data.get('password')
        pfp = data.get('profile_picture')
        status = data.get('status')

        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM Users WHERE mobile_number = %s", (mobile,))
        if cursor.fetchone():
            return jsonify({"error": "This mobile number is already registered!"}), 409

        sql_add = '''INSERT INTO Users
                    (mobile_number, first_name, last_name, barangay,
                     street_name, password, profile_picture, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)'''

        values = (mobile, fname, lname, barangay,
                  street, password, pfp, status)

        cursor.execute(sql_add, values)
        conn.commit()

        new_id = cursor.lastrowid
        cursor.close()

        return jsonify({
            "message": "User added successfully",
            "user_id": new_id
        }), 201

    except Exception as err:
        if conn:
            conn.rollback()
        return jsonify({"error": str(err)}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()


@app.route('/logIn', methods=['POST'])
def logInAuthentication():
    conn = None
    try:
        data = request.json
        mobile = data.get('mobile_number')
        password = data.get('password')

        print(f"--- LOGIN ATTEMPT ---")
        print(f"Received Mobile: '{mobile}'")
        print(f"Received Password: '{password}'")

        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)

        query = ("SELECT * FROM Users WHERE mobile_number = %s")
        cursor.execute(query, (str(mobile).strip(),))
        user = cursor.fetchone()

        print(f"Database Result: {user}")

        cursor.close()

        if user:
            if user['password'] == password:
                return jsonify({
                    "message": "Log In Successful",
                    "user_id": user['user_id'],
                    "first_name": user['first_name']
                }), 200
            else:
                return jsonify({"error": "Incorrect password"}), 401
        else:
            return jsonify({"error": "User not found"}), 404

    except Exception as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn and conn.is_connected():
            conn.close()


@app.route('/getProducts', methods=['GET'])
def get_products():
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM Products")
        product = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify(product), 200
    except Exception as err:
        return jsonify({"error": str(err)}), 404


@app.route('/add_to_cart', methods=['POST'])
def add_to_cart():
    conn = None
    try:
        data = request.json

        uid = data.get('user_id')
        pid = data.get('product_id')
        qty = data.get('quantity', 1)

        if not uid:
            return jsonify({"error": "User ID is required. Are you logged in?"}), 401

        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)

        check_query = "SELECT ordItem_id, quantity FROM cart_item WHERE user_id = %s AND product_id = %s"
        cursor.execute(check_query, (uid, pid))
        existing_item = cursor.fetchone()

        if existing_item:
            new_qty = existing_item['quantity'] + int(qty)
            update_query = "UPDATE cart_item SET quantity = %s WHERE ordItem_id = %s"
            cursor.execute(
                update_query, (new_qty, existing_item['ordItem_id']))
        else:
            insert_query = "INSERT INTO cart_item (user_id, product_id, quantity) VALUES (%s, %s, %s)"
            cursor.execute(insert_query, (uid, pid, qty))

        conn.commit()

        # Get product details for the notification
        cursor.execute(
            "SELECT product_name, price FROM Products WHERE product_id = %s", (pid,))
        product = cursor.fetchone()

        print(f"Item added to cart for User ID: {uid}")

        # Emit real-time notification to the user's room
        socketio.emit('cart_updated', {
            'user_id': uid,
            'product_id': pid,
            'product_name': product['product_name'] if product else 'Unknown',
            'quantity': qty,
            'action': 'added',
            'message': f"Added {qty} item(s) to cart"
        }, room=f'user_{uid}')

        return jsonify({"status": "success", "message": "Cart updated"}), 200

    except Exception as err:
        if conn:
            conn.rollback()
        return jsonify({"error": str(err)}), 500
    finally:
        if conn:
            conn.close()


@app.route('/view_cart/<int:user_id>', methods=['GET'])
def view_cart(user_id):
    conn = None
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT
                c.ordItem_id,
                p.product_id,
                p.product_name,
                p.price,
                p.image,
                c.quantity,
                (p.price * c.quantity) AS subtotal
            FROM cart_item c
            JOIN Products p ON c.product_id = p.product_id
            WHERE c.user_id = %s
        """
        cursor.execute(query, (user_id,))
        rows = cursor.fetchall()

        cursor.close()

        return jsonify(rows), 200
    except Exception as err:
        return jsonify({"error": str(err)}), 500
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

        # Check current quantity
        cursor.execute(
            "SELECT ordItem_id, quantity FROM cart_item WHERE user_id = %s AND product_id = %s",
            (uid, pid)
        )
        item = cursor.fetchone()

        if item and item['quantity'] > 1:
            new_qty = item['quantity'] - 1
            cursor.execute(
                "UPDATE cart_item SET quantity = %s WHERE ordItem_id = %s",
                (new_qty, item['ordItem_id'])
            )
            conn.commit()

            # Get product name for better notifications
            cursor.execute(
                "SELECT product_name FROM Products WHERE product_id = %s", (pid,))
            product = cursor.fetchone()

            # Emit update with details
            socketio.emit('cart_updated', {
                'user_id': uid,
                'product_id': pid,
                'product_name': product['product_name'] if product else 'Item',
                'action': 'reduced',
                'new_quantity': new_qty
            }, room=f'user_{uid}')

            return jsonify({"status": "success", "new_quantity": new_qty}), 200

        return jsonify({"error": "Cannot reduce below 1"}), 400

    except Exception as err:
        return jsonify({"error": str(err)}), 500
    finally:
        if conn:
            conn.close()


# ==================== ADMIN BROADCAST EXAMPLE ====================
@app.route('/broadcast_new_product', methods=['POST'])
def broadcast_new_product():
    """Example: Admin can broadcast when a new product is featured"""
    try:
        data = request.json
        product_name = data.get('product_name')

        # Broadcast to ALL connected clients
        socketio.emit('new_product_alert', {
            'message': f'New featured product: {product_name}!',
            'product_name': product_name
        }, broadcast=True)

        return jsonify({"status": "success", "message": "Broadcast sent"}), 200
    except Exception as err:
        return jsonify({"error": str(err)}), 500


@app.route('/remove_from_cart', methods=['POST'])
def remove_from_cart():
    conn = None
    try:
        data = request.json
        uid = data.get('user_id')
        # We use the unique ID of the row in the cart_item table
        item_id = data.get('ordItem_id')

        conn = db_pool.get_connection()
        cursor = conn.cursor()

        # SQL Logic: Delete the specific row
        query = "DELETE FROM cart_item WHERE ordItem_id = %s AND user_id = %s"
        cursor.execute(query, (item_id, uid))

        conn.commit()

        # Real-time: Tell the frontend the cart has changed
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
        # This should be the grand total (products + shipping)
        total_price = data.get('total_price')

        shipping_fee = 50  # Matching your React code

        conn = db_pool.get_connection()
        cursor = conn.cursor()

        # 1. Insert into ORDERS
        # Fields: order_id(auto), user_id, barangay, street_name, landmark, order_total, shipping_fee, status
        order_query = """
            INSERT INTO ORDERS (user_id, barangay, street_name, landmark, order_total, shipping_fee, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'Pending')
        """
        cursor.execute(order_query, (
            uid,
            address['barangay'],
            address['street'],
            address['landmark'],
            total_price,
            shipping_fee
        ))

        # Get the ID generated for this specific order
        new_order_id = cursor.lastrowid

        # 2. Insert into ORDER_ITEMS
        # Fields: ord_id(auto), order_id, product_id, quantity, price
        # Note: We use 'new_order_id' for the 'order_id' column
        item_query = """
            INSERT INTO ORDER_ITEMS (order_id, product_id, quantity, price)
            VALUES (%s, %s, %s, %s)
        """
        for item in items:
            cursor.execute(item_query, (
                new_order_id,
                item['product_id'],
                item['quantity'],
                item['price']
            ))

        # 3. Clean up cart_item table
        delete_cart_query = "DELETE FROM cart_item WHERE user_id = %s AND product_id = %s"
        for item in items:
            cursor.execute(delete_cart_query, (uid, item['product_id']))

        conn.commit()

        # Notify frontend
        socketio.emit('cart_updated', {'user_id': uid}, room=f'user_{uid}')

        return jsonify({"status": "success", "order_id": new_order_id}), 201

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"CRITICAL ERROR: {str(e)}")
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

        insert_query = """
            INSERT INTO feedback (user_id, message, rating)
            VALUES (%s, %s, %s)
        """
        cursor.execute(insert_query, (user_id, message, rating))
        conn.commit()

        fetch_query = """
            SELECT f.message, f.rating, u.first_name, u.last_name, u.profile_picture
            FROM feedback f
            JOIN Users u ON f.user_id = u.user_id
            WHERE f.user_id = %s
            ORDER BY f.rev_id DESC
            LIMIT 1
        """
        cursor.execute(fetch_query, (user_id,))
        columns = [col[0] for col in cursor.description]
        new_review = dict(zip(columns, cursor.fetchone()))

        # ✅ No broadcast=True — socketio.emit() from a route already goes to ALL clients
        socketio.emit('new_feedback_received', new_review)

        return jsonify({"status": "success"}), 201

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Error saving feedback: {e}")
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

        query = """
            SELECT f.message, f.rating, u.first_name, u.last_name, u.profile_picture
            FROM feedback f
            JOIN Users u ON f.user_id = u.user_id
            ORDER BY f.rev_id DESC
        """
        cursor.execute(query)

        columns = [column[0] for column in cursor.description]
        feedbacks = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return jsonify(feedbacks), 200

    except Exception as e:
        print(f"Error fetching feedbacks: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


UPLOAD_FOLDER = os.path.join("public", "pfp's")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route("/pfp's/<filename>")
def serve_pfp(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)
# Replace your entire upload_pfp route with this:


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
        save_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(save_path)

        db_path = f"http://127.0.0.1:5000/pfp's/{filename}"

        conn = db_pool.get_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE Users SET profile_picture = %s WHERE user_id = %s",
            (db_path, user_id)
        )
        conn.commit()
        cursor.close()

        return jsonify({"profile_picture": db_path}), 200

    except Exception as e:
        print(f"Upload error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
