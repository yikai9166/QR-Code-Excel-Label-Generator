import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist");
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
};

function send(response, statusCode, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, { "Content-Type": contentType });
  response.end(body);
}

if (!fs.existsSync(distDir)) {
  console.error("找不到 dist/，請先執行 npm run build。");
  process.exit(1);
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url || "/", `http://localhost:${port}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === "/" || pathname === "/QR-Code-Excel-Label-Generator/") {
    pathname = "/index.html";
  }

  pathname = pathname.replace(/^\/QR-Code-Excel-Label-Generator\//, "/");

  const filePath = path.resolve(distDir, `.${pathname}`);
  if (!filePath.startsWith(distDir)) {
    send(response, 403, "Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      send(response, 404, "Not found");
      return;
    }

    send(response, 200, data, contentTypes[path.extname(filePath)] || "application/octet-stream");
  });
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
