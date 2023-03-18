import sqlite3
from sqlite3 import *
from flask import g

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
    """Create user by inserting user information to the database"""
    try:
        get_db().execute("INSERT into user (email, password, firstname, familyname, gender, city, country) VALUES (?,?,?,?,?,?,?)",(email, password, firstname, familyname, gender, city, country))
        get_db().commit()
        return True
    except:
        return False

def update_user(new_password, email):
    """Update user information in databse"""
    try:
        get_db().execute("UPDATE user SET password = ? WHERE email = ?", (new_password,email))
        get_db().commit()
        return True
    except:
        return False

def create_post(to_email, email, message):
    """Add posted messages to database"""
    get_db().execute("INSERT into messages (email, to_email, message) VALUES (?, ?, ?)", [email,to_email,message])
    get_db().commit()
    return True

def get_post(email):
    """Get all messages from selected user from the database"""

    cursor = get_db().execute("SELECT email,to_email,message FROM messages WHERE to_email = ? ",[email])
    posts = cursor.fetchall()
    cursor.close()
    return posts

def find_user(email):
    """find user data by email"""

    cursor = get_db().execute("SELECT email, password, firstname, familyname, gender, city, country FROM user WHERE email = ?", [email])
    rows = cursor.fetchone()
    cursor.close()
    return rows


def add_login(email, token):
    """ Insert loggin information(email and token) to database"""
    try:
        get_db().execute("INSERT INTO loggedin (email, token) VALUES (?, ?)",(email, token))
        get_db().commit()
        return True
    except:
        return False
    
def remove_user(token):
    """Remove user from loggedin database"""

    try:
        get_db().execute("DELETE FROM loggedin WHERE token = ?",[token])
        get_db().commit()
        print(token)
        return True
    except:
        return False

def get_email_from_token(token):
    """Get email of the user from data"""

    cursor = get_db().execute("SELECT email FROM loggedin WHERE token = ?", [token])
    rows = cursor.fetchone()
    cursor.close()
    return rows

    
