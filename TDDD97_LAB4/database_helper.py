"""Database Helper"""
import sqlite3
from sqlite3 import *
from flask import g
import random
from random import randint


DATABASE_URL = 'database.db'


def get_db():
    """Connect to database"""
    db = getattr(g, 'db', None)
    if db is None:
        db = g.db = sqlite3.connect(DATABASE_URL)
    return db

def close_db():
    """Disconnect"""
    db = getattr(g, 'db', None)
    if db is not None:
        g.db.close()
        g.db = None

def create_user(email, password, firstname, familyname, gender, city, country):
    """Create user"""
    try:
        get_db().execute("INSERT into user (email, password, firstname, familyname, gender, city, country) VALUES (?,?,?,?,?,?,?)",(email, password, firstname, familyname, gender, city, country))
        print("Success, User has been inserted into database")
        get_db().commit()
        return True
    except:
        return False

def update_user(new_password, email):
    """Update user"""
    try:
        get_db().execute("UPDATE user SET password = ? WHERE email = ?", (new_password,email))
        get_db().commit()
        return True
    except:
        return False

def create_post(to_email, email, message, location):
    """Add a message to the database"""
    try:
        # Convert the location tuple to a string
        geolocation = f"{location[0]}, {location[1]}"

        # Insert the message into the database
        get_db().execute("INSERT INTO messages(email, to_email, message, geolocation) VALUES (?, ?, ?, ?)", (email, to_email, message, geolocation))
        get_db().commit()

        return True
    except Exception as e:
        print(f"Error inserting message into database: {e}")
        return False


def get_post(email):
    """Get all messages from selected user from the database"""

    cursor = get_db().execute("SELECT email,to_email,message,geolocation FROM messages WHERE to_email = ? ",[email])
    posts = cursor.fetchall()
    cursor.close()
    return [{"email": row[0], "to_email": row[1], "message": row[2], "geolocation": row[3]} for row in posts if row[3] is not None]

def find_user(email):
    """Read user by email"""

    cursor = get_db().execute("SELECT email, password, firstname, familyname, gender, city, country FROM user WHERE email = ?", [email])
    rows = cursor.fetchone()
    cursor.close()
    return rows


def add_login(email, token):
    try:
        get_db().execute("INSERT INTO loggedin (email, token) VALUES (?, ?)",(email, token))
        get_db().commit()
        return True
    except:
        return False

def add_logins(email, token):
    try:
        get_db().execute("INSERT OR REPLACE INTO loggedin (email, token) VALUES (?, ?)",(email, token))
        get_db().commit()
        return True
    except:
        return False


def remove_user(token):
    try:
        get_db().execute("DELETE FROM loggedin WHERE token = ?",[token])
        get_db().commit()
        return True
    except:
        return False

def get_email_from_token(token):
    """Read user by email"""
    cursor = get_db().execute("SELECT email FROM loggedin WHERE token = ?", [token])
    rows = cursor.fetchone()
    cursor.close()
    return rows
def get_token_from_email(email):
    """Read user by email"""
    cursor = get_db().execute("SELECT token FROM loggedin WHERE token = ?", [email])
    rows = cursor.fetchone()
    cursor.close()
    return rows

def change_password(email, newpassword):
    cursor = get_db()
    try:
        cursor.execute('UPDATE user SET password = ? WHERE email =  ?', [newpassword, email])
        cursor.commit()
        return True
    except:
        return False
def generate_token():
    letters = "abcdefghiklmnopqrstuvwwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
    token = ""
    for i in range (0,36):
        token = token + letters[randint(0,len(letters)-1)]
    return token

def remove_login(token):
    cursor = get_db().execute("select email from loggedin where token = ?", [token])
    result = cursor.fetchone()
    cursor.close()
    if result==None:
        return False
    else:
        try:
            res = get_db().execute("delete from loggedin where token = ?", [token])
            get_db().commit()
            return True
        except:
            return False
