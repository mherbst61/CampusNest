import { useState } from "react";
import HomePageNav from "./NavBarComps/SiteNavButtons";
import LoginButtonState from "./ScriptFuntions/LoginButtonState";
import 'flowbite'; // REQUIRED for menu toggle to work
import { useEffect } from "react";
import { initFlowbite } from "flowbite";


export default function Navbar() {
  {/*This sets the variable state for logged in to change button*/}
const [isLoggedIn, setIsLoggedIn] = useState(false);

//Fix for dropdown in small screen or mobile view
useEffect(()=>{
  try{
    initFlowbite();
  } catch (err){
    console.log("Flowbite initalize error"+err);
  }
},[]);



  return (
 <nav className="w-full bg-white border-gray-200 dark:bg-blue-500">

  <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-1">
  <a href="#" className="flex items-center space-x-3 rtl:space-x-reverse">
      <img src="/CampusNest/real-estate-home-svgrepo-com.svg" className="h-8" alt="CampusNest Temp Logo" />
      <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">CampusNest</span>
  </a>
  
  {/*Login button state and dropdown when shrunk for nav menu*/}
  <div className="flex items-center md:order-2 space-x-3 md:space-x-0 relative justify-between md:justify-end w-full md:w-auto sm:mt-5 sm:mb-3 mt-0 mb-0">
      <LoginButtonState />
       <button data-collapse-toggle="navbar-user" type="button" className="inline-flex items-center p-2 w-10 h-10 justify- text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-user" aria-expanded="false">
        <span className="sr-only">Open main menu</span>
        <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 1h15M1 7h15M1 13h15"/>
        </svg>
    </button>
</div>
<HomePageNav />

  
  </div>
</nav>

  );
}