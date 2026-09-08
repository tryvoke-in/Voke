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

// Development proxy to fetch GitHub repositories without rate limits
function githubReposProxyPlugin() {
  return {
    name: "github-repos-proxy",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url?.startsWith("/api/github-repos")) {
          const url = new URL(req.url, "http://localhost");
          const username = url.searchParams.get("username");
          if (!username) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Missing username parameter" }));
            return;
          }

          try {
            let repos: any[] = [];

            // 1. Fetch public repositories tab (100% immune to GitHub API rate limits!)
            try {
              const htmlRes = await fetch(`https://github.com/${encodeURIComponent(username)}?tab=repositories`, {
                headers: {
                  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)"
                }
              });
              if (htmlRes.ok) {
                const html = await htmlRes.text();
                const items = html.split(/<li [^>]*itemprop="owns"[^>]*>/i);
                for (let i = 1; i < items.length; i++) {
                  const block = items[i];
                  const nameMatch = block.match(/itemprop="name codeRepository"[^>]*>\s*([^\s<]+)/i);
                  if (!nameMatch) continue;
                  const name = nameMatch[1].trim();
                  if (name.toLowerCase() === username.toLowerCase()) continue;
                  const descMatch = block.match(/itemprop="description"[^>]*>\s*([^<]+)/i);
                  const desc = descMatch ? descMatch[1].trim() : '';
                  const langMatch = block.match(/itemprop="programmingLanguage"[^>]*>\s*([^<]+)/i);
                  const lang = langMatch ? langMatch[1].trim() : 'JavaScript / TypeScript';
                  repos.push({
                    name,
                    description: desc || 'GitHub project repository',
                    language: lang,
                    summary: desc ? `${name}: ${desc}` : `${name} project repository`
                  });
                }
              }
            } catch (scrapeErr) {
              console.warn("[Vite GithubProxy] HTML scrape note:", scrapeErr);
            }

            // 2. Fallback to API if scrape yielded 0
            if (repos.length === 0) {
              const token = req.headers.authorization;
              const apiRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`, {
                headers: {
                  "Accept": "application/vnd.github.v3+json",
                  "User-Agent": "Voke-App",
                  ...(token ? { "Authorization": token } : {})
                }
              });
              if (apiRes.ok) {
                const apiData = await apiRes.json();
                if (Array.isArray(apiData)) {
                  repos = apiData.map((r: any) => ({
                    name: r.name,
                    description: r.description || 'GitHub project repository',
                    language: r.language || 'TypeScript / JavaScript',
                    summary: r.description ? `${r.name}: ${r.description}` : `${r.name} project repository`
                  }));
                }
              }
            }

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.end(JSON.stringify(repos));
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.end(JSON.stringify({ error: err.message, repos: [] }));
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
  plugins: [react(), collegeDrivesSyncPlugin(), githubReposProxyPlugin()],
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
