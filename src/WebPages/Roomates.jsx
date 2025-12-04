// src/WebPages/Roomates.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import NavbarWithSearch from "./SiteComps/NavbarWithSearch";
import BottomBar from "./SiteComps/BottomBar";
import HeaderSite from "./SiteComps/HeaderSite";
import { getRecentRoommatePosts } from "../services/roommateService";

// Helper to read ?q= from the URL
function useSearchTerm() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  return (params.get("q") || "").trim().toLowerCase();
}

export default function Roomates() {
  const navigate = useNavigate();
  const searchTerm = useSearchTerm();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Optional simple filters for roommates
  const [maxBudget, setMaxBudget] = useState("");
  const [onlyNearCampus, setOnlyNearCampus] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getRecentRoommatePosts(100);
        setPosts(data);
      } catch (e) {
        console.error("Failed to load roommate posts:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredPosts = useMemo(() => {
    let arr = [...posts];

    if (searchTerm) {
      arr = arr.filter((p) => {
        const loc = (p.location || "").toLowerCase();
        const addr = (p.address || "").toLowerCase();
        const city = (p.city || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const title = (p.title || "").toLowerCase();
        return (
          loc.includes(searchTerm) ||
          addr.includes(searchTerm) ||
          city.includes(searchTerm) ||
          desc.includes(searchTerm) ||
          title.includes(searchTerm)
        );
      });
    }

    if (maxBudget) {
      const cap = Number(maxBudget);
      if (Number.isFinite(cap)) {
        arr = arr.filter((p) => {
          const budget = Number(p.budget);
          return !Number.isFinite(budget) ? true : budget <= cap;
        });
      }
    }

    if (onlyNearCampus) {
      // assumes you might have a boolean field like nearCampus or campusHousing
      arr = arr.filter((p) => p.nearCampus.nearCampusCheck || p.campusHousing);
    }

    return arr;
  }, [posts, searchTerm, maxBudget, onlyNearCampus]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <HeaderSite />

      <div className="w-full flex bg-blue-500">
        <NavbarWithSearch />
      </div>

      <main className="mx-auto w-full max-w-screen-2xl px-6 py-6 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Find Roommates</h2>
          {searchTerm && (
            <span className="text-xs text-slate-500">
              Showing results for <span className="font-medium">“{searchTerm}”</span>
            </span>
          )}
        </div>

        {/* Filters */}
        <section className="mb-4 flex flex-wrap gap-4 items-end">
          <div>
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

          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={onlyNearCampus}
              onChange={(e) => setOnlyNearCampus(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Prefer near-campus posts
          </label>
        </section>

        {/* Cards */}
        <section>
          {loading ? (
            <p className="text-sm text-slate-500">Loading roommate posts…</p>
          ) : filteredPosts.length === 0 ? (
            <p className="text-sm text-slate-500">
              No roommate posts match your search or filters.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((p) => {
                const price = p.rent ?? p.budget;
                return (
                  <article
                    key={p.id}
                    className="overflow-hidden rounded-2xl border bg-white shadow-sm hover:shadow-md transition"
                  >
                    <div className="p-3 space-y-1">
                      <div className="text-xs text-slate-500">
                        {p.location || p.city || "Location not set"}
                      </div>
                      <div className="font-semibold text-sm">
                        {p.title || "Roommate needed"}
                      </div>
                      {price && (
                        <div className="text-sm text-slate-800">
                          Budget / Rent: ${price}
                        </div>
                      )}
                      <div className="text-xs text-slate-600 line-clamp-3">
                        {p.description || "No description provided."}
                      </div>
                      <button
                        className="mt-2 rounded bg-indigo-600 px-3 py-1 text-xs text-white"
                        onClick={() => navigate(`/Roomates/${p.id}`)}
                      >
                        View details
                      </button>
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
