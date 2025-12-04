// src/WebPages/SiteComps/NavbarWithSearch.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RandHNav } from "./NavBarComps/SiteNavButtons";
import LoginButtonState from "./ScriptFuntions/LoginButtonState";

export default function NavbarWithSearch() {
  const location = useLocation();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");

  // Keep input in sync with ?q= in the URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q") || "";
    setTerm(q);
  }, [location.search]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = term.trim();

    // Decide which page to search on, based on where user is
    let path = "/Houses";
    const lower = location.pathname.toLowerCase();
    if (lower.startsWith("/roomates")) {
      path = "/Roomates"; // your existing route spelling
    } else if (lower.startsWith("/houses")) {
      path = "/Houses";
    }

    const params = new URLSearchParams();
    if (q) params.set("q", q);

    navigate({
      pathname: path,
      search: params.toString() ? `?${params.toString()}` : "",
    });
  };

  return (
    <nav className="w-full bg-white dark:bg-blue-500 border-gray-200">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4 gap-x-8">
        <a href="#" className="flex items-center space-x-3 rtl:space-x-reverse">
      <img src="real-estate-home-svgrepo-com.svg" className="h-8" alt="CampusNest Temp Logo" />
          <span className="self-center text-2xl dark:text-white font-semibold whitespace-nowrap">
            CampusNest
          </span>
        </a>

          {/*Login button state and dropdown when shrunk for nav menu*/}
        <div className="flex items-center md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse relative">
       <LoginButtonState />
             <button data-collapse-toggle="navbar-user" type="button" className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600" aria-controls="navbar-user" aria-expanded="false">
              <span className="sr-only">Open main menu</span>
              <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h15M1 7h15M1 13h15"/>
              </svg>
          </button>
      </div>

        {/* Find Roommates / Find Houses nav */}
        <RandHNav />

        {/* Search bar */}
        <div className="flex items-center flex-grow mr-[5%] ml-[5%]">
          <form className="w-full" onSubmit={handleSubmit}>
            <label
              htmlFor="global-search"
              className="mb-2 text-sm font-medium text-black-900 sr-only"
            >
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-500"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                  />
                </svg>
              </div>
              <input
                id="global-search"
                type="search"
                placeholder="Search by city, area, keyword"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                className="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>
    </nav>
  );
}
