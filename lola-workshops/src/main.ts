import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import "./registerServiceWorker"; // Register the service worker
import vuetify from "./plugins/vuetify";
import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { Lit } from "litlyx-js";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
} from "firebase/firestore";
import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  collection,
  collectionGroup,
  increment,
  where,
  query,
  getDocs,
  getDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from "firebase/firestore";
import { loadFonts } from "./plugins/webfontloader";
import dayjsPlugin from "./plugins/dayjs";

import "./assets/styles/global.css";

const firebaseConfig = {
  apiKey: "AIzaSyCqirihlLIom4QR_bRsgUu8e-WcitVGJDg",
  authDomain: "lola-workshops.firebaseapp.com",
  projectId: "lola-workshops",
  storageBucket: "lola-workshops.appspot.com",
  messagingSenderId: "1034483765903",
  appId: "1:1034483765903:web:00ed596cbbbbc6f3a516fa",
  measurementId: "G-ZM1D597JTP",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

logEvent(analytics, "page_view"); // Log an initial event

const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});
const auth = getAuth(app);
const isDeveloping = localStorage.getItem("isDeveloping");
if (process.env.NODE_ENV === "development" && isDeveloping === "true") {
  connectFirestoreEmulator(db, "localhost", 8094);
}

Lit.init("66e2a88741eed9eef436bbf6");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log(
          "Service Worker registered with scope:",
          registration.scope
        );
      })
      .catch((error) => {
        console.error("Service Worker registration failed:", error);
      });
  });
}

export { Lit };

export {
  auth,
  getFirestore,
  db,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  collectionGroup,
  increment,
  where,
  query,
  getDocs,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
};

loadFonts();

createApp(App)
  .use(dayjsPlugin)
  .use(router)
  .use(store)
  .use(vuetify)
  .provide("db", db)
  .mount("#app");
