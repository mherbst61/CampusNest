import { Siteroutes } from "../ScriptFuntions/Siteroutes";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthProvider";
import { signOutUser } from "../../../services/authService";
import { Dropdown } from 'flowbite';

export default function UserProfile(){
const { user } = useAuth();
  const [open, setOpen] = useState(false);

  {/* this allows the flowbite stuff to work with react*/}
useEffect(() => {
  const dropdownElement = document.getElementById('user-dropdown'); //Grabs the element for the userdropdown for flowbite
  const buttonElement = document.getElementById('user-menu-button'); //grabs the element for the user menu button from flowbite
  if (dropdownElement && buttonElement) { //checks if the elements exist
    new Dropdown(dropdownElement, buttonElement); //attaches the elements 
  }
}, []); // [] makes it run once.

const UserEmail = user.email || "No Email";
const UserName =  user.displayName || "No UserName"; //this will probally be need to be changed to pull a user name from the database when the set it on their profile
const UserProfileImg = user.photoURL || "src\assets\question-mark.png";

    return(
      <div>
      <button type="button" className="flex text-sm bg-gray-600 rounded-full md:me-0 focus:ring-4 focus:ring-blue-300 dark:focus:ring-white-800" id="user-menu-button" aria-expanded="false" data-dropdown-toggle="user-dropdown" data-dropdown-placement="bottom">
        <span className="sr-only">Open user menu</span>
        <img className="w-16 h-16 rounded-full" src={UserProfileImg} alt= {UserName + "User Photo"} />
      </button>


     {/*<!-- Dropdown menu -->*/}

    <div className="z-50 hidden my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow-sm dark:bg-gray-700 dark:divide-gray-600" id="user-dropdown">
    <div className="px-4 py-3">
      <span className="block text-sm text-gray-900 dark:text-white">{UserName}</span>
      <span className="block text-sm  text-gray-500 truncate dark:text-gray-400">{UserEmail}</span>
    </div>



    <ul className="py-2" aria-labelledby="user-menu-button">
      <li>
        <Link to={Siteroutes.DashBoard} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Dashboard</Link>
      </li>
      <li>
        <Link to={Siteroutes.Profile} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Profile</Link>
      </li>
  <li>
       {/*THIS IS THE SIGN OUT BUTTON*/} <a type="Button" onClick={async () => { await signOutUser(); setOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Sign out</a>
      </li>
    </ul>
  </div>
  </div>
    );
}