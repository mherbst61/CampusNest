// src/services/roommateService.js
import { db } from "../lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  limit as qLimit,
} from "firebase/firestore";

const COLL = "roomatePost"; // keep spelling same as Firestore

/* ---------------- helpers ---------------- */

function normalizeRoommate(docSnap) {
  const d = docSnap.data() || {};

  const createdAt =
    d.createdAt && typeof d.createdAt.toDate === "function"
      ? d.createdAt.toDate()
      : d.createdAt ?? null;

  const updatedAt =
    d.updatedAt && typeof d.updatedAt.toDate === "function"
      ? d.updatedAt.toDate()
      : d.updatedAt ?? null;

  return {
    id: docSnap.id,

    // main content
    postTitle: d.postTitle || "",
    name: d.name || "",
    description: d.description || "",

    // contact
    email: d.email || "",
    phone: d.phone || "",
    other1: d.other1 || "",
    other2: d.other2 || "",

    // optional money / location fields if you ever add them
    budget: d.budget ?? null,
    rent: d.rent ?? null,
    location: d.location || "",
    city: d.city || "",

    // image + meta
    image: d.image || "",
    status: d.status || "active",
    createdAt,
    updatedAt,
    budget: d.budget || "",
    city: d.city || "",
    nearCampus: d.nearCampus || false,
    createdBy: d.createdBy || null,
  };
}

/* ---------------- API ---------------- */

export async function getRoommateById(id) {
  const ref = doc(db, COLL, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Roommate post not found");
  return normalizeRoommate(snap);
}

export async function getRecentRoommates(count = 50) {
  const q = query(collection(db, COLL), orderBy("createdAt", "desc"), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(normalizeRoommate);
}

/**
 * (Optional) newest N roommate posts for a carousel or homepage.
 */
export async function getRecentRoommatePosts(n = 10) {
  const q = query(
    collection(db, COLL),
    orderBy("createdAt", "desc"),
    qLimit(n)
  );
  const snap = await getDocs(q);
  return snap.docs.map(normalizeRoommate);
}
