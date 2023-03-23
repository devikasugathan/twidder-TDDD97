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
import smtplib
import ssl
from email.message import EmailMessage
from flask_bcrypt import Bcrypt
import requests
#app = Flask(__name__)
app = Flask(__name__, static_url_path = '/static')
sockets = Sock(app)
bcrypt = Bcrypt(app)
loggedIn = {}
email = "my+address@mydomain.tld"
is_new_account = True

#Connect socket function for handling multiple sessions.Once a connection is opened, the token for current user is passer over to this function from JS part.
#The token is the passed on to get_email_from_token for finding the associated email.
#We use Sock which is a simple extension to implement WebSocket communication between a client and the server
#Checks if the email exists in database
#Check for the connection by this email from the logged in dictionary. The logged in dictionary gets updated with the new connection everytime with the email associated
#oldsock gets the old connection from the email associated with the token recieved. It is taken from the loggedin dictionary.
#If an old connection exist we send a signout message: oldsock.send('Signout') to the client side.
#now we take the old token for this email from database using get_token_from_email(email)[0] and store as old token.
#This oldtoken is then removed from the database using remove_login("delete from loggedin where token = ?", [token])

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

# sign_in function is for signing in already registered user. The user can sign in with registerd user email and password.
# email is validated with an email validator, validate_email(email, check_deliverability=is_new_account) where email is of the form "my+address@mydomain.tld", and is_new_account = True.
# The hashed password in database is checked with the entered password with bcrypt.check_password_hash(hashedpassword, password).
# Once the user is sucessfully logged in, 'loggedin' database is updated with email and a token generated.
# If the email doesnnot exist the a 404 not found is generated and if the entered password is wrong 401 incorrect password is shown to the user.

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
    # Checking if email or password is empty and return bad request if empty
        if email=="" or password=="":
            return jsonify({}), 400
        else:
            try:
    # Check if email address is valid.
                validation = validate_email(email, check_deliverability=is_new_account)
                email = validation.email
            except EmailNotValidError as e:
    # Email is not valid.
                print(str(e))
                return jsonify({}), 400 #Bad request
    # Extracting user data with email provided
            rows = database_helper.find_user(email)
            if rows is None or rows == []:
                return jsonify({}), 404  #"No user found by your email"
            else:
    # Checking entered password is correct or not
                hashedpassword= rows[1]
                if not bcrypt.check_password_hash(hashedpassword, password):
                    return jsonify({}), 401 #"Incorrect password")
                else:
    # Generate a random token
                    token = str(uuid.uuid4())
                    logged = database_helper.add_logins(email, token)
                    if logged:
                        return jsonify({'data': token}), 200 #"Server inserted user data into database"
                    else:
                        return jsonify({}), 409 # Cannot insert into database


#sign up function is for a new user to sign up to twidder.
# If the email is already not registred in the database, the user can sign up if all other requirments are satisfied.
# email is validated with an email validator, validate_email(email, check_deliverability=is_new_account) where email is of the form "my+address@mydomain.tld", and is_new_account = True.
# Other requirments include all fields are filled, email is valid, password length is between 5 and 15, password and repeat passwords are same.
# The password is hashed before stored to the database. bcrypt.generate_password_hash(password) from Bcrypt is used to hash the password.
# If any of the criteria is wrong the user get a error message else can successfully sign up and 'user' database were information of all users are stored is updated.
@app.route("/myServer/sign_up", methods=['POST'])
def sign_up():
    """Sign up a user"""
    json_obj = request.get_json()
    if 'email' not in json_obj or 'password' not in json_obj or 'repeat_password' not in json_obj or 'firstname' not in json_obj or 'familyname' not in json_obj or 'gender' not in json_obj or 'city' not in json_obj or 'country'not in json_obj:
        return jsonify({}), 400
    else:
        email = json_obj['email']
    # Checking if email is empty
        if email == "":
            return jsonify({}), 400
        else:
            try:
    # Check if email address is valid.
                validation = validate_email(email, check_deliverability=is_new_account)
                email = validation.email
            except EmailNotValidError as e:
    # Email is not valid.
                print(str(e))
                return jsonify({}), 400 #Bad request
    # user already exist or not
            if database_helper.find_user(email) is not None:
                return jsonify({}), 409   #User already exists
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
                    return jsonify({}), 400
    # Error checking password length and if password and repeat passwords are same and hashing the password before storing to the database
                else:
                    if (password==repeat_password) and len(password)>=5 and len(password)< 15:
                        hashedpassword = bcrypt.generate_password_hash(password)

    # Attempts to insert the user data to the database
                        if database_helper.create_user(email, hashedpassword, firstname, familyname, gender, city, country):
                            return jsonify({}), 201 # Server inserted user data into database
                        else:
                            print("CHECK 2 SU")
                            return jsonify({}), 500 # Cannot add to the database
    # Error if password doesnt match the criteria
                    else:
                        print("CHECK 3 SU")
                        return jsonify({}), 400


# The signout function is for the user to signout of a previously signed in account through unique token generated for the account.
# If the authorization token is correct, the user can successfull signout from the account.
# If wrong token, the user get a 404 not found and if the user is not signed in 401 unsuthorized.
# The user information (email and token) are removed from the 'loggedin' database when the user sucessfully signout.

@app.route("/myServer/sign_out", methods=['DELETE'])
def sign_out():
    """Sign out user"""
    token = request.headers["Authorization"]

    # Validate Token
    if token == "":
        return jsonify({}), 400 #Bad request
    else:
    # Checking if user is signed in or not
        if database_helper.get_email_from_token(token):
    # Removing user info from the database
            signout = database_helper.remove_user(token)
            if signout:
                return jsonify({}), 200 # "Successfully signed out"
            else:
                return jsonify({}), 401 # unauthorized
        else:
            return jsonify({}), 404 # Wrong Token

# The change_password function is for changing password of an existing account. The user can change password if the user is signed in to the account.
# The token is validated 'old password', new password' and 'repeat password are entered by the user. If the old password is correct and new password is same as repeated password and satisfy password criteras such as length,
# bcrypt.check_password_hash(hashed_old_password, old_password) is used to check if hashed old password is same as the entered old password by the user.
# the password is hashed and updated in the 'user' database. bcrypt.generate_password_hash(password)
# Else the user get a error message if any of the criteria is not satisfied.
@app.route("/myServer/change_password", methods=['PUT'])
def change_password():
    """Change password for the current user"""
    token = request.headers["Authorization"]

    # Validate Token
    if token is None:
        return jsonify({}), 400 #Bad request
    else:
        json_obj = request.get_json()
    # Checking if all the required fields are not empty
        if'old_password' not in json_obj or 'new_password' not in json_obj or 'repeatnew_password' not in json_obj:
            return jsonify({}), 400 #Bad request
        else:
            old_password = json_obj['old_password']
            new_password = json_obj['new_password']
            repeatnew_password = json_obj['repeatnew_password']
    # Validate New Password
            if old_password=="" or new_password=="" or repeatnew_password=="":
                return jsonify({}), 400 #Bad request
            else:
                if(new_password == repeatnew_password and len(new_password)>=5 and len(new_password)< 15):
    # Extracting the email of the current user
                    email = database_helper.get_email_from_token(token)[0]
                    if email is not None:
    # Validation of the old password and attemption to change it to the new one
                        hashed_old_password = database_helper.find_user(email)[1]
                        if bcrypt.check_password_hash(hashed_old_password, old_password):
    # Hashing new password and updatin the database
                            hashed_new_password = bcrypt.generate_password_hash(new_password)
                            status = database_helper.update_user(hashed_new_password, email)
                            if status:
                                return jsonify({}), 200  # Password has been changed!
                            else:
                                return jsonify({}), 500 # Password has not been changed
    # Error messages generated
                        else:
                            return jsonify({}), 400 # Old password incorrect
                    else:
                        return jsonify({}), 404 # Not found
                else:
                        return jsonify({}), 400 # bad request


# The function is to get user information with token usinf 'GET' method. The token provided is validated and email of the corresponding token is extraced from the database.
# If the email exists the user information of the user is displayed. Otherwise an error.

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
    # Getting user info from the database
            data = database_helper.find_user(email)
            formated_data = {"email": data[0], "firstname": data[2], "familyname": data[3], "gender": data[4], "city": data[5], "country": data[6]}
            return jsonify({"data" : formated_data}), 200 # "Data successfully sent to you!"
        else:
            return jsonify({}), 404  # "User not signed in or invalid access token"


# The function extracts user data from the database of email provided. The token of the signed in user is validated and checks if user with provided email exists.
# If the user exists information of the user is extracted from the 'user' database
#@app.route("/myServer/getDataByEmail", methods=['GET'])
#def get_user_data_by_email():
@app.route("/myServer/getDataByEmail/<email>", methods = ['GET'])
def get_user_data_by_email(email):
    """Get user data by email"""
    token = request.headers["Authorization"]
    #req_email = request.headers["req_email"]
    req_email = email
    print("req_email")
    print(req_email)
    # Validate Token
    if token is None:
        return jsonify({}), 400 #Bad request
    # Validate email
    else:
        if req_email == "":
            return jsonify({}), 400 #Bad request
        else:
    # Attempting to find the data of the current user in the database
            data = database_helper.find_user(req_email)
            if data is None or data == []:
                return jsonify({}), 404 # No user found by your destination email
            else:
                formated_data = {"email": data[0], "firstname": data[2], "familyname": data[3], "gender": data[4], "city": data[5], "country": data[6]}
                return jsonify({"data" : formated_data}), 200 # Data successfully displayed

# The function extracts messeges of the user with token provided.
# The token is validated and if an email associated with the token exists the data are displayed.
# The displayed data include from email, to_email and the messages in JSON format
# If the token is wrong or the data cannot be retrived the function generates error.

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
    # Getting messaages
            data = database_helper.get_post(email)
            if data != []:
                messages = [{"email": row['email'], "to_email": row['to_email'], "message": row['message'], "geolocation": row['geolocation']} for row in data]
                return jsonify({"data": messages}), 200 # "Data successfully sent to you!"
            else:
                return jsonify({"data" : ""}), 200
        else:
            return jsonify({}), 404 #"No user found with the email provided"


# The function extracts messages data from the database of email provided. The token of the signed in user is validated and checks if user with provided email exists.
# If the user exists data of the user is extracted from the 'messages' database.
# The displayed data include from email, to_email and the messages in JSON format.
# If the token is wrong or if the email does not exists or if the data cannot be retrived the function generates error.


@app.route("/myServer/getMessagesByEmail/<email>", methods = ['GET'])
def get_user_messages_by_email(email):
    """Get user's message wall thought the email of the user"""
    token = request.headers["Authorization"]
    #req_email = request.args.get("email")
    #req_email = request.headers["req_email"]
    req_email = email
    print(req_email)
    print(token)

    # Validate Token
    if token == "":
        return jsonify({}), 400 #Bad request
    else:
        if req_email == "":
            return jsonify({}), 404 #Bad request
    # Validate input email
        else:
            data = database_helper.find_user(req_email)
            if data is None or data == []:
                return jsonify({}), 404 #No user found by your destination email

    # post-information displayed
            else:
                email = data[0]
                data = database_helper.get_post(email)
                if(data is None or data == []):
                    return jsonify({}), 204 #"No msg found on wall of user provided"
                else:
                    #message = {"email": data[0], "to_email": data[1], "message": data[2]}
                    messages = [{"email": row['email'], "to_email": row['to_email'], "message": row['message'], "geolocation": row['geolocation']} for row in data]
                    return jsonify({"data": messages}), 200 # "Data successfully displayed!"


# This function is to post messages. The token is validated checks if an email associated with the user exist or not.
# If user exists, the user can enter 'email' to who's wall the message is posted and 'message'.
# The 'messages' database is updated with from_email, to_email, message and the location of the from_email user.
# If the details are not updated in the database, generated error.
@app.route("/myServer/post", methods=['POST'])
def post_message():
    """Post a message on sombody's wall"""

    # Find out sender's email
    token = request.headers["Authorization"]
    if token == "":
        return jsonify({}),400 #Bad request
    else:
    # Extracting the email of the current user
        email = database_helper.get_email_from_token(token)
        if email is not None:
            email=email[0]
            json_obj = request.get_json()
    # Checking id required fields are filled
            if 'email' not in json_obj or 'message' not in json_obj:
                print("ZEROTH 400")
                return jsonify({}), 400 #Bad request

    # Find out & check email we are posting to
            else:
                to_email = json_obj['email']
                if to_email == "":
                    print("FIRST 400")
                    return jsonify({}), 400 #Bad request
    # Finding out if the user with to_email exist
                else:
                    rows = database_helper.find_user(to_email)
                    print(to_email)
                    print("ROW")
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
                            location = get_location(json_obj['latitude'], json_obj['longitude'])
                            if not database_helper.create_post(to_email,email,message,location):
                                return jsonify({}), 500 #"Server failed to post message to database"
                            else:
                                return jsonify({}), 200 #"Succeeded to post message")
        else:
            print("SECOND 404")
            return jsonify({}), 404 # No email id with given token


#The function get_location takes the arguments lat and long which are passed from the post function.
#Reverse geocoding generates an address from a latitude and longitude
#The main format of the reverse API is: https://nominatim.openstreetmap.org/reverse?lat=<value>&lon=<value>&<params>
#The  url for nominatim is set with the latitude and longittude value recieved from user
#city and country data are taken fro the address array recieved as the response for the requested url
#The function returns city and country value.

def get_location(lat, lon):

    url = f'https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}'
    response = requests.get(url).json()
    city = response.get('address', {}).get('city')
    country = response.get('address', {}).get('country')
    print(city)
    print(country)
    return (city, country)


#The recover_password function is used to recover the account by sending a tempory password to the entered email address.
#Initially we check if the recieved email address exists in the database or not.
#If exists, a random new password is generated. The from email and from password(application password generated from gmail)is set
#to_email is the email entered by users
#The body and subject is defined.
# The EmailMessage class, imported from the email.message module.  EmailMessage provides the core functionality for setting and querying header fields, for accessing message bodies, and for creating or modifying structured messages.
#create_default_context() returns a new context with secure default settings(Secure Sockets Layer)
#SMTP client session object that can be used to send mail to any internet machine with an SMTP
#with smtplib.SMTP('localhost', port) as server:
#server.login('username', 'password')
#server.sendmail(sender, receivers, msg.as_string())
#new password is hashed with bcrypt.generate_password_hash(newpassword) before updating the database.
#database_helper.change_password is called to update with email and new password('UPDATE user SET password = ? WHERE email =  ?', [newpassword, email])
#Status code are returned

@app.route('/recover_password', methods = ['POST'])
def recover_password():
    data = request.get_json()
    email = data['email']
    print(email)
    user = database_helper.find_user(email)
    print(user)
    if(user != None):
        newpassword = str(uuid.uuid4())
        from_email = 'dyou@gmail.com'  #Setting the from email
        from_password = 'gatthhqyvosdfthfgr'          #Application password generated from gmail
        to_email = email
        body = "Hello, \n Recovery of your account was successful. Kindly use this temporary password for login and then change your password. Enjoy your service with Twidder:) New password: " + newpassword +"\n Twidder support team<3"
        subject = "TWIDDER ACCOUNT RECOVERY"

        msg = EmailMessage()
        msg['From'] = from_email
        msg['To'] = email
        msg['Subject'] = subject
        msg.set_content(body)

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=context) as smtp:
            smtp.login(from_email, from_password)
            smtp.sendmail(from_email, to_email, msg.as_string())

        success = database_helper.change_password(email, bcrypt.generate_password_hash(newpassword))
        if(success):
            return "", 200 #Success with changing password
        else:
            return "", 500 #Something wrong in the program
    else:
        return "", 404 #No such user



if __name__ == '__main__':
    app.debug = True
    app.run()
