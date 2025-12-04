// src/WebPages/RoomateDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import HeaderSite from "./SiteComps/HeaderSite";
import NavbarWithSearch from "./SiteComps/NavbarWithSearch";
import BottomBar from "./SiteComps/BottomBar";
import { getRoommateById } from "../services/roommateService";

const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?name=U&background=E5E7EB&color=111827&size=240";

export default function RoomateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [perferNearCampus, setperferNearCampus] = useState("");
  const [maxBudget, setMaxBudget] = useState("")

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getRoommateById(id);
        setPost(data);
      } catch (e) {
        console.error(e);
        setErr(e.message || "Failed to load roommate post.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const img = post?.image || DEFAULT_AVATAR;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <HeaderSite />
      <div className="w-full flex bg-blue-500">
        <NavbarWithSearch />
      </div>

      <main className="mx-auto w-full max-w-screen-lg px-6 py-6 flex-1">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 text-xs text-indigo-600 hover:underline"
        >
          ← Back to roommate list
        </button>

        {loading && (
          <p className="text-sm text-slate-500">Loading roommate post…</p>
        )}

        {err && !loading && (
          <p className="text-sm text-red-600 mb-4">{err}</p>
        )}

        {!loading && !err && post && (
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            {/* Left: avatar + basic info */}
            <section className="flex flex-col items-center rounded-2xl bg-white p-5 shadow">
              <img
                src={img}
                alt={post.name || "Roommate"}
                className="h-40 w-40 rounded-full object-cover border mb-4"
              />
              <h1 className="text-lg font-semibold mb-1">
                {post.name || "Roommate"}
              </h1>
              <p className="text-xs text-slate-500">
                {post.postTitle || "Roommate post"}
              </p>
            </section>

            {/* Right: details */}
            <section className="rounded-2xl bg-white p-5 shadow space-y-4">
              <div>
                <h2 className="text-sm font-semibold mb-1">About this post</h2>
                <p className="text-sm text-slate-700 whitespace-pre-line">
                  {post.description || "No description provided."}
                </p>
              </div>

              <div className="border-t pt-4 space-y-2">
                <h2 className="text-sm font-semibold mb-1">Contact</h2>
                <ul className="text-sm text-slate-700 space-y-1">
                  {post.email && (
                    <li>
                      <span className="font-medium">Email:</span>{" "}
                      {post.email}
                    </li>
                  )}
                  {post.phone && (
                    <li>
                      <span className="font-medium">Phone:</span>{" "}
                      {post.phone}
                    </li>
                  )}
                  {post.other1 && (
                    <li>
                      <span className="font-medium">Other:</span>{" "}
                      {post.other1}
                    </li>
                  )}
                  {post.other2 && (
                    <li>
                      <span className="font-medium">Other:</span>{" "}
                      {post.other2}
                    </li>
                  )}
                  {!post.email &&
                    !post.phone &&
                    !post.other1 &&
                    !post.other2 && (
                      <li className="text-xs text-slate-500">
                        No contact information was provided.
                      </li>
                    )}
                </ul>
              </div>

              {post.createdAt && (
                <p className="mt-4 text-xs text-slate-500">
                  Posted on {post.createdAt.toLocaleString()}
                </p>
              )}
            </section>
          </div>
        )}
      </main>

      <BottomBar />
    </div>
  );
}
