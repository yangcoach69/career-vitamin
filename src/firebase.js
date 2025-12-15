// src/firebase.js
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged // 1. 여기서 가져와서
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where,
  getDocs,
  updateDoc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCNc2Ht2PJAdcxfXraBwu6Afj02dUEV0gM",
  authDomain: "career-vitamin.firebaseapp.com",
  projectId: "career-vitamin",
  storageBucket: "career-vitamin.firebasestorage.app",
  messagingSenderId: "1056766630872",
  appId: "1:1056766630872:web:5d2149f6a0f0fd5cd130ad"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// 중요! 여기서 밖으로 내보내줘야 App.js에서 쓸 수 있습니다.
export { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, // 2. 여기 이 줄이 없으면 에러가 납니다!
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where,
  getDocs,
  updateDoc
};