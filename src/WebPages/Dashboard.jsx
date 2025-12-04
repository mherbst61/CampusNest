import { Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Navbar from "./SiteComps/navBar"
import BottomBar from "./SiteComps/BottomBar"
import HeaderSite from "./SiteComps/HeaderSite";
import { Siteroutes } from "./SiteComps/ScriptFuntions/Siteroutes";
import { useAuth } from "../context/AuthProvider.jsx";
import { auth, db, storage } from "../lib/firebase";
import React, { useState, useEffect } from "react";
import { getFirestore, collection, query, where, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore";
import 'flowbite';
import { Carousel } from 'flowbite';
import { ref,deleteObject, listAll} from "firebase/storage";
import  {onAuthStateChanged} from "firebase/auth"


  // Firestore collection
const HouseCOLLECTION = "listings";
const roomateCOLLECTION ="roomatePost";

export default function Dashboard() {
const navigate = useNavigate();
const { user } = useAuth();
const [userHouseDocuments, setuserHouseDocuments] = useState([]);
const [houseCards, setHouseCards] = useState([]);
const [userDocuments, setuserDocuments] = useState([]);
const [RoomateCards, setRoomateCards] = useState([]);
const [refreshRoomate, setRefreshRoomate] = useState(false); //For refreshing the roomate div
const [refreshHouse, setRefreshHouse] = useState(false); //For refreshing the house listing div

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/");
        return;
      }
    });
    return () => unsub();
  }, [navigate]);


//House Post listing stuff
useEffect(() =>{
async function FetchUserHouseListing() {
  if (!user) return; // Wait for auth

  try{
   const listingRef = collection(db, HouseCOLLECTION);
   const q = query(listingRef,where("createdBy", "==", user.uid))

   const queryIdSnap = await getDocs(q);

   const ids = []; // beacuse react element array shit so have to push ids to this array and set this array to the react element array
   queryIdSnap.forEach((doc) => {
    ids.push(doc.id);
   });
   setuserHouseDocuments(ids);
   //console.log("User’s listing IDs:", userHouseDocuments);
      } catch (err) {
        console.error("Error fetching user listings:", err);
      }
    }

    FetchUserHouseListing();
},[user, refreshHouse]);

useEffect(() =>{
  //return if no user docs
  if (!userHouseDocuments || userHouseDocuments.length === 0) return;
async function GetListings() {
//console.log("User’s listing IDs Listing getter query:", userHouseDocuments);
const card = [];
  for(let i = 0; i < userHouseDocuments.length; i++){
    try{
   const listingDocRef = doc(db, HouseCOLLECTION,userHouseDocuments[i]);
   const listingSnap = await getDoc(listingDocRef);
     if (listingSnap.exists()) {
        //console.log("Document data:", listingSnap.data());
        const data = listingSnap.data();

         // Defensive checks
         //console.log("Raw img field:", data.imageUrls);
          const img = Array.isArray(data.imageUrls) ? data.imageUrls : [];
          const amenities = Array.isArray(data.amenities) ? data.amenities : [];
          const availableFrom = data.availableFrom?.toDate?.()?.toISOString().split('T')[0] || "N/A";

                      //Push card object
           card.push(
            <div className="mt-3" key={userHouseDocuments[i]}>
              {createHouseCard(
                userHouseDocuments[i],
                img,
                data.address || "No address",
                availableFrom,
                data.bathrooms || 0,
                data.bedrooms || 0,
                data.description || "",
                data.deposit || 0,
                data.hasParking || false,
                data.parking || 0,
                data.price || 0,
                amenities,
                data.contactName,
                data.contactEmail,
                data.contactPhone,
                data.lat,
                data.lng,
                data.createdAt
              )}
            </div>
          );
      }else{
        console.log("No document found for ID:", userHouseDocuments[i]);
      }
    } catch (err){
      console.error("Error fetching document:", err);
    }
  }
  //console.log("Card objects in array to pass to HouseCards",card);

  setHouseCards(card);
  
  
    const timeout = setTimeout(() => {
    try {
      initCarousels(); // initialize all carousels in the DOM
    } catch (err) {
      console.error("Flowbite init error:", err);
    }
  }, 100); // slight delay to ensure DOM is painted

  return () => clearTimeout(timeout);
}
GetListings();
},[userHouseDocuments, refreshHouse]);



//Roomate Listing post objects
useEffect(() =>{
async function FetchUserListing() {
  if (!user) return; // Wait for auth

  try{
   const roomateRef = collection(db, roomateCOLLECTION);
   const q = query(roomateRef,where("createdBy", "==", user.uid))

   const queryIdSnap = await getDocs(q);

   const ids = []; // beacuse react element array shit so have to push ids to this array and set this array to the react element array
   queryIdSnap.forEach((doc) => {
    ids.push(doc.id);
   });
   setuserDocuments(ids);
   console.log("User’s Roomate IDs:", userDocuments);
      } catch (err) {
        console.error("Error fetching user Roomate:", err);
      }
    }

    FetchUserListing();
},[user, refreshRoomate]);

useEffect(() =>{
  //return if no user docs
  if (!userDocuments || userDocuments.length === 0) return;
async function GetRoomatePost() {
console.log("User’s Roomate IDs Roomate getter query:", userDocuments);
const card = [];
  for(let i = 0; i < userDocuments.length; i++){
    try{
   const roomateDocRef = doc(db, roomateCOLLECTION,userDocuments[i]);
   const roomateSnap = await getDoc(roomateDocRef);
     if (roomateSnap.exists()) {
        console.log("Document data:", roomateSnap.data());
        const data = roomateSnap.data();

         // Defensive checks
         console.log("Raw img field:", data.imageUrls);
          //const img = Array.isArray(data.imageUrls) ? data.imageUrls : [];
          //const amenities = Array.isArray(data.amenities) ? data.amenities : [];
          //const availableFrom = data.availableFrom?.toDate?.()?.toISOString().split('T')[0] || "N/A";

                      //Push card object
           card.push(
            <div className="mt-3" key={userDocuments[i]}>
              {createRoomateCard(
                userDocuments[i],
                data.image || "#",
                data.postTitle || "No Post Title",
                data.description || "No description",
                data.name || "No name",
                data.email || "No Email",
                data.phone || "No Phone Number",
                data.other1 || "No other Contact",
                data.other2 || "No other Contact",
                data.createdAt,
                data.budget,
                data.city,
                data.nearCampus
              )}

            </div>
          );
      }else{
        console.log("No document found for ID Roomate:", userDocuments[i]);
      }
    } catch (err){
      console.error("Error fetching document:", err);
    }
  }
  console.log("Card objects in array to pass to RoomateCards",card);

  setRoomateCards(card);
}
GetRoomatePost();
},[userDocuments, refreshRoomate]);


// Card objects
function createRoomateCard (docID,img,postTitle,description,name,email,phone,other1,other2,createdAt,budget,city,nearCampus){
  const ThisCardId =docID;

const editPost = () => {
navigate(Siteroutes.RoomatePost, { state: {
    docID: docID,
    img: img,
    postTitle: postTitle,
    description: description,
    name: name,
    email: email,
    phone: phone,
    other1: other1,
    other2: other2,
    createdAt: createdAt,
    budget: budget,
    city: city,
    nearCampus: nearCampus,
} });
};


  return(
<div className="w-full bg-white border border-gray-200 rounded-lg shadow-lg">
<div className="relative w-full">
<div className="relative h-56 overflow-hidden rounded-lg md:h-64">
  <img className="h-full w-full  object-cover border shadow-sm" src={img} alt="User Roomate Post image" />
  </div> 
  </div>
 <div className="p-5">
        <p className="mb-3 font-bold text-gray-700">{postTitle}</p>
        <p className="mb-3 font-bold text-gray-700">Description:</p>
        <p className="mb-3 font-normal text-gray-700">{description}</p>
        <p className="mb-3 font-normal text-gray-700">Name: {name}</p>
        <p className="mb-3 font-bold text-gray-700">Contact Infomation:</p>
        <p className="mb-3 font-normal text-gray-700">Email: {email}</p>
        <p className="mb-3 font-normal text-gray-700">Phone: {phone}</p>
        <p className="mb-3 font-normal text-gray-700">Other: {other1}</p>
        <p className="mb-3 font-bold text-gray-700">Other: {other2}</p>

        <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 mr-2" onClick={() => editPost()}>
            Edit 
        </button>
         <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" onClick={() => deleteItem(ThisCardId,roomateCOLLECTION)}>
            Delete
        </button>
    </div>
</div>
  )
};


//This will be used to create the card element
function createHouseCard(docID,img,address,availableFrom,bathroom,bedroom,descript,deposit,hasPark,parking,price,amedities,contactName,contactEmail,contactPhone,lat,lng,createdAt){
  /*
//Console check for passing data
  console.log("createHouseCard called with:");
  console.log("docID:", docID);
  console.log("img:", img);
  console.log("address:", address);
  console.log("availableFrom:", availableFrom);
  console.log("bathroom:", bathroom);
  console.log("bedroom:", bedroom);
  console.log("descript:", descript);
  console.log("deposit:", deposit);
  console.log("hasPark:", hasPark);
  console.log("parking:", parking);
  console.log("price:", price);
  console.log("amedities:", amedities);
*/
console.log("CreatedAt", createdAt);

  let parkingText;
  const ThisCardId =docID;

  if(hasPark){
    parkingText = parking + " spots available";
  }else{
    parkingText = "None"
  }

  
const editPost = () => {
navigate(Siteroutes.HousePost, { state: {
    docID: docID,
    img: img,
   address: address,
   availableFrom: availableFrom,
   bathroom: bathroom,
   bedroom: bedroom,
   descript: descript,
   deposit: deposit,
   hasPark: hasPark,
   parking: parking,
   price: price,
   amedities: amedities,
   contactName: contactName,
   contactEmail: contactEmail,
   contactPhone: contactPhone,
   lat: lat,
   lng: lng,
   createdAt: createdAt,
} });
};


  return(
    
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-lg">
        <div id={`carousel-${docID}`} className="relative w-full" data-carousel="slide">
    {/* Carousel wrapper */}
    <div className="relative h-56 overflow-hidden rounded-lg md:h-64">
      {img.map((link,index) => (
         
        <div key={index} className="duration-700 ease-in-out" data-carousel-item>
            <img src={link} className="absolute block w-full object-cover -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" alt="..." />
        </div>
      ))}
      
    </div>
    {/* Slider controls */}
    <button type="button" className="absolute top-0 start-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-carousel-prev>
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
            <svg className="w-4 h-4 text-white dark:text-gray-800 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 1 1 5l4 4"/>
            </svg>
            <span className="sr-only">Previous</span>
        </span>
    </button>
    <button type="button" className="absolute top-0 end-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none" data-carousel-next>
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 dark:bg-gray-800/30 group-hover:bg-white/50 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
            <svg className="w-4 h-4 text-white dark:text-gray-800 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
            </svg>
            <span className="sr-only">Next</span>
        </span>
    </button>
</div>
    
    <div className="p-5">
        <p className="mb-3 font-bold text-gray-700">{address}</p>
        <p className="mb-3 font-normal text-gray-700">Bedrooms: {bedroom}</p>
        <p className="mb-3 font-normal text-gray-700">Bathrooms: {bathroom}</p>
        <p className="mb-3 font-normal text-gray-700">Deposit: ${deposit}</p>
        <p className="mb-3 font-normal text-gray-700">Price: ${price}</p>
        <p className="mb-3 font-normal text-gray-700">available From: {availableFrom}</p>
        <p className="mb-3 font-normal text-gray-700">Parking: {parkingText}</p>
        <p className="mb-3 font-bold text-gray-700">Description:</p>
        <p className="mb-3 font-normal text-gray-700">{descript}</p>
        <p className="mb-3 font-bold text-gray-700">Amedities: </p>

        {/*Amedities*/}
        <div className="w-full grid grid-cols-2 gap-4 mb-4">
        {amedities.map((text,index) => (
          <div key={index} className="flex flex-col items-center rounded shadow-lg border border-2 border-grey-200 bg-grey-200">
              <p>{text}</p>
            </div>
          
        ))}
        </div>


        <button href="#" className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 mr-2" onClick={() => editPost()}>
            Edit 
        </button>
         <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" onClick={() => deleteItem(ThisCardId,HouseCOLLECTION)}>
            Delete
        </button>
    </div>
</div>
  ) 
};


//Card Funtions
async function deleteItem(docID,collection){
console.log("Delete Clicked Doc Id to delete: ",docID, "Part of Collection: ",collection);
try{
if(collection === "listings"){
  const listingDelete = ref(storage, `listings/${user.uid}/${docID}`);
  await deleteFolderAndFiles(listingDelete);
    console.log("listing Delete Success")
    await deleteCall(docID,collection);
setHouseCards ([]);
setRefreshHouse(prev => !prev);
}
if(collection === "roomatePost"){
const RoomateDelete = ref(storage, `roomatePost/${user.uid}/${docID}`);
console.log("Roomate Doc Id",docID)
  await deleteFolderAndFiles(RoomateDelete);
  console.log("Roomate Delete Success");
    await deleteCall(docID,collection);
setRoomateCards([]);
setRefreshRoomate(prev => !prev);
}
}catch{
  console.error("Unable to delete docID:",docID," In collection: ",collection);
  return;
}
}
//Part of delete item to delete the post itself.
async function deleteCall(docID,collection) {
  await deleteDoc(doc(db,collection,docID));
}

//Delete folder and files inside
async function deleteFolderAndFiles(storageRef) {
try{
const folderList = await listAll(storageRef); //Makes list of all files

const allDelete = folderList.items.map((fileref) => deleteObject(fileref)); //goes threw and calls delete object on all files
await Promise.all(allDelete); //Deletes all files at once. aka multible calls  instead of one at a time. 
}catch(err){
console.log("Cannot Delete or error has occured");
throw err;
}
}
  return (
 <div className="parent">

      {/*Header image */}
 <HeaderSite />

{/*Nav bar*/}
  <div className="w-full flex">
<Navbar />

    </div>

<div className="w-full">

  {/*Top buttons*/}
  <div className="flex flex-row">
<div className="basis-60 mt-2 ml-2">
<button type="button" class="h-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"onClick={() => navigate(Siteroutes.HousePost)}>Create new listing post</button>
</div>
<div className="basis-60 mt-2">
<button type="button" class="h-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800" onClick={() => navigate(Siteroutes.RoomatePost)}>Create new roomate post</button>
</div>
<div className="flex-1">

</div>
</div>

{/*Dashboard displays*/}

<div className="flex flex-row border border-2 border-grey-200 mt-2">
<div className="flex-1 flex flex-col justify-start space-y-6 px-4 pb-6 border border-2 border-grey-200">
  <p className="">House listing posts:</p>
  <hr></hr>
<div id="houseListings">
   {/*Funtion will be called here  {testCard} */}
  {houseCards}
</div>
</div>
<div className="flex-1 flex flex-col justify-start space-y-6 px-4 pb-6 border border-2 border-grey-200">
  <p className="">Find roomate posts:</p>
  <hr></hr>
  <div id="roomatePost">
{RoomateCards}
  </div>
</div>
</div>

</div>

    {/*Private policy and about section*/}
    <BottomBar />
    
        
        </div>
      );
    }