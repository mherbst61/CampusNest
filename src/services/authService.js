// src/services/authService.js
import { auth } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from "firebase/auth";

export const emailSignIn = (email, pw) =>
  signInWithEmailAndPassword(auth, email, pw).then(c => c.user);

export const emailSignUp = async (email, pw, name) => {
  const c = await createUserWithEmailAndPassword(auth, email, pw);
  if (name) await updateProfile(c.user, { displayName: name });
  return c.user;
};

export const googleSignIn = () =>
  signInWithPopup(auth, new GoogleAuthProvider()).then(c => c.user);

export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

export const signOutUser = () => signOut(auth);
