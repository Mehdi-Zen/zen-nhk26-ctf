import { createServer } from "http";
import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "text/html; charset=utf-8");

  try {
    const html = readFileSync(join(__dirname, "render.html"), "utf-8");
    res.writeHead(200);
    res.end(html);
  } catch (error) {
    res.writeHead(500);
    res.end(`Error: ${error.message}`);
  }
});

server.listen(3002, () => {
  console.log("✓ Test server running at:");
  console.log("  http://localhost:3002/render.html?seq=AATTGGCC");
  console.log("  http://localhost:3002/render.html?seq=AAGGCCTT");
  console.log("  http://localhost:3002/render.html?seq=GGAATTCC");
  console.log("");
  console.log("Open one of these URLs in your browser to test the render.html");
  console.log("Press Ctrl+C to stop");
});
