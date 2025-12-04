import React, { useRef, useState, useEffect } from "react";
import Navbar from "./SiteComps/navBar";
import BottomBar from "./SiteComps/BottomBar";
import HeaderSite from "./SiteComps/HeaderSite";
import { auth, db, storage } from "../lib/firebase.js";
import { addDoc, collection, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject } from "firebase/storage";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { Siteroutes } from "./SiteComps/ScriptFuntions/Siteroutes.js";
import { Timestamp } from "firebase/firestore";
import  {onAuthStateChanged} from "firebase/auth"

// ----- constants -----
const COLLECTION = "listings";
const MAX_MB = 10, MAX_BYTES = MAX_MB * 1024 * 1024;
const BED_OPTS = ["0","1","2","3","4","5","6+"];
const BATH_OPTS = ["1","1.5","2","2.5","3","3.5","4+"];
const PARK_OPTS = ["0","1","2","3","4","5+"];
const AMENITIES = ["In-unit Laundry","On-site Laundry","Air Conditioning","Heating","Furnished","Gym","Pool","Wheelchair Accessible","Pet Friendly","High speed Internet", "Outdoor space","Elevator","Utilities included"];

// ----- tiny helpers -----
const dedupe = files => {
  const m = new Map();
  files.forEach(f => m.set(`${f.name}-${f.size}-${f.lastModified}`, f));
  return [...m.values()];
};

async function compress(file, { side=1600, q=0.8 } = {}) {
  if (file.size < 350 * 1024) return file;                 // small already
  const fr = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = fr; });
  const s = Math.min(1, side / Math.max(img.width, img.height));
  const c = Object.assign(document.createElement("canvas"), { width: Math.round(img.width * s), height: Math.round(img.height * s) });
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise(r => c.toBlob(r, "image/jpeg", q));
  return blob ? new File([blob], file.name.replace(/\.(png|webp|heic|heif)$/i, ".jpg"), { type: "image/jpeg" }) : file;
}

async function uploadAll(uid, listingId, files, onProgress) {
  if (!files.length) return [];
  const tooBig = files.filter(f => f.size > MAX_BYTES * 2);
  if (tooBig.length) throw new Error(`Large files: ${tooBig.map(f=>f.name).join(", ")}`);
  const compressed = await Promise.all(files.map(f => compress(f)));
  const total = compressed.reduce((n,f)=>n+f.size,0), bytes = Array(compressed.length).fill(0);

  const jobs = compressed.map((file, i) => new Promise((res, rej) => {
    const clean = (file.name || `image_${i}.jpg`).replace(/\s+/g,"_");
    const task = uploadBytesResumable(ref(storage, `listings/${uid}/${listingId}/${i}_${clean}`), file, {
      contentType: file.type || "image/jpeg", cacheControl: "public, max-age=31536000, immutable",
    });
    task.on("state_changed",
      s => { bytes[i] = s.bytesTransferred; onProgress?.(Math.max(1, Math.round((bytes.reduce((a,b)=>a+b,0)/total)*100))); },
      rej,
      async () => res(await getDownloadURL(task.snapshot.ref))
    );
  }));
  const urls = await Promise.all(jobs);
  onProgress?.(100);
  return urls;
}

// ----- component -----
export default function PostLease() {
  const [address,setAddress] = useState(""), [description,setDescription] = useState("");
  const [bedrooms,setBedrooms] = useState(""), [bathrooms,setBathrooms] = useState("");
  const [hasParking,setHasParking] = useState(false), [parking,setParking] = useState("0");
  const [price,setPrice] = useState(""), [deposit,setDeposit] = useState(""), [availableFrom,setAvailableFrom] = useState("");
  const [amenities,setAmenities] = useState([]), [images,setImages] = useState([]);
  const [busy,setBusy] = useState(false), [pct,setPct] = useState(0), [phase,setPhase] = useState("");
  const canPublish = address.trim().length>5 && bedrooms && bathrooms && !!price && !busy;
  const fileRef = useRef(null);
  const pick = () => fileRef.current?.click();
  const onFiles = e => { const picked = Array.from(e.target.files||[]); if (picked.length) setImages(p=>dedupe([...p,...picked])); e.target.value=""; };
  const toggleAmenity = a => setAmenities(p => p.includes(a) ? p.filter(x=>x!==a) : [...p,a]);
  const navigate = useNavigate();

   // contact info
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // optional map coordinates
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

    //----Editing mode----
  const location = useLocation();
  const postData = location.state;
  const [pageTitle, setPageTitle] = useState(""); //Changes the title in the page
  const [editDocId, setEditDocId] = useState("");
  const [editImgUrls, setEditImgUrls] = useState ([])
  const [editButtons, setEditButtons] = useState([]);
  const [imgDeleteTrigger, setImgDeleteTrigger]= useState(false);
  const [createdAtEdit, setcreatedAtEdit] = useState("")
useEffect(() => {
  if (postData) {
    let editButton= [];
    console.log("Edit data") ;
    setPageTitle("Edit a propery listing")
    setPrice(postData.price);
    setDeposit(postData.deposit);
    setAddress(postData.address);
    setDescription(postData.descript);
    setBedrooms(postData.bedroom);
    setBathrooms(postData.bathroom)
    setHasParking(postData.hasPark);
    setParking(postData.parking);
    setAmenities(postData.amedities);
    setAvailableFrom(postData.availableFrom);
    setEditImgUrls(postData.img); // for grabbing the original img links. 
    setEditDocId(postData.docID);
    setContactName(postData.contactName);
    setContactEmail(postData.contactEmail);
    setContactPhone(postData.contactPhone);
    setLat(postData.lat);
    setLng(postData.lng);
    //for createdAt time stamp
    if (postData.createdAt && postData.createdAt.seconds) {
  const ts = new Timestamp(
    postData.createdAt.seconds,
    postData.createdAt.nanoseconds
  );
  setcreatedAtEdit(ts.toDate());
}
    editButton.push(<div>{removeAllButton()}</div>);
    setEditButtons(editButton);
    console.log(`EditDocID from postData: ${postData.docID}`);
  }else{
console.log("Temp") ;
      setPageTitle("List a property")
    }
}, [postData]);

//Checks if the user is logged in
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/Login");
        return;
      }
    });
    return () => unsub();
  }, [navigate]);


//Adds a button that will remove all the previous images so new set of photos can be added instead of adding to existing. 
function removeAllButton()  {
  return(
    <button onClick={() => deleteFolderAndFiles()} type="button" className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400">Remove all previous Images</button>
  )
}

async function deleteFolderAndFiles() {
const user = auth.currentUser;
if (!user) throw new Error("User not logged in");
if (!postData.docID) return alert("No listing selected");
console.log("EditDociD check",postData.docID);
try{
const storageLoc = ref(storage, `listings/${user.uid}/${postData.docID}`);
const folderList = await listAll(storageLoc); //Makes list of all files

const allDelete = folderList.items.map((fileref) => deleteObject(fileref)); //goes threw and calls delete object on all files
await Promise.all(allDelete); //Deletes all files at once. aka multible calls  instead of one at a time. 
setEditImgUrls([]);
alert(`All previous images removed`);
setImgDeleteTrigger(true);
}catch(err){
console.log("Cannot Delete or error has occured");
alert(`Cannot delete all previous images removed, ${err}`);
throw err;
}
}


//---Publish logic ---
  const publish = async () => {
    if (!canPublish) return;
    const user = auth.currentUser; if (!user) return alert("Please sign in.");
    try {
      let docRef;
      setBusy(true); setPct(0); setPhase("Creating listing…");

      if(postData && !imgDeleteTrigger){ //Edit mode adding more photos to the post 
        docRef = doc(db, COLLECTION, editDocId);
        updateDoc(docRef, {
          address: address.trim(),
        description: description.trim(),
        bedrooms,
        bathrooms,
        hasParking,
        parking: hasParking ? (isNaN(+parking) ? parking : +parking) : 0,
        price: +price || null,
        deposit: deposit ? +deposit : null,
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        amenities,
        // map location (optional)
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        // contact info
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        createdAt: createdAtEdit,
        UpdataedAt: serverTimestamp(),
        createdBy: user.uid,
        status: "active",
        })

         let urls = [];
         let newUrls = [];
      if (images.length) {
        setPhase(`Uploading ${images.length} image${images.length>1?"s":""}…`);
         newUrls = await uploadAll(user.uid, docRef.id, images, p => setPct(p)); //gets new added images. 
         urls = [...editImgUrls, ...newUrls]; //mergest existing imgages and new added ones together
        await updateDoc(doc(db, COLLECTION, docRef.id), { imageUrls: urls });
      }


      }else if(postData && imgDeleteTrigger){ //Edit mode removing old photos and adding new ones 
        docRef = doc(db, COLLECTION, editDocId);
        updateDoc(docRef, {
           address: address.trim(),
        description: description.trim(),
        bedrooms,
        bathrooms,
        hasParking,
        parking: hasParking ? (isNaN(+parking) ? parking : +parking) : 0,
        price: +price || null,
        deposit: deposit ? +deposit : null,
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        amenities,
        // map location (optional)
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        // contact info
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        createdAt: createdAtEdit,
        UpdataedAt: serverTimestamp(),
        createdBy: user.uid,
        status: "active",
        })

         let urls = [];
      if (images.length) {
        setPhase(`Uploading ${images.length} image${images.length>1?"s":""}…`);
         urls = await uploadAll(user.uid, docRef.id, images, p => setPct(p)); //gets new added images. 
        await updateDoc(doc(db, COLLECTION, docRef.id), { imageUrls: urls });
      }

      }else{ //Create mode create a new post 
          const base = {
         address: address.trim(),
        description: description.trim(),
        bedrooms,
        bathrooms,
        hasParking,
        parking: hasParking ? (isNaN(+parking) ? parking : +parking) : 0,
        price: +price || null,
        deposit: deposit ? +deposit : null,
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        amenities,
        imageUrls: [],
        // map location (optional)
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        // contact info
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        status: "active",
      };
        docRef = await addDoc(collection(db, COLLECTION), base);

            let urls = [];
      if (images.length) {
        setPhase(`Uploading ${images.length} image${images.length>1?"s":""}…`);
        urls = await uploadAll(user.uid, docRef.id, images, p => setPct(p));
        await updateDoc(doc(db, COLLECTION, docRef.id), { imageUrls: urls });
      }
      }

      alert(`Listing published! ID: ${docRef.id}`);
      // reset
      setAddress(""); setDescription(""); setBedrooms(""); setBathrooms("");
      setHasParking(false); setParking("0"); setPrice(""); setDeposit(""); setAvailableFrom("");
      setAmenities([]); setImages([]); setPct(0); setPhase("");

      //Navigates back to dashboard after posting. 
      navigate(Siteroutes.DashBoard);
    } catch (e) {
      console.error(e); alert(`Publish failed: ${e.message||e}`);
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <HeaderSite />
      <div className="w-full bg-blue-500"><Navbar /></div>

      <div className="mx-auto w-full max-w-screen-2xl grow px-6 py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2"> {/*Added a page title that changes base off of edit mode or not*/}
          <h1 className="text-2xl font-semibold">{pageTitle}</h1>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* LEFT */}
          <section className="flex min-h-[560px] flex-col rounded-2xl bg-white p-6 shadow">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Images</label>
              <div className="flex items-center gap-3">
                {editButtons}
                <button onClick={pick} type="button" className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400">Upload</button>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} className="hidden" />
                <span className="text-sm text-slate-500">{images.length? `${images.length} image${images.length>1?"s":""} selected` : "You can select multiple images"}</span>
              </div>
              {images.length>0 &&
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {images.slice(0,12).map((f,i)=>(
                    <div key={`${f.name}-${i}`} className="aspect-video overflow-hidden rounded-md border">
                      <img src={URL.createObjectURL(f)} alt={f.name} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              }
              {busy && (phase || pct>0) && (
                <div className="mt-4">
                  <div className="mb-1 text-xs text-slate-600">{phase}</div>
                  <div className="h-2 w-full overflow-hidden rounded bg-slate-100">
                    <div className="h-2 bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="mb-1 block text-sm font-medium text-slate-700">Rent (per month)</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input id="price" inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value.replace(/[^\d.]/g,""))} placeholder="e.g., 1200" className="w-full rounded-lg border border-slate-300 bg-white pl-7 pr-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"/>
                </div>
              </div>
              <div>
                <label htmlFor="deposit" className="mb-1 block text-sm font-medium text-slate-700">Deposit (optional)</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input id="deposit" inputMode="decimal" value={deposit} onChange={e=>setDeposit(e.target.value.replace(/[^\d.]/g,""))} placeholder="e.g., 500" className="w-full rounded-lg border border-slate-300 bg-white pl-7 pr-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"/>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-1 block text-sm font-medium text-slate-700">Bedrooms</label>
              <select value={bedrooms} onChange={e=>setBedrooms(e.target.value)} className="w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200">
                <option value="" disabled>Select bedrooms</option>
                {BED_OPTS.map(v=> <option key={v} value={v}>{v==="0"?"Studio (0)":v}</option>)}
              </select>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">Bathrooms</label>
              <select value={bathrooms} onChange={e=>setBathrooms(e.target.value)} className="w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200">
                <option value="" disabled>Select bathrooms</option>
                {BATH_OPTS.map(v=> <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-3">
                <input id="park" type="checkbox" checked={hasParking} onChange={e=>setHasParking(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"/>
                <label htmlFor="park" className="text-sm font-medium text-slate-700">Private Parking Available</label>
              </div>
              <div className="mt-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Parking spaces</label>
                <select disabled={!hasParking} value={parking} onChange={e=>setParking(e.target.value)} className={`w-40 rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 ${hasParking?"border-slate-300 focus:border-indigo-500 focus:ring-indigo-200 bg-white":"border-slate-200 bg-slate-100 text-slate-400"}`}>
                  {PARK_OPTS.map(v=> <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">Available from</label>
              <input type="date" value={availableFrom} onChange={e=>setAvailableFrom(e.target.value)} className="w-56 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"/>
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map(a => (
                  <button key={a} type="button" onClick={()=>toggleAmenity(a)}
                    className={`rounded-full border px-3 py-1 text-xs ${amenities.includes(a)?"border-indigo-600 bg-indigo-50 text-indigo-700":"border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-6">
              <button disabled={!canPublish} onClick={publish}
                className={`rounded-lg px-5 py-2.5 text-sm font-medium shadow ${canPublish && !busy ? "bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400":"bg-slate-200 text-slate-500"}`}>
                {busy ? "Publishing…" : "Publish"}
              </button>
            </div>
          </section>

          {/* RIGHT */}
          <section className="rounded-2xl bg-white p-6 shadow">
            <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
            <textarea value={address} onChange={e=>setAddress(e.target.value)} placeholder="Ex; 65 fakestreet, Townsville, NA, 12345" className="mb-5 h-24 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"/>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Enter Post Description" className="h-72 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm leading-6 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"/>
        
     {/* Optional coordinates for map pins */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Latitude (optional)
                </label>
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="41.6612"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Longitude (optional)
                </label>
                <input
                  type="text"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="-72.7795"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>

            {/* Contact info */}
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <div className="text-sm font-medium text-slate-700 mb-1">
                Contact information
              </div>
              <p className="text-xs text-slate-500 mb-3">
                This will be shown on the listing so students know how to reach
                you.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Name
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Leasing agent or owner"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+1 860-555-1234"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <BottomBar />
    </div>
  );
}