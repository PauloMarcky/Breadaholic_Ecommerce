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


@app.route('/getUser', methods=['GET'])
def get_user():
    try:
        # Get a connection from the pool
        conn = db_pool.get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM Users WHERE user_id = 3;")
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

        sql_add = '''INSERT INTO Users 
                    (mobile_number, first_name, last_name, barangay, street_name, password, profile_picture, status)
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


if __name__ == '__main__':
    app.run(debug=True)
