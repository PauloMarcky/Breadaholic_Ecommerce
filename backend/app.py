from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from mysql.connector import pooling
from werkzeug.utils import secure_filename
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'

# ✅ Allow requests from any device on the network
CORS(app, resources={r"/*": {"origins": "*"}})

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
    cursor = None

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body is required"}), 400

        mobile = str(data.get('mobile_number', '')).strip()
        fname = data.get('first_name', '').strip()
        lname = data.get('last_name', '').strip()

        if not mobile or not fname or not lname:
            return jsonify({"error": "Missing required fields"}), 400

        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            "SELECT mobile_number FROM Users WHERE mobile_number = %s", (mobile,))
        if cursor.fetchone():
            return jsonify({"error": "This mobile number is already registered!"}), 409

        sql_add = '''INSERT INTO Users
                    (mobile_number, first_name, last_name, barangay,
                     street_name, password, profile_picture, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)'''
        values = (mobile, fname, lname, data.get('barangay'),
                  data.get('street_name'), data.get('password'),
                  data.get('profile_picture'), data.get('status', 'active'))

        cursor.execute(sql_add, values)
        conn.commit()
        new_id = cursor.lastrowid

        return jsonify({
            "message": "User added successfully",
            "user_id": new_id,
            "first_name": fname
        }), 201

    except Exception as err:
        print(f"❌ addUser error: {err}")
        if conn:
            conn.rollback()
        return jsonify({"error": str(err)}), 500

    finally:
        if cursor:
            try:
                cursor.close()
            except Exception as e:
                print(f"⚠️ Error closing cursor: {e}")
        if conn:
            try:
                conn.close()
            except Exception as e:
                print(f"⚠️ Error closing connection: {e}")


@app.route('/logIn', methods=['POST'])
def logInAuthentication():
    conn = None
    try:
        data = request.json
        mobile = data.get('mobile_number')
        password = data.get('password')

        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        query = ("SELECT * FROM Users WHERE mobile_number = %s")
        cursor.execute(query, (str(mobile).strip(),))
        user = cursor.fetchone()
        cursor.close()

        if user:
            if user['password'] == password:
                return jsonify({
                    "message": "Log In Successful",
                    "user_id": user['user_id'],
                    "first_name": user['first_name'],
                    "role": user['role']
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

        cursor.execute(
            "SELECT product_name, price FROM Products WHERE product_id = %s", (pid,))
        product = cursor.fetchone()

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
                p.stock,
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

            cursor.execute(
                "SELECT product_name FROM Products WHERE product_id = %s", (pid,))
            product = cursor.fetchone()

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


@app.route('/broadcast_new_product', methods=['POST'])
def broadcast_new_product():
    try:
        pass
    except Exception as err:
        pass


@app.route('/remove_from_cart', methods=['POST'])
def remove_from_cart():
    conn = None
    try:
        data = request.json
        uid = data.get('user_id')
        item_id = data.get('ordItem_id')

        conn = db_pool.get_connection()
        cursor = conn.cursor()
        query = "DELETE FROM cart_item WHERE ordItem_id = %s AND user_id = %s"
        cursor.execute(query, (item_id, uid))
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
        cursor = conn.cursor()

        for item in items:
            cursor.execute(
                "SELECT stock FROM Products WHERE product_id = %s FOR UPDATE", (item['product_id'],))
            row = cursor.fetchone()
            if not row or row[0] < item['quantity']:
                conn.rollback()
                return jsonify({"error": f"Not enough stock for product."}), 400

        cursor.execute(
            "INSERT INTO ORDERS (user_id, barangay, street_name, landmark, order_total, shipping_fee, status) VALUES (%s, %s, %s, %s, %s, %s, 'Pending')",
            (uid, address['barangay'], address['street'],
             address['landmark'], total_price, shipping_fee)
        )
        new_order_id = cursor.lastrowid

        for item in items:
            cursor.execute(
                "INSERT INTO ORDER_ITEMS (order_id, product_id, quantity, price) VALUES (%s, %s, %s, %s)",
                (new_order_id, item['product_id'],
                 item['quantity'], item['price'])
            )

        updated_products = []
        for item in items:
            cursor.execute("UPDATE Products SET stock = stock - %s WHERE product_id = %s",
                           (item['quantity'], item['product_id']))
            cursor.execute(
                "SELECT stock FROM Products WHERE product_id = %s", (item['product_id'],))
            new_stock = max(0, cursor.fetchone()[0])
            updated_products.append(
                {'product_id': int(item['product_id']), 'stock': new_stock})

        for item in items:
            cursor.execute(
                "DELETE FROM cart_item WHERE user_id = %s AND product_id = %s", (uid, item['product_id']))

        conn.commit()

        print(
            f"✅ Order {new_order_id} committed. Stock updates: {updated_products}")

        try:
            socketio.emit('cart_updated', {'user_id': uid}, room=f'user_{uid}')
            print(f"📤 Emitted cart_updated to room user_{uid}")
            socketio.emit('stock_updated', {
                          'items': updated_products}, broadcast=True)
            print("📤 Emitted stock_updated globally")
        except Exception as e:
            print(f"⚠️ Socket emit failed: {e}")

        return jsonify({"status": "success", "order_id": new_order_id, "message": "Order placed successfully!"}), 201

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"🚨 Confirm order error: {e}")
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

        insert_query = "INSERT INTO feedback (user_id, message, rating) VALUES (%s, %s, %s)"
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
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()


UPLOAD_FOLDER = os.path.join("public", "pfp's")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route("/pfp's/<filename>")
def serve_pfp(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


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

        # ✅ FIX: Use dynamic host URL instead of hardcoded 127.0.0.1
        db_path = f"{request.host_url.rstrip('/')}/pfp's/{filename}"

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

        query = """
            SELECT
                o.order_id,
                o.user_id,
                o.barangay,
                o.street_name,
                o.landmark,
                o.order_total,
                o.shipping_fee,
                o.status,
                u.first_name,
                u.last_name,
                u.mobile_number
            FROM ORDERS o
            JOIN Users u ON o.user_id = u.user_id
            ORDER BY o.order_id DESC
        """
        cursor.execute(query)
        orders = cursor.fetchall()

        cursor.close()
        return jsonify(orders), 200

    except Exception as e:
        print(f"Error fetching orders: {e}")
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
        cursor.execute(
            """SELECT barangay, street_name, landmark,
               barangay_second, street_name_second, landmark_second,
               barangay_third, street_name_third, landmark_third
               FROM Users WHERE user_id = %s""",
            (user_id,)
        )
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "User not found"}), 404

        addresses = []
        if user['barangay'] or user['street_name']:
            addresses.append({
                "id": 1, "position": 1,
                "barangay": user['barangay'] or "",
                "street": user['street_name'] or "",
                "landmark": user['landmark'] or ""
            })
        if user['barangay_second'] or user['street_name_second']:
            addresses.append({
                "id": 2, "position": 2,
                "barangay": user['barangay_second'] or "",
                "street": user['street_name_second'] or "",
                "landmark": user['landmark_second'] or ""
            })
        if user['barangay_third'] or user['street_name_third']:
            addresses.append({
                "id": 3, "position": 3,
                "barangay": user['barangay_third'] or "",
                "street": user['street_name_third'] or "",
                "landmark": user['landmark_third'] or ""
            })

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
            return jsonify({"error": "Missing required fields (user_id, barangay, street)"}), 400

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

        cursor.execute("""
            SELECT status, user_id FROM orders 
            WHERE order_id = %s
        """, (order_id,))
        order_result = cursor.fetchone()

        if not order_result:
            return jsonify({"error": "Order not found"}), 404

        if str(order_result['user_id']) != str(user_id):
            return jsonify({"error": "Unauthorized"}), 403

        db_status = order_result['status'].lower().strip()
        if db_status != 'pending':
            return jsonify({
                "error": f"Only 'Pending' orders can be cancelled (current: '{order_result['status']}')"
            }), 400

        cursor.execute("""
            SELECT product_id, quantity FROM order_items 
            WHERE order_id = %s
        """, (order_id,))
        order_items = cursor.fetchall()

        cursor.execute("""
            UPDATE orders 
            SET status = 'Cancelled'
            WHERE order_id = %s AND user_id = %s
        """, (order_id, user_id))

        updated_products = []
        for item in order_items:
            cursor.execute("""
                UPDATE products 
                SET stock = stock + %s 
                WHERE product_id = %s
            """, (item['quantity'], item['product_id']))

            cursor.execute(
                "SELECT stock FROM products WHERE product_id = %s", (item['product_id'],))
            new_stock = cursor.fetchone()['stock']

            updated_products.append({
                'product_id': int(item['product_id']),
                'stock': int(new_stock)
            })

        conn.commit()
        print(
            f"✅ Order {order_id} cancelled. Stock restored for {len(updated_products)} item(s)")

        try:
            socketio.emit('stock_updated', {
                'items': updated_products,
                'source': 'order_cancelled',
                'order_id': order_id
            }, broadcast=True)
            print(f"📡 Emitted stock_updated: {updated_products}")
        except Exception as e:
            print(f"⚠️ Socket emit failed: {e}")

        return jsonify({
            "message": "Order cancelled successfully",
            "order_id": order_id
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Cancel order error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


def restore_stock_for_order(order_id, db_pool):
    conn = None
    cursor = None
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT product_id, quantity FROM order_items 
            WHERE order_id = %s
        """, (order_id,))
        items = cursor.fetchall()

        if not items:
            print(
                f"⚠️ No items found for order {order_id}. Nothing to restore.")
            return

        print(
            f"🔄 Restoring stock for {len(items)} item(s) in order {order_id}...")

        for item in items:
            cursor.execute("""
                UPDATE products 
                SET stock = stock + %s 
                WHERE product_id = %s
            """, (item['quantity'], item['product_id']))
            print(
                f"  ✅ Added {item['quantity']} back to product {item['product_id']}")

        conn.commit()
        print(f"✅ Successfully restored stock for order {order_id}")

    except Exception as e:
        print(f"❌ Stock restore error: {e}")
        import traceback
        traceback.print_exc()
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


@app.route('/addProduct', methods=['POST'])
def add_product():
    try:
        data = request.json
        product_name = data.get('product_name')
        price = data.get('price')
        stock = data.get('stock')
        category = data.get('category')

        connection = db_pool.get_connection()
        cursor = connection.cursor()

        query = """
            INSERT INTO products
            (
                product_name,
                price,
                stock,
                category
            )
            VALUES (%s, %s, %s, %s)
        """

        values = (product_name, price, stock, category)
        cursor.execute(query, values)
        connection.commit()
        product_id = cursor.lastrowid
        cursor.close()
        connection.close()

        return jsonify({
            "message": "Product added successfully",
            "product_id": product_id
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


PRODUCT_UPLOAD_FOLDER = os.path.join("public", "product_images")
os.makedirs(PRODUCT_UPLOAD_FOLDER, exist_ok=True)


@app.route("/product_images/<filename>")
def serve_product_image(filename):
    return send_from_directory(PRODUCT_UPLOAD_FOLDER, filename)


@app.route("/upload_product_image", methods=["POST"])
def upload_product_image():
    conn = None
    try:
        product_id = request.form.get("product_id")
        file = request.files.get("file")

        if not product_id:
            return jsonify({"error": "No product_id"}), 400
        if not file:
            return jsonify({"error": "No file"}), 400

        filename = secure_filename(file.filename)
        ext = os.path.splitext(filename)[1]
        new_filename = f"product_{product_id}{ext}"
        save_path = os.path.join(PRODUCT_UPLOAD_FOLDER, new_filename)
        file.save(save_path)

        # ✅ FIX: Use dynamic host + correct port (5000) instead of hardcoded 127.0.0.1:5001
        image_url = f"{request.host_url.rstrip('/')}/product_images/{new_filename}"

        conn = db_pool.get_connection()
        cursor = conn.cursor()
        update_query = """
            UPDATE products
            SET image = %s
            WHERE product_id = %s
        """
        cursor.execute(update_query, (image_url, product_id))
        conn.commit()
        print("ROWS UPDATED:", cursor.rowcount)
        cursor.close()

        return jsonify({
            "message": "Image uploaded",
            "image": image_url
        })

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
        status = data.get("status")

        conn = db_pool.get_connection()
        cursor = conn.cursor()
        query = """
            UPDATE orders
            SET status = %s
            WHERE order_id = %s
        """
        cursor.execute(query, (status, order_id))
        conn.commit()

        return jsonify({"message": "Order status updated successfully"}), 200

    except Exception as e:
        print("UPDATE STATUS ERROR:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route("/deleteOrder/<int:order_id>", methods=["DELETE"])
def delete_order(order_id):
    conn = None
    cursor = None
    try:
        conn = db_pool.get_connection()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT order_id FROM orders WHERE order_id = %s", (order_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Order not found"}), 404

        cursor.execute(
            "DELETE FROM order_items WHERE order_id = %s", (order_id,))
        query = "DELETE FROM orders WHERE order_id = %s"
        cursor.execute(query, (order_id,))
        conn.commit()

        return jsonify({
            "message": "Order deleted successfully",
            "order_id": order_id
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
        if conn:
            conn.close()


if __name__ == '__main__':
    # ✅ Ensure host='0.0.0.0' to accept connections from other devices
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
