const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = __dirname;
const port = 4173;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

http
  .createServer((request, response) => {
    let route = decodeURIComponent(request.url.split("?")[0]);
    if (route === "/") route = "/index.html";

    const filePath = path.join(root, route);
    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, {
        "Content-Type": types[path.extname(filePath)] || "application/octet-stream"
      });
      response.end(data);
    });
  })
  .listen(port, "0.0.0.0", () => {
    const localUrls = getLocalUrls();
    console.log(`Mooncake 94 berjalan di PC ini: http://127.0.0.1:${port}`);
    console.log("");
    console.log("Untuk HP/tablet di WiFi yang sama, buka salah satu alamat ini:");
    localUrls.forEach((url) => console.log(`- ${url}`));
    console.log("");
    console.log("Biarkan jendela ini tetap terbuka selama aplikasi dipakai.");
  });

function getLocalUrls() {
  const interfaces = os.networkInterfaces();
  const urls = [];

  Object.values(interfaces).forEach((items) => {
    (items || []).forEach((item) => {
      if (item.family === "IPv4" && !item.internal) {
        urls.push(`http://${item.address}:${port}`);
      }
    });
  });

  return urls.length ? urls : [`http://alamat-ip-pc:${port}`];
}
