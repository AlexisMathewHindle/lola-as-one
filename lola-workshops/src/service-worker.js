/* eslint-disable no-undef */
// src/service-worker.js

// Load Workbox from the CDN using importScripts
// eslint-disable-next-line no-undef
importScripts(
  "https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js"
);

// Check if Workbox is successfully loaded
if (workbox) {
  console.log("Workbox is loaded 🎉");

  // Precache the assets injected by Workbox at build time
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST);

  self.addEventListener("install", (event) => {
    console.log("Service Worker installing.");
    self.skipWaiting(); // Forces the new service worker to activate immediately
  });

  self.addEventListener("activate", (event) => {
    console.log("Service Worker activated.");
    self.clients.claim(); // Takes control of all clients as soon as the service worker activates
  });

  self.addEventListener("fetch", (event) => {
    // Add custom fetch logic here, such as caching strategies
    // console.log("Fetching:", event.request.url);
  });
} else {
  console.log("Workbox failed to load 😬");
}
