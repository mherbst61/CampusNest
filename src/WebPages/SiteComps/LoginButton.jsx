import { Siteroutes } from "./ScriptFuntions/Siteroutes";

export default function LoginButton(){
    return(
<div className="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse h-16">
<a href={Siteroutes.LoginSignup} className="block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-blue-700 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700 font-bold">Login / SignUp</a>
</div>
    );
}