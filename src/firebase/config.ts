import { initializeApp, getApps, getApp } from "firebase/app";
import { getFunctions } from "firebase/functions";


const firebaseConfig = {
  apiKey: "AIzaSyBnraKMQCTyau_xNoFbiRO2cyuTNsvvab0",
  authDomain: "healthlens-app-ebaa4.firebaseapp.com",
  projectId: "healthlens-app-ebaa4",
  storageBucket: "healthlens-app-ebaa4.firebasestorage.app",
  messagingSenderId: "517779296737",
  appId: "1:517779296737:web:0de8ee27e68857738a02a0"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const functions = getFunctions(app, "us-central1");