import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Siteroutes } from "./SiteComps/ScriptFuntions/Siteroutes";
import {
  emailSignIn,
  emailSignUp,
  googleSignIn,
  // microsoftSignIn, // optional—see notes below
} from "../services/authService.js";

function prettyError(e) {
  const code = e?.code || "";
  if (code.includes("invalid-email")) return "Invalid email address.";
  if (code.includes("user-not-found")) return "No account with this email.";
  if (code.includes("wrong-password")) return "Incorrect password.";
  if (code.includes("email-already-in-use")) return "Email already in use.";
  if (code.includes("weak-password")) return "Password must be at least 6 characters.";
  if (code.includes("network-request-failed")) return "Network error. Check connection/ad blockers.";
  return e?.message || "Something went wrong.";
}



export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function doLogin(e) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await emailSignIn(email, pwd);
      navigate("/");
    } catch (e) {
      setErr(prettyError(e));
    } finally { setBusy(false); }
  }

  async function doSignup() {
    setBusy(true); setErr(null);
    try {
      await emailSignUp(email, pwd);      // creates account with email+password
      navigate("/");
    } catch (e) {
      setErr(prettyError(e));
    } finally { setBusy(false); }
  }

  async function doGoogle() {
    setBusy(true); setErr(null);
    try {
      await googleSignIn();
      navigate("/");
    } catch (e) {
      setErr(prettyError(e));
    } finally { setBusy(false); }
  }

  // async function doMicrosoft() {
  //   setBusy(true); setErr(null);
  //   try {
  //     await microsoftSignIn();
  //     navigate("/");
  //   } catch (e) {
  //     setErr(prettyError(e));
  //   } finally { setBusy(false); }
  // }


  return (
 <div className="flex flex-col justify-center items-center h-screen">
      {/* card */}
      <div className="w-full h-full lg:h-[70%] lg:w-[50%] xl:h-[70vh] bg-blue-500 rounded-xl">
        <h1 className="text-white text-center m-5 text-6xl">Login or Signup</h1>

        <form onSubmit={doLogin} className="w-full flex flex-col items-center pt-[6%]">
          {/* Email */}
          <label className="text-white text-4xl mb-2" htmlFor="email">Email:</label>
          <input
            id="email"
            className="h-11 w-[60%] rounded px-3"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            required
          />

          {/* Password */}
          <label className="text-white text-4xl mt-8 mb-2" htmlFor="password">Password:</label>
          <input
            id="password"
            className="h-11 w-[60%] rounded px-3"
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="Enter password"
            required
          />

          {/* Errors */}
          {err && <p className="text-white bg-red-600/80 mt-4 px-3 py-2 rounded">{err}</p>}

          {/* Login / Signup */}
          <div className="w-full flex justify-center gap-8 pt-[5vh]">
            <button
              type="submit"
              disabled={busy}
              className="text-white text-2xl bg-blue-600 hover:bg-blue-800 disabled:opacity-60 rounded border px-6 py-[2vh]"
            >
              {busy ? "Please wait…" : "Login"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={doSignup}
              className="text-white text-2xl bg-blue-600 hover:bg-blue-800 disabled:opacity-60 rounded border px-6 py-[2vh]"
            >
              {busy ? "Please wait…" : "Sign Up"}
            </button>
          </div>

          {/* Social */}
          <div className="w-full flex justify-center gap-6 pt-[2vh]">
            <button
              type="button"
              disabled={busy}
              onClick={doGoogle}
              className="text-white text-2xl bg-blue-600 hover:bg-blue-800 disabled:opacity-60 rounded border px-6 py-[2vh]"
            >
              Sign in with Google
            </button>

            {/* Uncomment only after enabling Microsoft in Firebase + adding service fn */}
            {/* <button
              type="button"
              disabled={busy}
              onClick={doMicrosoft}
              className="text-white text-2xl bg-blue-600 hover:bg-blue-800 disabled:opacity-60 rounded border px-6 py-[2vh]"
            >
              Sign in with Outlook
            </button> */}
          </div>
        </form>
      </div>
    </div>
  );
}