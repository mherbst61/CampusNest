// src/WebPages/SiteComps/PropertyCard.jsx
import { Link } from "react-router-dom";

export default function PropertyCard({ item }) {
  const img =
    (Array.isArray(item.imageUrls) && item.imageUrls[0]) ||
    item.image ||
    "";

  return (
    <Link to={`/Houses/${item.id}`} className="block group">
      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="aspect-[4/3] bg-gray-100">
          {img ? (
            <img
              src={img}
              alt={item.title || item.address || "Listing"}
              className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
            />
          ) : (
            <div className="h-full w-full grid place-items-center text-gray-400">
              No image
            </div>
          )}
        </div>
        <div className="p-3">
          <div className="text-sm text-gray-500 truncate">
            {item.address || "—"}
          </div>
          <div className="font-semibold truncate">
            {item.title || "Property"}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {item.bedrooms ?? "–"} bd · {item.bathrooms ?? "–"} ba
          </div>
          {item.price ? (
            <div className="mt-1 font-semibold">${item.price}</div>
          ) : null}
        </div>
      </div>
    </Link>
export default function PropertyCard({ item }) {
  const cover =
    item?.imageUrls?.[0] ||
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format";

  return (
    <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
      <div className="aspect-video w-full overflow-hidden">
        <img src={cover} alt={item?.address || "Listing"} className="h-full w-full object-cover" />
      </div>
      <div className="p-3">
        <div className="font-semibold truncate">{item?.address || "Untitled listing"}</div>
        <div className="mt-1 text-sm text-gray-600">
          {item?.bedrooms ? `${item.bedrooms} bd` : ""} {item?.bathrooms ? `• ${item.bathrooms} ba` : ""}
        </div>
        <div className="mt-2 text-indigo-700 font-semibold">
          {item?.price ? `$${item.price}/mo` : ""}
        </div>
      </div>
    </div>
  );
}
