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

  windowDiv.innerHTML = profileDiv.innerHTML;
  connectsocket();

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
    //connectsocket();

    setInfo("home");
    //setInfo("browse");
};

function getToken() {
    return localStorage.getItem("currentUser");
}


//Function for setting user details the user can be browse or home
function setInfo(user) {

    let token = localStorage.getItem("currentUser");
    let error_text = document.getElementById("InfoError");
    let xreq = new XMLHttpRequest();
    if (token != null && token != "" ){
        let userTable = document.getElementById(user + "UserInfo");
        let email = localStorage.getItem(user + "Email");
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
                  console.log("Error 401"); //not logged in
              }
              else if (this.status == 400) {
                  console.log("Error 400"); // FORMAT ERROR
              }
              else if (this.status == 404) {
                  console.log("Error 404"); // user does not exist
              }
              else {
                  console.log("ERROR");
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
          }else if(xreq.status==401){
              errorMess.innerHTML = "400 SIGN IN ERROR CHECK YOUR PASSWORD  ";
              errorMess.style.display = "block";
          } else if(xreq.status==404){
                errorMess.innerHTML = "404 NO USER FOUND  ";
                errorMess.style.display = "block";
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
          if(xreq.status==201){
            errorMess.innerHTML = "Signup Successful";
            errorMess.style.display = "block";
          }
          else if(xreq.status==400){
            errorMess.innerHTML = "400 ";
            errorMess.style.display = "block";
          } else if(xreq.status==409){
            errorMess.innerHTML = "409 USER DOES NOT EXIST ";
            errorMess.style.display = "block";
          } else{
            errorMess.innerHTML = xreq.status;
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
    xreq.open("DELETE", "/myServer/sign_out", true);
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
   //validation
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
           error_text.innerHTML="500 Internal Server Error";
         } else if(xreq.status==400){
           error_text.innerHTML="400 Incorrect password";
         } else if(xreq.status==404){
           error_text.innerHTML="404 Bad Request";
         }
         else{
           error_text.innerHTML="401 Unauthorized";
         }
       }
     };
   }


}

//wall updation part
//user can be in home or browse
function updateWall(user){

    let messageToWall = document.getElementById(user + 'Textarea').value;
    let token = localStorage.getItem("currentUser");
    let email = localStorage.getItem(user + "Email");
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
      document.getElementById(user + 'Textarea').value = ''; //clearing the text area

}

// Reload button for reloading the message wall for both the users
function reloadWall(user) {

    let token = localStorage.getItem("currentUser");
    let email = localStorage.getItem(user + "Email");
    let errorR = document.getElementById("ReloadError");
    let xreq = new XMLHttpRequest();
    if(user == 'home'){
      // opening connection and reloading the message window for the main user, the home user.
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
              id = "dividd"+ i;
              complete += currentWall.data[i][0]+ ":   <div id='"+id+"' draggable='true' ondragstart='drag(event)'>" + currentWall.data[i][2] + "</div></br>";
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


      // connection opened for the case where the user is browse user, the one whose info is set in the browse page. His wall gets reloaded with messages.

let xreq = new XMLHttpRequest();
xreq.open("GET", "/myServer/getMessagesByEmail?email="+email, true);
xreq.setRequestHeader("Content-type", "application/json;charset=UTF-8");
xreq.setRequestHeader("Authorization", token);
xreq.send();

xreq.onreadystatechange=function(){
  if (xreq.readyState==4){
    if(xreq.status==200){
      let currentWall = JSON.parse(xreq.responseText);
      let complete = "";
      for (let i = 0; i < currentWall.data.length; i++) {
        id = "divid"+ i;
        complete += currentWall.data[i][0]+ ":   <div id='"+id+"' draggable='true' ondragstart='drag(event)'>" + currentWall.data[i][2] + "</div></br>";
      }
      document.getElementById(user + 'PostedMessagesDiv').innerHTML = complete;
    } else if(xreq.status==400){
      errorR.innerHTML="400 Bad Request";
    } else if(xreq.status==401){
      errorR.innerHTML="401 Unauthorized";
    } else {
      errorR.innerHTML="404 Not Found";
    }
  }
};


    }



}

// search for other users in the browse tab. Getting data by the email passed. The data recieved is then set as user info in the browse page
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

//changing tab between account, home and browse page.
function tabpage(event, name){

    let tabcontent = document.getElementById("tabDiv");
    for (i = 0; i < tabcontent.children.length; i++) {
        tabcontent.children[i].style.backgroundColor = "lightblue";
    }
    // Select the one we want and color is set for the selected tab
    let div = event.target;
    div.style.backgroundColor = "white";

    let allPages = document.getElementsByClassName("tabcontent");
    for (let i = 0; i < allPages.length; i++) {
        allPages[i].style.display = "none";
    }
    // Select only the one we want and others remain in same bg color
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



function passrecovery(formData){
    let errors = document.getElementById("SignUpError");
    let email = formData.recoveremail.value;
    var xreq = new XMLHttpRequest();
    window.alert(email);
    xreq.open("POST", "/recover_password", true);
    xreq.setRequestHeader("Content-type", "application/json;charset=UTF-8");

    xreq.send(JSON.stringify({'email':email.toLowerCase()}));

    xreq.onreadystatechange =  function(){
        if (xreq.readyState == 4){
            if (xreq.status == 200){
                errors.innerHTML="ACCOUNT RECOVERED! CHECK YOUR EMAIL";

            }
            else if (xreq.status == 404){
                  errors.innerHTML="NO USER REGISTERED WITH THIS EMAIL ID";

            }
            else if (xreq.status == 500){
                errors.innerHTML="SERVER FAILURE";

            }
        }
    }


}

function allowDrop(ev) {
  ev.preventDefault();
}

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
  ev.preventDefault();
  var data = ev.dataTransfer.getData("text");
  ev.target.innerHTML = document.getElementById(data).innerHTML;
}
