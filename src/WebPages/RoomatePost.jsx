import { useNavigate } from "react-router-dom";
import React, { useEffect, useRef, useState } from "react";
import Navbar from "./SiteComps/navBar";
import BottomBar from "./SiteComps/BottomBar";
import HeaderSite from "./SiteComps/HeaderSite";
import { Siteroutes } from "./SiteComps/ScriptFuntions/Siteroutes.js";
import { useLocation } from "react-router-dom";
import { Timestamp } from "firebase/firestore";

import { useAuth } from "../context/AuthProvider.jsx";
import { auth, db, storage } from "../lib/firebase";

import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ----- defaults -----
const EMPTY = {
  displayName: "",
  email: "",
  phone: "",
  other1: "",
  other2: "",
  description: "",
  photoURL: "",
};

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?name=U&background=E5E7EB&color=111827&size=240";

export default function RoomatePost() {
  const navigate = useNavigate();
  const { user: _ctxUser } = useAuth(); // kept in case you use later

  const [user, setUser] = useState(null);
  const [initial, setInitial] = useState(EMPTY);
  const [Docid, setDocIdValue] = useState("");

  // Firestore collection
  const COLLECTION = "roomatePost";

  // ----- form state -----
  const [nameValue, setnameValue] = useState("");
  const [emailValue, setemailValue] = useState("");
  const [phoneValue, setphoneValue] = useState("");
  const [other1Value, setother1Value] = useState("");
  const [other2Value, setother2Value] = useState("");
  const [descripValue, setdescriptValue] = useState("");
  const [imgSrcValue, setimgSrcValue] = useState(DEFAULT_AVATAR);
  const [postTitleValue, setpostTitleValue] = useState("");
  const [perferNearCampus, setperferNearCampus]=useState({
    nearCampusCheck: false
  });
  const [perferedCity, setperferedCity] = useState("");
  const [maxBudget, setMaxBudget] = useState("")

  // ui state
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState({ kind: "", msg: "" });

  // refs
  const fileInputRef = useRef(null);
  const postDocRef = useRef(null); // persistent doc id holder

  //Editing mode
  const location = useLocation();
  const postData = location.state;
  const [pageTitle, setPageTitle] = useState("");
  const [createdAtEdit, setcreatedAtEdit] = useState("")
useEffect(() => {
  if (postData) {
    console.log("Edit data") ;
    setnameValue(postData.name || "");
    setemailValue(postData.email || "");
    setimgSrcValue(postData.img || DEFAULT_AVATAR);
    setphoneValue(postData.phone || "");
    setother1Value(postData.other1 || "");
    setother2Value(postData.other2 || "");
    setdescriptValue(postData.description || "");
    setpostTitleValue(postData.postTitle || "");
    setperferedCity(postData.city || "");
    setMaxBudget(postData.budget || "");
    setperferNearCampus({nearCampusCheck:postData.nearCampus || false});
    console.log("Title import",postData.title);
    setDocIdValue(postData.docID || "");
    //for createdAt time stamp
        if (postData.createdAt && postData.createdAt.seconds) {
      const ts = new Timestamp(
        postData.createdAt.seconds,
        postData.createdAt.nanoseconds
      );
      setcreatedAtEdit(ts.toDate());
    }
    setPageTitle("Edit Roommate Post")
  }else{
  setPageTitle("Create Roommate Post")
    }
}, [postData]);

  // ----- auth + preload -----
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/");
        return;
      }
      setUser(u);
      setemailValue(u.email || "");
      const data = await ensureAndLoad(u);
      setInitial(data);
    });
    return () => unsub();
  }, [navigate]);

  async function ensureAndLoad(u) {
    const userRef = doc(db, "users", u.uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const seed = {
        ...EMPTY,
        displayName: u.displayName || "",
        email: u.email || "",
        photoURL: u.photoURL || "",
        role: "student",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, seed, { merge: true });
      return { ...EMPTY, ...seed };
    }
    const d = snap.data() || {};
    return {
      displayName: d.displayName || u.displayName || "",
      email: u.email || d.email || "",
      phone: d.phone || "",
      other1: d.other1 || "",
      other2: d.other2 || "",
      description: d.description || "",
      photoURL: d.photoURL || u.photoURL || "",
    };
  }

  // ----- populate checkbox handler -----
  const UseProfileSetting = (e) => {
    if (e.target.checked) {
      setnameValue(initial.displayName || "");
      setemailValue(initial.email || emailValue);
      setphoneValue(initial.phone || "");
      setother1Value(initial.other1 || "");
      setother2Value(initial.other2 || "");
      setdescriptValue(initial.description || "");
      setimgSrcValue(initial.photoURL || DEFAULT_AVATAR);
    } else {
      setnameValue("");
      setphoneValue("");
      setother1Value("");
      setother2Value("");
      setdescriptValue("");
      setimgSrcValue(DEFAULT_AVATAR);
      // keep email as account email
    }
  };

  const NearCampus = (e) => {
       const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    setperferNearCampus(values => ({...values, [name]: value}))
    if (e.target.checked) {
      setperferedCity("New Britain")
    }else{
      setperferedCity("")
    }
  }


  // ----- validation helpers (trimmed!) -----
  const hasAnyContact = Boolean(
    phoneValue.trim() || emailValue.trim() || other1Value.trim() || other2Value.trim()
  );
  const canPublish = Boolean(
    nameValue.trim() && hasAnyContact && descripValue.trim() && postTitleValue.trim()
  );

  // ----- image upload -----
  async function onImgChoose(file) {
    if (!file || !user) return;
    setBusy(true);
    setFlash({ kind: "", msg: "" });

    try {
      let id;

      //Conditions for if editing a post where use passed doc id for the id varable overwriting the photo in that location
      if(postData){
        id = Docid; // create an id locally
      }else if(postDocRef.current){
         id = postDocRef.current.id;
      }else{ 
         // ensure we have a doc id to place the image under canonical Storage path
        postDocRef.current = doc(collection(db, COLLECTION)); // create an id locally
        id = postDocRef.current.id;
      }
  
  
      // Storage rules path: listings/{uid}/{listingId}/{fileName}
      const r = ref(storage, `roomatePost/${user.uid}/${id}/Post.jpg`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      setimgSrcValue(url);
      setFlash({ kind: "ok", msg: "Image uploaded (will be saved with the post)." });
    } catch (e) {
      setFlash({ kind: "err", msg: e?.message || "Upload failed." });
    } finally {
      setBusy(false);
    }
  }

  // ----- publish -----
  const publish = async () => {
    if (!canPublish) {
      alert(
        "You are missing some required values:\n• Name\n• At least one contact field\n• Description\n• Post Title"
      );
      return;
    }
    const u = auth.currentUser;
    if (!u) return alert("Please sign in.");

    try {
     let refToUse;
     let base;
      setBusy(true);
      
      //This is for if the user wants to edit or create a new doc based off of if postData comes. 
      if(postData && Docid){
        refToUse = doc(db, COLLECTION, Docid);
         base = {
        postTitle: postTitleValue.trim(),
        name: nameValue.trim(),
        email: emailValue.trim(),
        phone: phoneValue.trim(),
        other1: other1Value.trim(),
        other2: other2Value.trim(),
        description: descripValue.trim(),
        image: imgSrcValue || DEFAULT_AVATAR,
        createdAt: createdAtEdit,
        updatedAt: serverTimestamp(),
           budget: maxBudget.trim(),
        city: perferedCity.trim(),
        nearCampus: perferNearCampus,
        createdBy: u.uid,
        status: "active",
      };
      }else if(postDocRef.current){
        refToUse = postDocRef.current
                base = {
        postTitle: postTitleValue.trim(),
        name: nameValue.trim(),
        email: emailValue.trim(),
        phone: phoneValue.trim(),
        other1: other1Value.trim(),
        other2: other2Value.trim(),
        description: descripValue.trim(),
        image: imgSrcValue || DEFAULT_AVATAR,
        createdAt: serverTimestamp(),
        updatedAt: "",
        budget: maxBudget.trim(),
        city: perferedCity.trim(),
        nearCampus: perferNearCampus,
        createdBy: u.uid,
        status: "active",
                }
      }else{
      refToUse = doc(collection(db, COLLECTION));
        base = {
        postTitle: postTitleValue.trim(),
        name: nameValue.trim(),
        email: emailValue.trim(),
        phone: phoneValue.trim(),
        other1: other1Value.trim(),
        other2: other2Value.trim(),
        description: descripValue.trim(),
        image: imgSrcValue || DEFAULT_AVATAR,
        createdAt: serverTimestamp(),
        updatedAt: "",
        budget: maxBudget.trim(),
        city: perferedCity.trim(),
        nearCampus: perferNearCampus,
        createdBy: u.uid,
        status: "active",
      };
      }
      
      postDocRef.current = refToUse; // persist

      await setDoc(refToUse, base);
      alert(`Post published! ID: ${refToUse.id}`);

      // reset (keep account email)
      setnameValue("");
      setphoneValue("");
      setother1Value("");
      setother2Value("");
      setdescriptValue("");
      setpostTitleValue("");
      setimgSrcValue(DEFAULT_AVATAR);
      postDocRef.current = null;

      // navigate after post if you want:
     navigate(Siteroutes.DashBoard); //or a dashboard route
    } catch (e) {
      console.error(e);
      alert(`Publish failed: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  // ----- UI -----
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header + Nav (unchanged) */}
      <HeaderSite />
      <div className="w-full flex">
        <Navbar />
      </div>

      {/* Content */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex-1">
        <div className="mb-6 flex items-center justify-between">
          {/* NEW title + optional subtitle */}
          <div>
            <h1 className="text-2xl font-semibold">{pageTitle}</h1>
            <p className="text-sm text-gray-500">
              Share your details to find the right match
            </p>
          </div>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                onChange={UseProfileSetting}
                aria-label="Use profile information to populate the form"
              />
              <span>Use Profile info to Populate</span>
            </label>

            <button
              onClick={publish}
              disabled={!canPublish || busy}
              className={`px-4 py-2 rounded-xl text-white ${
                !canPublish || busy
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-black hover:opacity-90"
              }`}
              aria-disabled={!canPublish || busy}
              aria-label="Post roommate listing"
            >
              {busy ? "Posting…" : "Post"}
            </button>
          </div>
        </div>

        {flash.msg ? (
          <div
            className={`mb-4 rounded-xl px-4 py-2 text-sm ${
              flash.kind === "err"
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {flash.msg}
          </div>
        ) : null}

        {/* Grid: image + form */}
        <section className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
          {/* Image */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={imgSrcValue || DEFAULT_AVATAR}
                alt="Post image"
                className="h-44 w-44 rounded-full object-cover border shadow-sm"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 text-white text-sm font-medium opacity-0 hover:opacity-100 transition-opacity"
                title="Upload image"
              >
                <span className="absolute inset-0 flex items-center justify-center">
                  Upload
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onImgChoose(e.target.files?.[0])}
              />
            </div>
          </div>

          {/* Right column form */}
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-medium">Name</label>
              <input
                className="w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-black/10"
                inputMode="text"
                value={nameValue}
                onChange={(e) => setnameValue(e.target.value)}
                placeholder="Your name"
              />
            </div>

            {/* Contact card */}
            <div className="rounded-2xl border p-4 shadow-sm">
              <h2 className="text-sm font-semibold mb-4">Contact Info</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-16 text-sm text-gray-500">Phone</span>
                  <input
                    className="flex-1 rounded-xl border p-2"
                    inputMode="numeric"
                    value={phoneValue}
                    onChange={(e) => setphoneValue(e.target.value)}
                    placeholder="+1 555-555-5555"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-16 text-sm text-gray-500">Other</span>
                  <input
                    className="flex-1 rounded-xl border p-2"
                    value={other1Value}
                    onChange={(e) => setother1Value(e.target.value)}
                    placeholder="Alt contact / handle"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-16 text-sm text-gray-500">Email</span>
                  <input
                    className="flex-1 rounded-xl border p-2 bg-gray-50 text-gray-700"
                    inputMode="email"
                    value={emailValue}
                    onChange={(e) => setemailValue(e.target.value)}
                    placeholder="you@school.edu"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-16 text-sm text-gray-500">Other</span>
                  <input
                    className="flex-1 rounded-xl border p-2"
                    value={other2Value}
                    onChange={(e) => setother2Value(e.target.value)}
                    placeholder="Alt contact"
                  />
                </div>
              </div>
            </div>

            {/* Post Title */}
            <div>
              <label className="mb-2 block text-sm font-medium">Post Title</label>
              <input
                className="w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-black/10"
                inputMode="text"
                value={postTitleValue}
                onChange={(e) => setpostTitleValue(e.target.value)}
                placeholder="e.g., 1 roommate needed near campus"
              />
            </div>
          </div>

          <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">Preferences</label>
              <div className="flex items-center gap-4">
                 <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name = "nearCampusCheck"
                checked = {perferNearCampus.nearCampusCheck}
                onChange={NearCampus}
                aria-label="Perfer near campus housing"
              />
              <span>Perfer near campus housing</span>
            </label>
              <span className="w-16 text-sm text-gray-500">Perfered city</span>
                  <input
                    className="flex-1 rounded-xl border p-2"
                    value={perferedCity}
                    onChange={(e) => setperferedCity(e.target.value)}
                    placeholder="Perfered city"
                  />
                  
                  <label className="block text-xs font-medium text-slate-600 mb-1">
              Max budget (per month)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                $
              </span>
              <input
                type="number"
                min="0"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="No limit"
                className="w-32 rounded-lg border border-slate-300 bg-white pl-7 pr-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

                </div>  
            </div>




          {/* Description: full width under both columns */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">Description</label>
            <textarea
              className="w-full rounded-xl border p-3 min-h-56 outline-none focus:ring-2 focus:ring-black/10"
              inputMode="text"
              value={descripValue}
              onChange={(e) => setdescriptValue(e.target.value)}
              placeholder="Tell people about location, rent, move-in timing, quiet hours, chores, etc."
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <BottomBar />
    </div>
  );
}
