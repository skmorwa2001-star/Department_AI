const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

loadEnvFile();

const port = Number(process.env.PORT || 3000);
const owner = process.env.GITHUB_OWNER || "skmorwa2001-star";
const repo = process.env.GITHUB_REPO || "Department_AI";
const branch = process.env.GITHUB_BRANCH || "main";
const root = __dirname;
const mimeTypes = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8" };

if (!process.env.GITHUB_TOKEN) {
  console.warn("GITHUB_TOKEN is not configured. Add it to .env before using GitHub sync.");
}

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

function send(response, status, body, headers = {}) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...headers });
  response.end(JSON.stringify(body));
}

function githubPath(requestPath) {
  const url = new URL(requestPath, "http://localhost");
  const cleanPath = url.pathname.replace(/^\/api\/github/, "");
  return `${cleanPath}${url.search}`;
}

async function proxyGithub(request, response, requestPath) {
  if (!process.env.GITHUB_TOKEN) return send(response, 500, { message: "GITHUB_TOKEN is not configured on the server." });
  const target = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${githubPath(requestPath)}`;
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const upstream = await fetch(target, {
    method: request.method,
    headers: { Accept: "application/vnd.github+json", Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, "X-GitHub-Api-Version": "2022-11-28", ...(chunks.length ? { "Content-Type": "application/json" } : {}) },
    body: chunks.length ? Buffer.concat(chunks) : undefined
  });
  const body = await upstream.text();
  response.writeHead(upstream.status, { "Content-Type": upstream.headers.get("content-type") || "application/json; charset=utf-8" });
  response.end(body);
}

function serveStatic(request, response) {
  const requested = new URL(request.url, "http://localhost").pathname;
  const filePath = path.join(root, requested === "/" ? "index.html" : requested);
  if (!filePath.startsWith(root) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return send(response, 404, { message: "Not found" });
  response.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(response);
}

http.createServer(async (request, response) => {
  try {
    if (request.url.startsWith("/api/config")) return send(response, 200, { owner, repo, branch });
    if (request.url.startsWith("/api/github")) return await proxyGithub(request, response, request.url);
    return serveStatic(request, response);
  } catch (error) {
    send(response, 500, { message: error.message });
  }
}).listen(port, () => console.log(`AI One's Platform running at http://localhost:${port}`));
