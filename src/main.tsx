import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global resilience handler for new deployments (chunk hash updates)
window.addEventListener("vite:preloadError", (event) => {
  console.warn("New deployment detected: vite preload error. Reloading page...");
  const lastReload = sessionStorage.getItem("voke_deployment_reload");
  const now = Date.now();
  if (!lastReload || now - parseInt(lastReload) > 10000) {
    sessionStorage.setItem("voke_deployment_reload", now.toString());
    window.location.reload();
  }
});

window.addEventListener("unhandledrejection", (event) => {
  const errorMsg = event?.reason?.message || String(event?.reason);
  if (
    errorMsg.includes("Failed to fetch dynamically imported module") ||
    errorMsg.includes("Expected a JavaScript-or-Wasm module script") ||
    errorMsg.includes("Loading chunk")
  ) {
    console.warn("Dynamic import failure due to deployment update. Reloading to fetch latest assets...");
    const lastReload = sessionStorage.getItem("voke_deployment_reload");
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload) > 10000) {
      sessionStorage.setItem("voke_deployment_reload", now.toString());
      window.location.reload();
    }
  }
});

const container = document.getElementById("root")!;
createRoot(container).render(<App />);
