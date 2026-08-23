import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// Local development sync endpoint for cross-browser synchronization
function collegeDrivesSyncPlugin() {
  const cacheFile = path.resolve(__dirname, "public/college_drives_data.json");

  return {
    name: "college-drives-sync",
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url?.startsWith("/api/college-drives")) {
          if (req.method === "GET") {
            try {
              if (fs.existsSync(cacheFile)) {
                const data = fs.readFileSync(cacheFile, "utf-8");
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.end(data);
                return;
              }
            } catch (e) {}
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.end(JSON.stringify([]));
            return;
          }
          if (req.method === "POST") {
            let body = "";
            req.on("data", (chunk: any) => { body += chunk; });
            req.on("end", () => {
              try {
                fs.writeFileSync(cacheFile, body, "utf-8");
                res.setHeader("Content-Type", "application/json");
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.end(JSON.stringify({ success: true }));
              } catch (e) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: String(e) }));
              }
            });
            return;
          }
        }
        next();
      });
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), collegeDrivesSyncPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react/") || id.includes("react-dom/") || id.includes("react-router")) {
              return "vendor-react";
            }
            if (id.includes("recharts") || id.includes("d3-")) {
              return "vendor-charts";
            }
            if (id.includes("framer-motion")) {
              return "vendor-animation";
            }
            if (id.includes("pdfjs-dist")) {
              return "vendor-pdf";
            }
          }
        },
      },
    },
  },
}));
