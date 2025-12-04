// src/services/listingService.js
import { db } from "../lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";

const COLL = "listings";

/* ---------------- helpers ---------------- */

function toNumber(v) {
  if (v == null) return null;
  if (typeof v === "number" && isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return isFinite(n) ? n : null;
  }
  return null;
}

/** Normalize one Firestore doc to a map-ready shape. */
function normalizeListing(docSnap) {
  const d = docSnap.data() || {};

  // lat/lng can come as top-level numbers/strings or a GeoPoint in d.location
  const lat =
    toNumber(d.lat) ??
    (d.location && typeof d.location.latitude === "number"
      ? d.location.latitude
      : null);
  const lng =
    toNumber(d.lng) ??
    (d.location && typeof d.location.longitude === "number"
      ? d.location.longitude
      : null);

  // convert Firestore Timestamp to Date if present
  const createdAt =
    d.createdAt && typeof d.createdAt.toDate === "function"
      ? d.createdAt.toDate()
      : d.createdAt ?? null;

  return {
    id: docSnap.id,
    ...d,
    lat,
    lng,
    createdAt,
    // make sure these are always arrays so filtering is safe
    imageUrls: Array.isArray(d.imageUrls) ? d.imageUrls : [],
    amenities: Array.isArray(d.amenities) ? d.amenities : [],
  };
}

/* ---------------- API ---------------- */

/** Get 1 listing by Firestore doc id (normalized). */
export async function getListingById(id) {
  const ref = doc(db, COLL, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Listing not found");
  return normalizeListing(snap);
}

/** Get recent listings (ordered by createdAt desc, normalized). */
export async function getRecentListings(count = 24) {
  const q = query(collection(db, COLL), orderBy("createdAt", "desc"), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(normalizeListing);
}
