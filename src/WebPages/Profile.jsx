import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import HeaderSite from "./SiteComps/HeaderSite";
import Navbar from "./SiteComps/navBar";
import BottomBar from "./SiteComps/BottomBar";

import { useAuth } from "../context/AuthProvider.jsx";
import { auth, db, storage } from "../lib/firebase";
import {
  onAuthStateChanged,
  updateProfile as updateAuthProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const EMPTY = {
  displayName: "",
  email: "",
  phone: "",
  other1: "",
  other2: "",
  description: "",
  photoURL: "",
};

export default function Profile() {
  const navigate = useNavigate();
  const { user: ctxUser } = useAuth();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [initial, setInitial] = useState(EMPTY);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState({ kind: "", msg: "" });
  const fileInputRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/Login");
        return;
      }
      setUser(u);
      const data = await ensureAndLoad(u);
      setForm(data);
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

  function setField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function onSave() {
    if (!user) return;
    setBusy(true);
    setFlash({ kind: "", msg: "" });
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        ...form,
        email: user.email,
        updatedAt: serverTimestamp(),
      });
      await updateAuthProfile(user, {
        displayName: form.displayName || null,
        photoURL: form.photoURL || null,
      });
      setInitial(form);
      setEditing(false);
      setFlash({ kind: "ok", msg: "Profile saved." });
    } catch (e) {
      setFlash({ kind: "err", msg: e?.message || "Failed to save profile." });
    } finally {
      setBusy(false);
    }
  }

  function onCancel() {
    setForm(initial);
    setEditing(false);
    setFlash({ kind: "", msg: "" });
  }

  async function onChooseAvatar(file) {
    if (!file || !user) return;
    setBusy(true);
    setFlash({ kind: "", msg: "" });
    try {
      const r = ref(storage, `users/${user.uid}/avatar.jpg`);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      setField("photoURL", url); // preview
      setFlash({ kind: "ok", msg: "Image uploaded (remember to Save)." });
    } catch (e) {
      setFlash({ kind: "err", msg: e?.message || "Upload failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="parent min-h-screen flex flex-col">
      {/* Header (same as Home) */}
      <HeaderSite />

      {/* Navbar (same as Home) */}
      <div className="w-full flex">
        <Navbar />
      </div>

      {/* Page content */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex-1">
        {/* Title + actions */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Profile</h1>
          <div className="flex gap-3">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 rounded-xl border hover:bg-gray-50"
              >
                Edit
              </button>
            ) : (
              <>
                <button
                  onClick={onCancel}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onSave}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Save"}
                </button>
              </>
            )}
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

        {/* TOP ROW: Avatar (left) + Name+Contact (right) */}
        <section className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <img
                src={
                  form.photoURL ||
                  "https://ui-avatars.com/api/?name=U&background=E5E7EB&color=111827&size=240"
                }
                alt="Profile avatar"
                className="h-44 w-44 rounded-full object-cover border shadow-sm"
              />
              {editing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/40 text-white text-sm font-medium opacity-0 hover:opacity-100 transition-opacity"
                  title="Change photo"
                >
                  <span className="absolute inset-0 flex items-center justify-center">
                    Change
                  </span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onChooseAvatar(e.target.files?.[0])}
              />
            </div>
          </div>

          {/* Name + Contact */}
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium">Name</label>
              <input
                type="text"
                className="w-full rounded-xl border p-3 outline-none focus:ring-2 focus:ring-black/10"
                placeholder="Your full name"
                value={form.displayName}
                onChange={(e) => setField("displayName", e.target.value)}
                readOnly={!editing}
              />
            </div>

            <div className="rounded-2xl border p-4 shadow-sm">
              <h2 className="text-sm font-semibold mb-4">Contact Info</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-16 text-sm text-gray-500">Phone</span>
                  <input
                    type="tel"
                    className="flex-1 rounded-xl border p-2 outline-none focus:ring-2 focus:ring-black/10"
                    placeholder="+1 555-555-5555"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    readOnly={!editing}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-16 text-sm text-gray-500">Other</span>
                  <input
                    type="text"
                    className="flex-1 rounded-xl border p-2 outline-none focus:ring-2 focus:ring-black/10"
                    placeholder="Alt contact / handle"
                    value={form.other1}
                    onChange={(e) => setField("other1", e.target.value)}
                    readOnly={!editing}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-16 text-sm text-gray-500">Email</span>
                  <input
                    type="email"
                    className="flex-1 rounded-xl border p-2 bg-gray-50 text-gray-700"
                    value={form.email}
                    readOnly
                    title="Email comes from your login account"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-16 text-sm text-gray-500">Other</span>
                  <input
                    type="text"
                    className="flex-1 rounded-xl border p-2 outline-none focus:ring-2 focus:ring-black/10"
                    placeholder="Alt contact"
                    value={form.other2}
                    onChange={(e) => setField("other2", e.target.value)}
                    readOnly={!editing}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* DESCRIPTION – full width under both columns */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>
            <textarea
              className="w-full rounded-xl border p-3 min-h-56 outline-none focus:ring-2 focus:ring-black/10"
              placeholder="Tell people a bit about yourself…"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              readOnly={!editing}
            />
          </div>
        </section>
      </main>

      {/* Footer */}
      <BottomBar />
    </div>
  );
}
