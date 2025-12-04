import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import HeaderSite from "./SiteComps/HeaderSite";
import Navbar from "./SiteComps/navBar";
import BottomBar from "./SiteComps/BottomBar";

import RecentCarousel from "./SiteComps/RecentCarousel.jsx";
import { getRecentListings } from "../services/listingService";
import { getRecentRoommatePosts } from "../services/roommateService";

const clampBoxStyle = {
  display: "-webkit-box",
  WebkitLineClamp: 6,            // show up to 6 lines
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

export default function Home() {
  const navigate = useNavigate();

  // data
  const [houseItems, setHouseItems] = useState([]);
  const [roommateItems, setRoommateItems] = useState([]);

  // which slide is active (to show matching description)
  const [houseIdx, setHouseIdx] = useState(0);
  const [roomIdx, setRoomIdx] = useState(0);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const [houses, roommates] = await Promise.all([
          getRecentListings(10),
          getRecentRoommatePosts(10),
        ]);
        if (!ignore) {
          setHouseItems(houses || []);
          setRoommateItems(roommates || []);
          console.log("Fetched roommates items:", roommates);
          console.log("Fetched House Items:", houses)
        }
      } catch (e) {
        console.error("Home load failed:", e);
      }
    })();
    return () => { ignore = true; };
  }, []);

  // click → open detail pages with ?id=
  const openHouse = (i) => {
    const doc = houseItems[i];
    if (doc?.id) navigate(`/Houses/${doc.id}`);
  };
  const openRoommate = (i) => {
    const doc = roommateItems[i];
    if (doc?.id) navigate(`/Roomates/${doc.id}`);
  };

  const activeHouse = houseItems[houseIdx] || null;
  const activeRoommate = roommateItems[roomIdx] || null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header + Nav (unchanged) */}
      <HeaderSite />
      <div className="w-full flex">
        <Navbar />
      </div>

      {/* Content */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1">
        {/* Two columns grid */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* ==== Featured Houses ==== */}
          <section className="rounded-2xl border p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Featured Houses</h2>

            <RecentCarousel
              items={houseItems}
              extractImage={(x) => x?.imageUrls?.[0]}
              extractAlt={(x) => x?.address || "House"}
              onActiveChange={setHouseIdx}
              onImageClick={openHouse}
              heightClass="h-96"            // bigger block
              rounded="rounded-xl"
            />

            <div className="mt-4 rounded-xl border p-3 text-sm leading-6" style={clampBoxStyle}>
              {activeHouse?.description || <span className="text-gray-500">No description</span>}
            </div>
          </section>

          {/* ==== New Roommates ==== */}
          <section className="rounded-2xl border p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">New Roommates</h2>

            <RecentCarousel
              items={roommateItems}
              extractImage={(x) => x?.image || x?.photoURL}
              extractAlt={(x) => x?.postTitle || x?.name || "Roommate post"}
              onActiveChange={setRoomIdx}
              onImageClick={openRoommate}
              heightClass="h-96"            // bigger block
              rounded="rounded-xl"
            />

            <div className="mt-4 rounded-xl border p-3 text-sm leading-6" style={clampBoxStyle}>
              {activeRoommate?.description || <span className="text-gray-500">No description</span>}
            </div>
          </section>
        </div>
      </main>

      <BottomBar />
    </div>
  );
}
