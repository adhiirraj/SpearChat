import sqlite3

def init_db():
    connection = sqlite3.connect('database.db')
    cursor = connection.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            argon2_hash TEXT NOT NULL,
            public_key TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            FOREIGN KEY(user_id) REFERENCES Users(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_by INTEGER NOT NULL,
            FOREIGN KEY(created_by) REFERENCES Users(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Memberships (
            user_id INTEGER NOT NULL,
            room_id INTEGER NOT NULL,
            FOREIGN KEY(user_id) REFERENCES Users(id),
            FOREIGN KEY(room_id) REFERENCES Rooms(id),
            PRIMARY KEY(user_id, room_id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            room_id INTEGER,
            recipient_id INTEGER,
            ciphertext TEXT NOT NULL,
            nonce TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(sender_id) REFERENCES Users(id),
            FOREIGN KEY(room_id) REFERENCES Rooms(id),
            FOREIGN KEY(recipient_id) REFERENCES Users(id)
        )
    ''')

    connection.commit()
    connection.close()
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()
