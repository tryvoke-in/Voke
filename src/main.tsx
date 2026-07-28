import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const container = document.getElementById("root")!;

if (container.hasChildNodes() && container.innerHTML.trim().length > 0) {
  hydrateRoot(container, <App />);
} else {
  createRoot(container).render(<App />);
}
