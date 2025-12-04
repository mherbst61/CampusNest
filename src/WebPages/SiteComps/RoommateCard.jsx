// src/WebPages/SiteComps/RoommateCard.jsx
export default function RoommateCard({ item }) {
  const avatar =
    item?.image ||
    item?.photoURL ||
    "https://ui-avatars.com/api/?name=U&background=E5E7EB&color=111827&size=240";

  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center gap-3">
        <img src={avatar} alt="avatar" className="h-12 w-12 rounded-full object-cover border" />
        <div>
          <div className="font-semibold leading-5">{item?.postTitle || "Roommate post"}</div>
          <div className="text-sm text-gray-500">{item?.name || "Anonymous"}</div>
        </div>
      </div>
      <div className="mt-3 text-sm text-gray-700 line-clamp-3">
        {item?.description || "No description"}
      </div>
    </div>
  );
}
