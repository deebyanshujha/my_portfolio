import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import {
  applySettings,
  preloadWallpapers,
  settingsStore,
} from "./os/kernel/settingsStore";

// apply persisted appearance before the first paint so there is no flash
applySettings(settingsStore.get());
// and start fetching the desktop's photograph now, not when the desktop mounts
preloadWallpapers();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
