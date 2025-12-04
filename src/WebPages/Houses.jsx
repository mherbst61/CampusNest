// src/WebPages/Houses.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavbarWithSearch from "./SiteComps/NavbarWithSearch";
import BottomBar from "./SiteComps/BottomBar";
import HeaderSite from "./SiteComps/HeaderSite";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { getRecentListings } from "../services/listingService";
import '../lib/leafletFix';  // <-- correct import

const AMENITIES = [
  "In-unit Laundry",
  "On-site Laundry",
  "Air Conditioning",
  "Heating",
  "Furnished",
  "Gym",
  "Pool",
  "Wheelchair Accessible",
  "Pet Friendly",
  "High speed Internet", 
  "Outdoor space",
  "Elevator",
  "Utilities included"
];

// Read ?q= from URL and normalize
function useSearchTerm() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  return (params.get("q") || "").trim().toLowerCase();
}

// Fit the map to all pin positions
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = points.map((p) => [p.lat, p.lng]);
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [points, map]);
  return null;
}

export default function Houses() {
  const navigate = useNavigate();
  const searchTerm = useSearchTerm();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [minBeds, setMinBeds] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [onlyParking, setOnlyParking] = useState(false);
  const [amenityFilter, setAmenityFilter] = useState([]); // <- multiple amenities

  // Load latest listings
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getRecentListings(100);
        setListings(data);
      } catch (e) {
        console.error("Failed to load listings:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // toggle a single amenity pill
  const toggleAmenity = (a) => {
    setAmenityFilter((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  };

  // Filtering: text search, beds, price, parking, amenities
  const filteredListings = useMemo(() => {
    let arr = [...listings];

    // text search (also matches amenities text)
    if (searchTerm) {
      arr = arr.filter((l) => {
        const address = (l.address || "").toLowerCase();
        const desc = (l.description || "").toLowerCase();
        const city = (l.city || "").toLowerCase();
        const amenitiesText = Array.isArray(l.amenities)
          ? l.amenities.join(" ").toLowerCase()
          : "";
        return (
          address.includes(searchTerm) ||
          desc.includes(searchTerm) ||
          city.includes(searchTerm) ||
          amenitiesText.includes(searchTerm)
        );
      });
    }

    if (minBeds) {
      const min = Number(minBeds);
      if (Number.isFinite(min)) {
        arr = arr.filter((l) => {
          const b = Number(l.bedrooms);
          return !Number.isFinite(b) ? true : b >= min;
        });
      }
    }

    if (maxPrice) {
      const cap = Number(maxPrice);
      if (Number.isFinite(cap)) {
        arr = arr.filter((l) => {
          const price = Number(l.price);
          return !Number.isFinite(price) ? true : price <= cap;
        });
      }
    }

    if (onlyParking) {
      arr = arr.filter((l) => l.hasParking);
    }

    // amenities: keep listing if it has ANY selected amenity
    if (amenityFilter.length) {
      arr = arr.filter((l) => {
        if (!Array.isArray(l.amenities) || !l.amenities.length) return false;
        return amenityFilter.every((a) => l.amenities.includes(a));
      });
    }

    return arr;
  }, [listings, searchTerm, minBeds, maxPrice, onlyParking, amenityFilter]);

  const points = useMemo(
    () =>
      filteredListings.filter(
        (l) => Number.isFinite(l.lat) && Number.isFinite(l.lng)
      ),
    [filteredListings]
  );

  const fallbackCenter = { lat: 41.677, lng: -72.79 }; // CCSU-ish

  const goToDetail = (id) => {
    navigate(`/Houses/${id}`);
  };

  const formatBedsBaths = (l) => {
    const b = l.bedrooms ?? "—";
    const ba = l.bathrooms ?? "—";
    return `${b} bd · ${ba} ba`;
  };

  const cardImageFor = (l) => {
    if (Array.isArray(l.imageUrls) && l.imageUrls.length > 0) {
      return l.imageUrls[0];
    }
    if (l.coverImage) return l.coverImage;
    return "/real-estate-home-svgrepo-com.svg";
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <HeaderSite />
      <div className="w-full flex bg-blue-500">
        <NavbarWithSearch />
      </div>

      <main className="mx-auto w-full max-w-screen-2xl px-6 py-6 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Browse Properties</h2>
          {searchTerm && (
            <span className="text-xs text-slate-500">
              Showing results for{" "}
              <span className="font-medium">“{searchTerm}”</span>
            </span>
          )}
        </div>

        {/* Filter row – same layout as your screenshot */}
        <section className="mb-4 flex flex-wrap gap-4 items-end">
          {/* Min beds */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Min bedrooms
            </label>
            <select
              value={minBeds}
              onChange={(e) => setMinBeds(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">Any</option>
              <option value="0">Studio / 0</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>

          {/* Max price */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Max rent (per month)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                $
              </span>
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="No limit"
                className="w-32 rounded-lg border border-slate-300 bg-white pl-7 pr-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          {/* Parking checkbox */}
          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={onlyParking}
              onChange={(e) => setOnlyParking(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Only show listings with parking
          </label>
        </section>

        {/* Amenity pill row (select one or more) */}
        <section className="mb-4">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Amenity (select one or more)
          </label>
          <div className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => {
              const active = amenityFilter.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`rounded-full border px-3 py-1 text-xs ${
                    active
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </section>

        {/* MAP */}
        <section className="rounded-2xl border bg-white p-3 shadow mb-6">
          <div className="h-80 w-full rounded-xl overflow-hidden">
            <MapContainer
              center={[fallbackCenter.lat, fallbackCenter.lng]}
              zoom={12}
              scrollWheelZoom
              className="h-full w-full z-0"
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {points.length > 0 && <FitBounds points={points} />}

              {points.map((p) => (
                <Marker
                  key={p.id}
                  position={[p.lat, p.lng]}
                  eventHandlers={{
                    click: () => goToDetail(p.id),
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="font-medium mb-1">
                        {p.address || "Property"}
                      </div>
                      {p.price ? <div>${p.price}</div> : null}
                      <button
                        className="mt-2 rounded bg-indigo-600 px-2 py-1 text-white text-xs"
                        onClick={() => goToDetail(p.id)}
                      >
                        View details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {points.length === 0 && !loading && (
            <p className="mt-2 text-sm text-slate-500 text-center">
              No map pins yet. Add listings with latitude and longitude to see
              markers.
            </p>
          )}
        </section>

        {/* CARDS */}
        <section>
          {loading ? (
            <p className="text-sm text-slate-500">Loading listings…</p>
          ) : filteredListings.length === 0 ? (
            <p className="text-sm text-slate-500">
              No properties match your search or filters.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredListings.map((l) => {
                const img = cardImageFor(l);
                return (
                  <article
                    key={l.id}
                    className="cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition"
                    onClick={() => goToDetail(l.id)}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden">
                      <img
                        src={img}
                        alt={l.address || "Property image"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <div className="text-xs text-slate-500 truncate">
                        {l.address || "Address not set"}
                      </div>
                      <div className="text-sm font-semibold">Property</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {formatBedsBaths(l)}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-slate-900">
                        {typeof l.price === "number"
                          ? `$${l.price}`
                          : "Price not set"}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <BottomBar />
    </div>
  );
}
