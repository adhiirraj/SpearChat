import sqlite3

connection = sqlite3.connect('database.db')

def dict_factory(cursor, row):
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}

connection.row_factory = dict_factory
cursor = connection.cursor()

def add_user(username, argon2_hash, public_key):
    cursor.execute(
        'INSERT INTO Users (username, argon2_hash, public_key) VALUES (?, ?, ?)', 
        (username, argon2_hash, public_key)
    )
    connection.commit()

def add_session(user_id, token, expires_at):
    cursor.execute(
        'INSERT INTO Sessions (user_id, token, expires_at) VALUES (?, ?, ?)', 
        (user_id, token, expires_at)
    )
    connection.commit()

def add_room(name, created_by):
    cursor.execute(
        'INSERT INTO Rooms (name, created_by) VALUES (?, ?)', 
        (name, created_by)
    )
    connection.commit()

def add_message(sender_id, ciphertext, nonce, timestamp, room_id=None, recipient_id=None):
    cursor.execute(
        'INSERT INTO Messages (sender_id, room_id, recipient_id, ciphertext, nonce, timestamp) VALUES (?, ?, ?, ?, ?, ?)', 
        (sender_id, room_id, recipient_id, ciphertext, nonce, timestamp)
    )
    connection.commit()

def fetch_user_by_username(username):
    cursor.execute('SELECT * FROM Users WHERE username = ?', (username,))
    return cursor.fetchone()

def fetch_session_by_token(token):
    cursor.execute('SELECT * FROM Sessions WHERE token = ?', (token,))
    return cursor.fetchone()

def fetch_room_by_room_id(room_id):
    cursor.execute('SELECT * FROM Rooms WHERE id = ?', (room_id,))
    return cursor.fetchone()

def fetch_messages_by_id(msg_id):
    cursor.execute('SELECT * FROM Messages WHERE id = ?', (msg_id,))
    return cursor.fetchone()

def add_membership(user_id, room_id):
    cursor.execute(
        'INSERT INTO Memberships (user_id, room_id) VALUES (?, ?)', 
        (user_id, room_id)
    )
    connection.commit()

def delete_session(token):
    cursor.execute('DELETE FROM Sessions WHERE token = ?', (token,))
    connection.commit()

def fetch_messages_by_room(room_id):
    cursor.execute('SELECT * FROM Messages WHERE room_id = ?', (room_id,))
    return cursor.fetchall()