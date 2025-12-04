import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./WebPages/Home.jsx";
import Login from "./WebPages/Login.jsx";
import Roomates from "./WebPages/Roomates.jsx";
import Houses from "./WebPages/Houses.jsx";
import { Siteroutes } from "./WebPages/SiteComps/ScriptFuntions/Siteroutes.js";
import Profile from "./WebPages/Profile.jsx";
import PostLease from "./WebPages/PostLease.jsx";
import HouseDetail from "./WebPages/HouseDetail.jsx";
import RoomateDetail from "./WebPages/RoomateDetail.jsx";
import Dashboard from "./WebPages/Dashboard.jsx";
import RoomatePost from "./WebPages/RoomatePost.jsx"
import HomePageNav from "./WebPages/SiteComps/NavBarComps/SiteNavButtons.jsx";

export default function App() {
  return (
    <Router basename="/CampusNest">
      <Routes>
        <Route path={Siteroutes.Home} element={<Home />} />
        <Route path={Siteroutes.LoginSignup} element={<Login />} />
        <Route path={Siteroutes.Roomate} element={<Roomates />} />
        <Route path={Siteroutes.House} element={<Houses />} />
        <Route path={Siteroutes.Profile} element={<Profile />} />
        <Route path={Siteroutes.HousePost} element={<PostLease />} />

        {/* dynamic detail routes */}
        <Route path="/Houses/:id" element={<HouseDetail />} />
        <Route path="/Roomates/:id" element={<RoomateDetail />} />
        <Route path={Siteroutes.DashBoard} element={<Dashboard />} />
        <Route path={Siteroutes.RoomatePost} element={<RoomatePost />} />
      </Routes>
    </Router>
  );
}

{/*        <Route path={Siteroutes.HouseDetail} element={<HouseDetail />} />
        <Route path={Siteroutes.RoommateDetail} element={<RoommateDetail />} /> */}