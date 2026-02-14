import eventBus from "./eventBus";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log(
          "Service Worker registered with scope:",
          registration.scope
        );

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === "installed") {
              if (navigator.serviceWorker.controller) {
                // Emit an event to notify Vue about the update
                eventBus.emit("sw-update-available");
              } else {
                console.log("Content is cached for offline use.");
              }
            }
          };
        };
      })
      .catch((error) => {
        console.error("Error during service worker registration:", error);
      });
  });
}
