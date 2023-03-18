var welcomeDiv;
var profileDiv;
var windowDiv;
var minPassLength = 5;


// Checking for the correct view if its current user or not
displayView = function(){
    if (localStorage.getItem("currentUser") == "")
        welcome();
    else
        profile();
};

welcome = function(){
  windowDiv.innerHTML = welcomeDiv.innerHTML;
}
profile = function(){
  connectsocket(); // socket functin called from profile page after sign in
  windowDiv.innerHTML = profileDiv.innerHTML;
  

}
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
    //setInfo("browse");
};

function getToken() {
    return localStorage.getItem("currentUser");
    // returning the token ie current user from local storage
}


//Function for setting user details
function setInfo(user) {

    let token = localStorage.getItem("currentUser");
    let error_text = document.getElementById("InfoError");
    let xreq = new XMLHttpRequest();
    if (token != null && token != "" ){
        let userTable = document.getElementById(user + "UserInfo");
        let email = localStorage.getItem(user + "Email");
        //checks if the user is  homeuser or browseuser and sets the info accordingly
        if(user == 'home'){
          xreq.open("GET", "/myServer/getDataByToken", true);
          xreq.setRequestHeader("Content-type", "application/json;charset=UTF-8");
          xreq.setRequestHeader("Authorization", token);
          xreq.send();

          xreq.onreadystatechange=function(){
            if (xreq.readyState==4){
              if(xreq.status==200){
                let data = JSON.parse(this.responseText);
                let userDataArray = JSON.parse(this.responseText);
                userTable.rows[0].cells[1].innerHTML = userDataArray["data"].email;
                userTable.rows[1].cells[1].innerHTML = userDataArray["data"].firstname;
                userTable.rows[2].cells[1].innerHTML = userDataArray["data"].familyname;
                userTable.rows[3].cells[1].innerHTML = userDataArray["data"].gender;
                userTable.rows[4].cells[1].innerHTML = userDataArray["data"].city;
                userTable.rows[5].cells[1].innerHTML = userDataArray["data"].country;
                localStorage.setItem("homeEmail", userDataArray["data"].email);

              }
              else if (this.status == 401) {
                  console.log("Error 401: You are not logged in");
              }
              else if (this.status == 400) {
                  console.log("Error 400: Incorrect format");
              }
              else if (this.status == 404) {
                  console.log("Error 404: No user with that email exists");
              }
              else {
                  console.log("Unknown error");
              }
      }
    };
        } else if (user == 'browse') {
          xreq.open("GET", "/myServer/getDataByEmail", true);
          xreq.setRequestHeader("Content-type", "application/json;charset=UTF-8");
          xreq.setRequestHeader("Authorization", token);
          xreq.setRequestHeader("req_email", email);
          xreq.send();
          xreq.onreadystatechange=function(){
            if (xreq.readyState==4){
              if(xreq.status==200){
                let data = JSON.parse(xreq.responseText).data;
                let userDataArray = JSON.parse(this.responseText);
                userTable.rows[0].cells[1].innerHTML = userDataArray["data"].email;
                userTable.rows[1].cells[1].innerHTML = userDataArray["data"].firstname;
                userTable.rows[2].cells[1].innerHTML = userDataArray["data"].familyname;
                userTable.rows[3].cells[1].innerHTML = userDataArray["data"].gender;
                userTable.rows[4].cells[1].innerHTML = userDataArray["data"].city;
                userTable.rows[5].cells[1].innerHTML = userDataArray["data"].country;
                localStorage.setItem("browseEmail", userDataArray["data"].email);

              }
              else if (this.status == 401) {
                  console.log("Error 401: You are not logged in");
              }
              else if (this.status == 400) {
                  console.log("Error 400: Incorrect format");
              }
              else if (this.status == 404) {
                  console.log("Error 404: No user with that email exists");
              }
              else {
                  console.log("Unknown error");
              }
      }
    };
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
        data = { 'email': email, 'password': password };
        let xreq = new XMLHttpRequest();
        xreq.open("POST", "/myServer/sign_in", true);
        xreq.setRequestHeader("Content-type", "application/json;charset=UTF-8");
        xreq.send(JSON.stringify(data));
        xreq.onreadystatechange=function(){
          if (xreq.readyState==4){
            if(xreq.status==200){
              token = JSON.parse(xreq.responseText).data;
              localStorage.setItem("currentUser", token);
              localStorage.setItem("homeEmail", email);

              displayView();
              setInfo("home");
              reloadWall("home");
          }
          else{
            errorMess.innerHTML = xreq.status;
            errorMess.style.display = "block";
          }

          }

        };
}
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

    if (user.password.length < minPassLength)
        errorMess.innerHTML = "Password length should be between 5-15";
    else if (user.password != user.repeat_password)
        errorMess.innerHTML = "Password does not match";
    else {
      let xreq = new XMLHttpRequest();
      xreq.open("POST", "/myServer/sign_up", true);
      xreq.setRequestHeader("Content-type", "application/json;charset=UTF-8");
      xreq.send(JSON.stringify(user));
      xreq.onreadystatechange=function(){
        if (xreq.readyState==4){
          if(xreq.status==200){
            errorMess.innerHTML = "Signup Successful";
            errorMess.style.display = "block";
          }
          else if(xreq.status==400){
            errorMess.innerHTML = "400 ";
            errorMess.style.display = "block";
          }

        }


    };

  }
}

// SIGN OUT METHOD DELETE //

function signout(){

    let token = localStorage.getItem("currentUser");
    let errorMess = document.getElementById("UPError")
    let xreq = new XMLHttpRequest();
    xreq.open("POST", "/myServer/sign_out", true);
    xreq.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    xreq.setRequestHeader("Authorization", token);
    xreq.send();
    xreq.onreadystatechange=function(){
      if (xreq.readyState==4 && xreq.status==200){
        localStorage.removeItem("currentUser");
        localStorage.setItem("currentUser", "");
        localStorage.setItem("homeEmail", "");
        localStorage.setItem("browseEmail", "");
        // Changes the view to welcome view
        displayView();
        errorMess.innerHTML= "Successfully Signed Out!";
      }
    };

}



// Changing password
function password_change(event){

   let old_pass = document.getElementById("old_password").value;
   let new_pass = document.getElementById("new_password").value;
   let repeatnew_password_pass = document.getElementById("confirm_pass").value;
   let token = localStorage.getItem("currentUser");
   let error_text = document.getElementById("UPError");
   if (new_pass.length < minPassLength) {
       error_text.innerHTML = "Password too short";
   }
   else if (new_pass != repeatnew_password_pass) {
       error_text.innerHTML = "Password does not match";
   }
   else {
     data = { 'old_password': old_pass, 'new_password': new_pass, 'repeatnew_password': repeatnew_password_pass };
     let xreq = new XMLHttpRequest();
     xreq.open("PUT", "/myServer/change_password", true);
     xreq.setRequestHeader("Content-type", "application/json;charset=UTF-8");
     xreq.setRequestHeader("Authorization", token);
     xreq.send(JSON.stringify(data));
     xreq.onreadystatechange=function(){
       if (xreq.readyState==4){
         if(xreq.status==200){
           error_text.innerHTML="200 Ok";
           document.getElementById('old_password').value = "";
           document.getElementById('new_password').value = "";
           document.getElementById('confirm_pass').value = "";
         }
         else if(xreq.status==500){
           error_text.innerHTML="500 SERVER ERROR";
         }
         else{
           error_text.innerHTML="401 "; //Unauthorize
         }
       }
     };
   }


}

//wall updation

// Submit text button
//user can be in home or browse
function updateWall(user){

    let messageToWall = document.getElementById(user + 'Textarea').value;
    let token = localStorage.getItem("currentUser");
    let email = localStorage.getItem(user + "Email");
    //window.alert(user);
    let errorM = document.getElementById("HomeMError");
    data = { 'email': email, 'message': messageToWall };
    if(messageToWall!=""){
      let xreq = new XMLHttpRequest();
      xreq.open("POST", "/myServer/post", true);
      xreq.setRequestHeader("Content-type", "application/json;charset=UTF-8");
      xreq.setRequestHeader("Authorization", token);
      xreq.send(JSON.stringify(data));
      xreq.onreadystatechange=function(){
      if (xreq.readyState==4){
        if(xreq.status==200){
  	      errorM.innerHTML = "200 Ok";
        }
        else if(xreq.status==500){
  	     errorM.innerHTML = "500 Internal Server Error";
        }
        else if(xreq.status==400){
          console.log("HIIIII");
  	      errorM.innerHTML = "400 Bad Request";
        }
        else{
          errorM.innerHTML = "401 Unauthorized";
        }
      }
    };
  }  else{
      errorM.innerHTML = "Blank message not allowed";
      }
      document.getElementById(user + 'Textarea').value = ''; //clear area

}

// Reload button
function reloadWall(user) {

    let token = localStorage.getItem("currentUser");
    let email = localStorage.getItem(user + "Email");
    let errorR = document.getElementById("ReloadError");
    let xreq = new XMLHttpRequest();
    if(user == 'home'){

      xreq.open("GET", "/myServer/getUserMessageByToken", true);
      xreq.setRequestHeader("Content-type", "application/json;charset=UTF-8");
      xreq.setRequestHeader("Authorization", token);
      xreq.send();
      xreq.onreadystatechange=function(){

        if (xreq.readyState==4){

          if(xreq.status==200){
            let currentWall = JSON.parse(xreq.responseText);
            let complete = "";
            for (let i = 0; i < currentWall.data.length; i++) {
              complete += currentWall.data[i][0]+ ':   ' + currentWall.data[i][2] + "</br>";
            }
            document.getElementById(user + 'PostedMessagesDiv').innerHTML = complete;
          } else if(xreq.status==400){
            errorR.innerHTML="400 Bad Request";
          }
          else if(xreq.status==401){
            errorR.innerHTML="401 Unauthorized";
          }else {
            errorR.innerHTML="404 Not Found";
          }
        }
      };
    } else if (user == 'browse') {
      xreq.open("GET", "/myServer/getMessagesByEmail", true);
      xreq.setRequestHeader("Content-type", "application/json;charset=UTF-8");
      xreq.setRequestHeader("Authorization", token);
      xreq.setRequestHeader("req_email", email);
      xreq.send();
      xreq.onreadystatechange=function(){
        if (xreq.readyState==4){
          if(xreq.status==200){
            let currentWall = JSON.parse(xreq.responseText);
            let complete = "";
            for (let i = 0; i < currentWall.data.length; i++) {
              complete += currentWall.data[i][0]+ ':   ' + currentWall.data[i][2] + "</br>";
            }
            document.getElementById(user + 'PostedMessagesDiv').innerHTML = complete;
          } else if(xreq.status==400){
            errorR.innerHTML="400 Bad Request";
          }
          else if(xreq.status==401){
            errorR.innerHTML="401 Unauthorized";
          }else {
            errorR.innerHTML="404 Not Found";
          }
        }
      };
    }



}


function searchAnotherUser(event){

    let token = localStorage.getItem("currentUser");
    let email = event.target["searchInput"].value;
    let errors = document.getElementById("searchMessage");
    let xreq = new XMLHttpRequest();
    xreq.open("GET", "/myServer/getDataByEmail", true);
    xreq.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    xreq.setRequestHeader("Authorization", token);
    xreq.setRequestHeader("req_email", email);
    xreq.send();
    xreq.onreadystatechange=function(){
      if (xreq.readyState==4){
        if(xreq.status==200){
          let data = JSON.parse(xreq.responseText).data;
          localStorage.setItem("browseEmail", email);
          setInfo("browse");;
          errors.innerHTML="200 OK";
        }
        else if(xreq.status==400){
          errors.innerHTML="400 Bad Request";
        }
        else if(xreq.status==401){
          errors.innerHTML="401 Unauthorized";
        }
        else{
          errors.innerHTML="404 Not Found";
        }
      }
    };
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



// Socket connection
function connectsocket(){
  console.log("START SOCKET CONNECTION 1");
  let connection = new WebSocket('ws://' + location.host + '/connectsocket'); //New connection

  console.log("SET connection");

  token=localStorage.getItem("currentUser");

  console.log("GOT TOKEN ");
  connection.onopen = function() {
    console.log("INSIDE THE FUNCTION");
    connection.send(token); //Sending token to server
  };
  connection.onerror = function(error) {
    console.log('WebSocket Error: ' + error);
  };
  connection.onmessage = function(message) {
    data = message.data
    if(data == 'Signout') { //If signout message received
      console.log("Signing out");
      connection.close(); //Connection closed
      token=null;
      localStorage.removeItem("currentUser"); //Removing token from local storage
      localStorage.setItem("currentUser", "");
      localStorage.setItem("homeEmail", "");
      localStorage.setItem("browseEmail", "");
      displayView(); // Back to welcome page
      document.getElementById("LoginError").innerHTML="Signing Out! Open in multiple windows";
    } else{
      console.log('Message: ' + data);
    }
  };
}
