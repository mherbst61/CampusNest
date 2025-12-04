import logo from "../../assets/ccsu logo.png";

export default function Navbar() {
    return (
<div className="w-full h-screen flex bg-blue-500">
 <div className=" pl-[11px] pt-[4px] pb-[0.5px]flex items-center w-[23%]"> 
<img src={logo} alt="CCSU logo" className="max-h-[12vh] w-auto object-contain"></img>
</div>

<div className="ml-[4%] w-[20%] p-[4px]">
<h1 className="text-white text-center font-bold mb-2">About:</h1>
<p className="text-white">This project was created for the capstone project for the Computer Science department at CCSU for 2025. The project was created by Matt Herbst and Sai Teja Ponthagani. </p>
</div>

{/*REMEMBER TO CHANGE THE LINK ADDRESS OF PRIVATE POLICY AS IT GOES TO RICK ROLL*/}
<div className="ml-[5%] w-[20%] p-[4px]">
  <h1 className="text-white text-center font-bold mb-2">Private Policy:</h1>
  <p className="text-white">This site reserves the right to display and share any data that is posted by the user. (Temp). For the full list of details <a className="text-white font-bold" href="https://www.youtube.com/watch?v=Aq5WXmQQooo&list=RDAq5WXmQQooo&start_radio=1" target="_blank">Click Here</a></p>
</div>
    </div>
    );
}
