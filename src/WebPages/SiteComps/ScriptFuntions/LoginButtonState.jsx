import { useState, useEffect } from "react";
import UserProfile from "../NavBarComps/UserProfile";
import LoginButton from "../LoginButton";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthProvider.jsx";
import { signOutUser } from "../../../services/authService.js";


{/*Funtion to switch between login button and user Profile*/}
export default function LoginButtonState(){
const { user } = useAuth();
  const [open, setOpen] = useState(false);

  console.log("Current user:",user);

  // Signed out → show "Login"
  if (!user) {
    return <LoginButton />;
  }

// Signed in → "Account ▾" + dropdown
  const label = user.displayName || user.email || "Account";

  return(
    <UserProfile />
  )












  
//{/* This is for testing the state should be set by auth*/}
//const [isLoggedIn, setisLoggedIn] = useState(false);

//{/*This is for reloading the page when loggin to get user dropdown menu to work*/}
//const reloadCount = sessionStorage.getItem('reloadCount');

//if(isLoggedIn){
  //{/*This forces a reboot when the isLoggedIn state is change aka the boolean value is changed Needed to make dropdown menu work This came from stack overflow btw*/}
  //useEffect(() => {
    //if(reloadCount < 2) {
      //sessionStorage.setItem('reloadCount', String(reloadCount + 1));
      //window.location.reload();
    //} else {
      //sessionStorage.removeItem('reloadCount');
   // }
  //}, []);

  //{/*This changes to the user dropdown menu for when user is login*/}
  //return(
   // <UserProfile />
  //)
//} else {
  //return(
   // <LoginButton />
  //)
//}

}