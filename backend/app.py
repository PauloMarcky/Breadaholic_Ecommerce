from flask import Flask, jsonify, request
from flask_cors import CORS
from mysql.connector import pooling  # Add this import

app = Flask(__name__)
CORS(app)

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '@26AEROPPBOT',
    'database': 'breadaholic_database'
}

db_pool = pooling.MySQLConnectionPool(
    pool_name="mypool", pool_size=5, **db_config)


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
            <p style="color: #666;">LES GUUU</p>
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
            conn.rollback()  # Undo changes if an error occurs
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
                    "user_id": user['user_id']
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


if __name__ == '__main__':
    app.run(debug=True)
