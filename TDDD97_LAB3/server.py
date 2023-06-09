"""Server"""
from flask import Flask, jsonify, request, make_response
import uuid
import database_helper
from flask_sock import Sock
import bcrypt
from email_validator import validate_email, EmailNotValidError
import math
from random import random
from flask import g

app = Flask(__name__, static_url_path = '/static')#in case flask does not recognize folder
sockets = Sock(app)
loggedIn = {}


@sockets.route('/connectsocket')
def connectsocket(sock):
    print("Entered the function")
    while True:
        try:
            token = sock.receive() # Token received from client
            print("Token recieved")
            print(token)
            email = database_helper.get_email_from_token(token)
            print(email)
            if email!=None: # If email exists in database
                print("Email exist in DB")
                email = email[0]
                print(email)
                oldsock = loggedIn.get(email) # Get connection from dictionary by seacrhing with email
                loggedIn[email] = sock # Set new connection
                if oldsock!=None: # If old connection exists
                    print("Old connection exists")
                    try:
                        print("Sending signout")
                        oldsock.send('Signout') # Send signout message to client side
                        oldtoken = database_helper.get_token_from_email(email)[0]
                        result = database_helper.remove_login(oldtoken) # Removing old connection token from database
                    except:
                        continue
        except:
            break



app.debug = True
#session = {'token':'email'}
@app.teardown_request
def after_request(exception):
    database_helper.close_db()


@app.route('/')
def root():
    return app.send_static_file('client.html')


def token_has_error(token):
    """All token standard error checks"""
    if token is None:
        # "Server received no token"
        return True, 400
    return False, 0

def input_has_error(input):
    """All standard input error checks"""
    if input is None:        # "Server received no " + str
        return True
    return False


@app.route("/myServer/sign_in", methods=['POST'])
def sign_in():
    """Sign in user"""
    data = request.get_json()
    if 'email' not in data or 'password' not in data:

    # Validate Email
        return jsonify({}), 400
    else:
        email = data['email']
        password = data['password']
        if email=="" or password=="":
            return jsonify({}), 400
        else:
            # Do the user have an account?
            rows = database_helper.find_user(email)

            if rows is None or rows == []:
                return jsonify({}), 404  #"No user found by your email"
            else:
                if password != rows[1]:
                    return jsonify({}), 401 #"Incorrect password")
                else:
                # Generate a random token
                    token = str(uuid.uuid4())
                    logged = database_helper.add_logins(email, token)
                    if logged:
                        return jsonify({'data': token}), 200 #"Server inserted user data into database"
                    else:
                        return jsonify({}), 409 # Cannot insert into database



@app.route("/myServer/sign_up", methods=['POST'])
def sign_up():
    """Sign up a user"""
    json_obj = request.get_json()
    if 'email' not in json_obj or 'password' not in json_obj or 'repeat_password' not in json_obj or 'firstname' not in json_obj or 'familyname' not in json_obj or 'gender' not in json_obj or 'city' not in json_obj or 'country'not in json_obj:
        return jsonify({}), 400
    else:
        email = json_obj['email']

        if email == "":
            return jsonify({}), 400
        else:

            # Checking that the user does not already exist
            if database_helper.find_user(email) is not None:
                return jsonify({}), 409   #"Error: User already exists"
            else:
            # Store inputs in local variables
                password = json_obj['password']
                repeat_password = json_obj['repeat_password']
                firstname = json_obj['firstname']
                familyname = json_obj['familyname']
                gender = json_obj['gender']
                city = json_obj['city']
                country = json_obj['country']

                # Error checks
                if password == "" or repeat_password == "" or firstname== "" or familyname == "" or gender == "" or city== "" or country == "":
                    print("33333333333333!!!!!!!!!")
                    return jsonify({}), 400
                #Error checking password length and if old and new passwords are same
                else:
                    if (password==repeat_password) and len(password)>=5 and len(password)< 15:
                # Attempts to insert the user data to the database
                        if database_helper.create_user(email, password, firstname, familyname, gender, city, country):
                            return jsonify({}), 200 #"Server inserted user data into database"
                        else:
                            print("4444444444444444!!!!!!!!!!!!")
                            return jsonify({}), 400
                    else:
                        print("55555555555!!!!!!!!!!!!")
                        return jsonify({}), 400


        


@app.route("/myServer/sign_out", methods=['POST'])
def sign_out():
    """Sign out user"""
    token = request.headers["Authorization"]

    # Validate Token
    if token == "":
        return jsonify({}), 400 #Bad request
    else:
        # set user to not logged in
        if database_helper.get_email_from_token(token):
            signout = database_helper.remove_user(token)
            if signout:
                return jsonify({}), 200 # "Successfully signed out"
            else:
                return jsonify({}), 401 # unauthorized
        else:
            return jsonify({}), 404 #Wrong Token


@app.route("/myServer/change_password", methods=['PUT'])
def change_password():
    """Change password for the current user"""
    token = request.headers["Authorization"]

    # Validate Token
    if token is None:
        print("KILLLLL")
        return jsonify({}), 400 #Bad request
    else:
        json_obj = request.get_json()
        if'old_password' not in json_obj or 'new_password' not in json_obj or 'repeatnew_password' not in json_obj:
            print("BLINGGG")
            return jsonify({}), 400 #Bad request
        else:
            old_password = json_obj['old_password']
            new_password = json_obj['new_password']
            repeatnew_password = json_obj['repeatnew_password']
            # Validate New Password
            if old_password=="" or new_password=="" or repeatnew_password=="":
                print("22222222222222222222222")
                return jsonify({}), 400 #Bad request
            else:
                if(new_password == repeatnew_password and len(new_password)>=5 and len(new_password)< 15):
            # Extracting the email of the current user
                    email = database_helper.get_email_from_token(token)[0]

                    print("EEEEEEEEEEEEEMMMMMMMMMMAAAAAAAAAILLLlll")
                    if email is not None:
                # Validation of the old password and attemption to change it to the new one

                        if old_password == database_helper.find_user(email)[1]: #checks if old_password is correct
                            status = database_helper.update_user(new_password, email)
                            if status:
                                return jsonify({}), 200  # "Password has been changed!"
                            else:
                                return jsonify({}), 500 # "Password has not been changed"
                        else:
                            print("33333333333333333")
                            return jsonify({}), 400 # "Old password incorrect"
                    else:
                        print("444444444444444444444444")
                        return jsonify({}), 400 #bad request
                else:
                        print("5555555555555555555")
                        return jsonify({}), 400 #bad request


@app.route("/myServer/getDataByToken", methods=['GET'])
def get_user_data_by_token():
    """Verify current user through token and attemp to return the data of the user"""
    token = request.headers["Authorization"]

    # Validate token
    if token =="":
        return jsonify({}), 400 #Bad request
    # Extracting the email of the current user
    else:
        email = database_helper.get_email_from_token(token)
        if email is not None:
            email = email[0]
            data = database_helper.find_user(email)
            formated_data = {"email": data[0], "firstname": data[2], "familyname": data[3], "gender": data[4], "city": data[5], "country": data[6]}
            return jsonify({"data" : formated_data}), 200 # "Data successfully sent to you!"
        else:
            return jsonify({}), 404  # "User not signed in or invalid access token"


@app.route("/myServer/getDataByEmail", methods=['GET'])
def get_user_data_by_email():
    """Get user data by email"""
    token = request.headers["Authorization"]
    req_email = request.headers["req_email"] #change it to param????
    print(type(req_email))
    # Validate Token
    if token is None:
        return jsonify({}), 400 #Bad request



    # Validate email
    else:

        if req_email == "":
            print("404 FIRST")
            return jsonify({}), 404
        else:

        # Attempting to find the data of the current user in the database
            data = database_helper.find_user(req_email)

            if data is None or data == []:
                print("404 SECOND")
                return jsonify({}), 404 #"No user found by your destination email"
            else:
                formated_data = {"email": data[0], "firstname": data[2], "familyname": data[3], "gender": data[4], "city": data[5], "country": data[6]}
                return jsonify({"data" : formated_data}), 200 # "Data successfully sent to you!"


@app.route("/myServer/getUserMessageByToken", methods=['GET'])
def get_user_messages_by_token():
    """Get user's message wall thought the token of the user"""
    token = request.headers["Authorization"]

    # Validate Token
    if token =="":
        return jsonify({}), 400 #Bad request
    else:
    # Extracting the email of the current user
        email = database_helper.get_email_from_token(token)
        if email is not None:
            email = email[0]
            data = database_helper.get_post(email)
            if data != []:
                #data = data[0]
                #message = {"email": data[0], "to_email": data[1], "message": data[2]}
                #print(message)
                return jsonify({"data" : data }), 200 # "Data successfully sent to you!"
            else:
                return jsonify({"data" : ""}), 200
        else:
            return jsonify({}), 404 #"No user found with the email provided"



@app.route("/myServer/getMessagesByEmail", methods=['GET'])
def get_user_messages_by_email():
    """Get user's message wall thought the email of the user"""
    token = request.headers["Authorization"]
    req_email = request.headers["req_email"]

    # Validate Token
    if token == "":
        return jsonify({}), 400 #Bad request
    else:
        if req_email == "":
            return jsonify({}), 404
    # Validate input email
        else:
            data = database_helper.find_user(req_email)
            if data is None or data == []:
                return jsonify({}), 404 #"No user found by your destination email"

        # post-information displayed
            else:
                email = data[0]
                data = database_helper.get_post(email)
                if(data is None or data == []):
                    return jsonify({}), 204 #"No msg found on wall of user provided"
                else:
                    #message = {"email": data[0], "to_email": data[1], "message": data[2]}
                    return jsonify({"data" : data}), 200 # "Data successfully displayed!"


@app.route("/myServer/post", methods=['POST'])
def post_message():
    """Post a message on sombody's wall"""

    # Find out sender's email
    token = request.headers["Authorization"]
    if token == "":
        return jsonify({}),400
    else:
    # Extracting the email of the current user
        email = database_helper.get_email_from_token(token)
        if email is not None:
            email=email[0]
            json_obj = request.get_json()
            if 'email' not in json_obj or 'message' not in json_obj:
                print("ZEROTH 400")
                return jsonify({}), 400

            # Find out & check email we are posting to
            else:
                to_email = json_obj['email']
                if to_email == "":
                    print("FIRST 400")
                    return jsonify({}), 400
            # Finding out if the user exist, who we wanna write a message to
                else:
                    rows = database_helper.find_user(to_email)
                    print(to_email)
                    print("ROWWWWW")
                    print(rows)
                    print("EMAIL")
                    print(email)
                    if rows is None or rows == []:
                        print("FIRST 404")
                        return jsonify({}), 404 #"No user found by your destination email"
                    else:
            # Verify message posting
                        message = json_obj['message']
                        if message== "":
                            print("SECOND 400")
                            return jsonify({}), 400 #Bad request
                        else:
            # error checking function or OK
                            if not database_helper.create_post(to_email,email,message):
                                print("HELLOO %======")
                                return jsonify({}), 500 #"Server failed to post message to database"
                            else:
                                return jsonify({}), 200 #"Succeeded to post message")
        else:
            print("SECOND 404")
            return jsonify({}), 404 # No email id with given token


if __name__ == '__main__':
    app.debug = True
    app.run()
