var welcomeDiv;
var profileDiv;
var windowDiv;
var minPassLength = 5;


// Checking for the correct view if its current user or not
displayView = function(){
    if (localStorage.getItem("currentUser") == "")
        windowDiv.innerHTML = welcomeDiv.innerHTML;
    else
        windowDiv.innerHTML = profileDiv.innerHTML;
};


// on loading
window.onload = function () {


    if (localStorage.getItem("currentUser") == null)
        localStorage.setItem("currentUser", "");
    if (localStorage.getItem("homeEmail") == null)
        localStorage.setItem("homeEmail", "");
    if (localStorage.getItem("browseEmail") == null)
        localStorage.setItem("browseEmail", "");


    welcomeDiv = document.getElementById("welcomeview");
    profileDiv = document.getElementById("profileview");
    windowDiv = document.getElementById("WindowDiv");


    displayView();


    setInfo("home");
    setInfo("browse");
};

//Function for setting user details
function setInfo(user) {
    // "user" could be either home or browse, this way know which info we are displaying and where
    let token = localStorage.getItem("currentUser");
    if (token != null && token != "" ){
        let userTable = document.getElementById(user + "UserInfo");
        let email = localStorage.getItem(user + "Email");
        let userDataArray = serverstub.getUserDataByEmail(token, email);

        // the user data  from server to the html table
        if (userDataArray["success"]) {
            userTable.rows[0].cells[1].innerHTML = userDataArray["data"].email;
            userTable.rows[1].cells[1].innerHTML = userDataArray["data"].firstname;
            userTable.rows[2].cells[1].innerHTML = userDataArray["data"].familyname;
            userTable.rows[3].cells[1].innerHTML = userDataArray["data"].gender;
            userTable.rows[4].cells[1].innerHTML = userDataArray["data"].city;
            userTable.rows[5].cells[1].innerHTML = userDataArray["data"].country;
        }
    }
}


// SIGN IN //

function signin() {
    let form = document.getElementById("signin_form");
    let email = form[0].value;
    let password = form[1].value;
    let errorMess = document.getElementById("LoginError");


    if (password.length < minPassLength){
        errorMess.innerHTML = "Password len Error";
    } else {

        // Signin req to serverstub
        let signInObj = serverstub.signIn(email, password);

        // Set message to user
        errorMess.innerHTML = signInObj["message"];
        if (signInObj["success"]) {

            let token = signInObj["data"];
            localStorage.setItem("currentUser", token);
            localStorage.setItem("homeEmail", email);
            displayView();
            setInfo("home");
            reloadWall("home");
            //setting the view
        }
    }
    return false;
}

// SIGN UP //
function sign_up() {
    let form = document.getElementById("signup_form");
    let errorMess = document.getElementById("SignUpError");
    let user = {
        firstname: form[0].value,
        familyname: form[1].value,
        gender: form[2].value,
        city: form[3].value,
        country: form[4].value,
        email: form[5].value,
        password: form[6].value,
        repeat_password: form[7].value
    };

    //checking for the the password length(password validation)
    if (user.password.length < minPassLength)
        errorMess.innerHTML = "Password length should be between 5-15";
    else if (user.password != user.repeat_password)
        errorMess.innerHTML = "Password does not match";
    else {
        //call to serverstub
        let signUpObj = serverstub.signUp(user);
        // Set message to user
        errorMess.innerHTML = signUpObj["message"];
    }
    return false;
}

// SIGN OUT //

function signout(){
    let token = localStorage.getItem("currentUser");
    let logOutObj = serverstub.signOut(token);

    if (logOutObj["success"]) {

        // Reset the localStorage
        localStorage.setItem("currentUser", "");
        localStorage.setItem("homeEmail", "");
        localStorage.setItem("browseEmail", "");

        // Changes the view to welcome view
        displayView();
    }
}



// Changing password
function password_change(event){
    let old_pass = document.getElementById("old_password").value;
    let new_pass = document.getElementById("new_password").value;
    let confirm_pass = document.getElementById("confirm_pass").value;
    let token = localStorage.getItem("currentUser");
    let error_text = document.getElementById("match_error");

    //checks if password lies within the allowed range or not
    if (new_pass.length < minPassLength) {
        error_text.innerHTML = "Password too short";
    }
    else if (new_pass != confirm_pass) {
        error_text.innerHTML = "Password does not match";
    }
    else {
        // Success
        let message = serverstub.changePassword(token, old_pass, new_pass);

        // Set error text
        error_text.innerHTML = message["message"];
    }

   error_text.style.display = "block";
}



//wall updation

// Submit text button
//user can be in home or browse
function updateWall(user){

    let messageToWall = document.getElementById(user + 'Textarea').value;
    let token = localStorage.getItem("currentUser");
    let email = localStorage.getItem(user + "Email");
    let errorM = document.getElementById("PostError");
    //checks if the message is blank
    if(messageToWall!=""){
        serverstub.postMessage(token, messageToWall, email);
    }else{
      errorM.innerHTML = "Blank message not allowed";
    }
    document.getElementById(user + 'Textarea').value = "";
    return false;
}

// Reload button
function reloadWall(user) {

    let token = localStorage.getItem("currentUser");
    let email = localStorage.getItem(user + "Email");
    let currentWall = serverstub.getUserMessagesByEmail(token, email);

    //gets all the message to the the wall for the email
    let complete = "";
    for (let i = 0; i < currentWall.data.length; i++) {
        complete += currentWall.data[i].writer + ':   ' + currentWall.data[i].content + "</br>";
    }
    document.getElementById(user + 'PostedMessagesDiv').innerHTML = complete;
    return false;
}

//search for the user who email was given as input
function searchAnotherUser(event){
    let token = localStorage.getItem("currentUser");
    let email = event.target["searchInput"].value;
    let error = document.getElementById("searchMessage");
    let user_obj = serverstub.getUserMessagesByEmail(token, email);

    error.innerHTML = user_obj["message"];
    if(token != "" && user_obj['success']){
        localStorage.setItem("browseEmail", email);
        setInfo("browse");
    }
    return false;
}

//changing tab
function tabpage(event, name){

    let tabcontent = document.getElementById("tabDiv");
    for (i = 0; i < tabcontent.children.length; i++) {
        tabcontent.children[i].style.backgroundColor = "lightblue";
    }
    // Select the one we want
    let div = event.target;
    div.style.backgroundColor = "white";

    let allPages = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < allPages.length; i++) {
        allPages[i].style.display = "none";
    }
    // Select only the one we want
    let selected_tab = document.getElementById(name);
    selected_tab.style.display = "block";
}
