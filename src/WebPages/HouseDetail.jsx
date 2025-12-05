// src/WebPages/HouseDetail.jsx
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import HeaderSite from "./SiteComps/HeaderSite";
import NavbarWithSearch from "./SiteComps/NavbarWithSearch";
import BottomBar from "./SiteComps/BottomBar";
import { getListingById } from "../services/listingService";
import { useNavigate } from "react-router-dom";

// Leaflet
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const markerIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function HouseDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        setBusy(true);
        const d = await getListingById(id);
        setItem(d);
      } catch (e) {
        setErr(e.message || "Not found");
      } finally {
        setBusy(false);
      }
    })();
  }, [id]);

  const images =
    (Array.isArray(item?.imageUrls) && item.imageUrls.length
      ? item.imageUrls
      : []) || (item?.image ? [item.image] : []);

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderSite />
      <div className="w-full flex bg-blue-500">
        <NavbarWithSearch />
      </div>

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex-1">
<button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 text-xs text-indigo-600 hover:underline">
          ← Back to House posts
        </button>

        {busy && <div>Loading…</div>}
        {err && <div className="text-red-600">{err}</div>}

        {!busy && !err && item && (
          <>
            {/* Title + address + posted date */}
            <div className="mb-3">
              <h1 className="text-2xl font-semibold">
                {item.title || item.address || "Property"}
              </h1>
              {item.address && (
                <div className="text-gray-600">{item.address}</div>
              )}
              {item.createdAt && (
                <div className="text-xs text-slate-500 mt-1">
                  Posted on {item.createdAt.toLocaleDateString()}
                </div>
              )}
            </div>

            <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Images */}
              <div className="space-y-3">
                {images.length ? (
                  images.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`Image ${i + 1}`}
                      className="w-full rounded-2xl border object-cover"
                    />
                  ))
                ) : (
                  <div className="h-64 rounded-2xl border grid place-items-center text-gray-500 bg-white">
                    No images
                  </div>
                )}
              </div>

              {/* Details + Map */}
              <div className="space-y-4">
                {/* Details + contact */}
                <div className="rounded-2xl border p-4 bg-white">
                  <div className="font-semibold text-lg">
                    {item.price ? `$${item.price}` : "Price not set"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.bedrooms ?? "—"} bd · {item.bathrooms ?? "—"} ba
                  </div>
                  {item.hasParking ? (
                    <div className="text-sm text-gray-600 mt-1">
                      Parking: {item.parking ?? 0}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 mt-1">
                      No private parking
                    </div>
                  )}

                  <div className="mt-3 text-sm whitespace-pre-line">
                    {item.description || "No description."}
                  </div>

                  {Array.isArray(item.amenities) && item.amenities.length > 0 && (
                    <div className="mt-3">
                      <div className="text-sm font-medium mb-1">Amenities</div>
                      <div className="flex flex-wrap gap-2">
                        {item.amenities.map((a) => (
                          <span
                            key={a}
                            className="rounded-full border px-3 py-1 text-xs border-slate-300 bg-white text-slate-700"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact section */}
                  {(item.contactName ||
                    item.contactEmail ||
                    item.contactPhone) && (
                    <div className="mt-4 border-t border-slate-200 pt-3 text-sm space-y-1">
                      <div className="font-medium text-slate-800">
                        Contact information
                      </div>
                      {item.contactName && (
                        <div className="text-slate-700">
                          Name: {item.contactName}
                        </div>
                      )}
                      {item.contactEmail && (
                        <div className="text-slate-700">
                          Email: {item.contactEmail}
                        </div>
                      )}
                      {item.contactPhone && (
                        <div className="text-slate-700">
                          Phone: {item.contactPhone}
                        </div>
                      )}

                      {/* Contact action buttons */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.contactEmail && (
                          <a
                            href={`mailto:${item.contactEmail}`}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                          >
                            Email
                          </a>
                        )}
                        {item.contactPhone && (
                          <a
                            href={`tel:${item.contactPhone}`}
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-950"
                          >
                            Call or text
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Leaflet map (only when lat/lng exist) */}
                <div className="rounded-2xl border bg-white p-4 shadow">
                  {item?.lat != null && item?.lng != null ? (
                    <MapContainer
                      center={[item.lat, item.lng]}
                      zoom={15}
                      scrollWheelZoom={false}
                      style={{ height: 320, width: "100%", borderRadius: 12 }}
                    >
                      <TileLayer
                        attribution="&copy; OpenStreetMap contributors"
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[item.lat, item.lng]} icon={markerIcon}>
                        <Popup>
                          <div className="text-sm">
                            <div className="font-medium">
                              {item.address || "Property"}
                            </div>
                            {item.price ? <div>${item.price}</div> : null}
                          </div>
                        </Popup>
                      </Marker>
                    </MapContainer>
                  ) : (
                    <div className="grid h-80 w-full place-items-center text-sm text-slate-500">
                      Location coordinates not set for this listing.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <BottomBar />
    </div>
  );
}