import { createServer } from "http";
import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import os from "os";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import puppeteer from "puppeteer";
import sharp from "sharp";
import ffmpegPath from "ffmpeg-static";
import { distance } from "three/tsl";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// 2-bit mapping
const B2 = ["A", "C", "G", "T"];
const DNA2 = { A: 0, C: 1, G: 2, T: 3 };

// DNA library must match the one in server.js
const dnaLibrary = [
  { id: "1", sequence: "AATTGGCC", label: "base-1" },
  { id: "2", sequence: asciiToDNA("Helix"), label: "helix-2" },
  { id: "3", sequence: asciiToDNA("{helix-base4}"), label: "helix-3" },
];

let browser;
const NAVIGATION_TIMEOUT_MS = 60000;
const RENDER_READY_TIMEOUT_MS = 30000;
const LOAD_RETRY_COUNT = 3;



/**
 * Convertit une string ASCII/UTF-8 en ADN (A/C/G/T).
 * - Encode en UTF-8 (donc supporte aussi les accents si tu veux)
 * - Chaque octet -> 4 bases (2 bits par base)
 */
function asciiToDNA(str) {
  const bytes = new TextEncoder().encode(str);
  let out = "";
  for (const b of bytes) {
    out += B2[(b >> 6) & 3];
    out += B2[(b >> 4) & 3];
    out += B2[(b >> 2) & 3];
    out += B2[b & 3];
  }
  return out;
}

async function initBrowser() {
  browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
      "--enable-unsafe-swiftshader"
    ],
  });
  console.log("✓ Puppeteer browser initialized for build generation");
}

async function screenshotPage(page) {
  try {
    const boundingBox = await page.evaluate(() => {
      const mount = document.getElementById("mount");
      if (!mount) return null;
      const rect = mount.getBoundingClientRect();
      return {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
      };
    });
    const options = { type: "png" };
    if (boundingBox) {
      options.clip = boundingBox;
    }
    const screenshot = await page.screenshot(options);
    return sharp(screenshot).jpeg({ quality: 85 }).toBuffer();
  } catch (err) {
    console.error("screenshotPage error", err);
    return null;
  }
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadRenderPage(page, url) {
  let lastError;
  for (let attempt = 1; attempt <= LOAD_RETRY_COUNT; attempt++) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAVIGATION_TIMEOUT_MS });
      await page.waitForFunction(
        () => window.renderReady === true || window.renderError !== null,
        { timeout: RENDER_READY_TIMEOUT_MS }
      );

      const renderError = await page.evaluate(() => window.renderError);
      if (renderError) {
        throw new Error(`render error: ${renderError}`);
      }
      return;
    } catch (error) {
      lastError = error;
      console.warn(`load attempt ${attempt}/${LOAD_RETRY_COUNT} failed for ${url}:`, error.message);
      if (attempt < LOAD_RETRY_COUNT) {
        await delay(1000 * attempt);
      }
    }
  }
  throw lastError;
}

async function main() {
  // start a simple render server so we can navigate pages
  console.log("ffmpeg static path:", ffmpegPath);
  const renderServer = createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    if (req.url.startsWith("/render-2514524.html")) {
      try {
        const htmlPath = join(__dirname, "render-2514524.html");
        const html = readFileSync(htmlPath, "utf-8");
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
      } catch (error) {
        console.error("Error serving render.html:", error);
        res.writeHead(500);
        res.end("Error loading render.html");
      }
    } else if (req.url.startsWith("/three.min.js")) {
        try {
            const jsPath = join(__dirname, "three.min.js"); 
            const js = readFileSync(jsPath, "utf-8");
            res.writeHead(200, { "Content-Type": "application/javascript; charset=utf-8" });
            res.end(js);
        }
        catch (error) {    
            console.error("Error serving three.min.js:", error);
            res.writeHead(500);
            res.end("Error loading three.min.js");  
        }
    } else {
      res.writeHead(404);
      res.end("not found");
    }
  });


  async function frameDistanceMAD(img1, img2) {
    const size = 64;

    const { data: data1 } = await sharp(img1)
      .resize(size, size)
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data: data2 } = await sharp(img2)
      .resize(size, size)
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    if (data1.length !== data2.length) {
      throw new Error("Images de tailles différentes");
    }

    let diff = 0;

    for (let i = 0; i < data1.length; i++) {
      diff += Math.abs(data1[i] - data2[i]);
    }

    return diff / data1.length;
  }

  await new Promise((resolve, reject) => {
    renderServer.once("error", reject);
    renderServer.listen(3002, "localhost", () => {
      console.log("✓ Render server listening on http://localhost:3002");
      resolve();
    });
  });

  await initBrowser();

  const outDir = join(__dirname, "public", "loops");
  mkdirSync(outDir, { recursive: true });

  for (const dna of dnaLibrary) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1024, height: 768 });
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT_MS);
    page.setDefaultTimeout(RENDER_READY_TIMEOUT_MS);
    const url = `http://localhost:3002/render-2514524.html?seq=${encodeURIComponent(dna.sequence)}`;
    console.log("Navigating to", url);
    await loadRenderPage(page, url);
    await delay(1000);

    const client = await page.target().createCDPSession();
    await client.send("Page.enable");

     // Démarre le screencast
    await client.send("Page.startScreencast", {
      format: "jpeg",
      quality: 70,      
      everyNthFrame: 1,
    });

    const frames = [];
    const distances = [];
    const start = Date.now();
    client.on("Page.screencastFrame", async (evt) => {
      const buf = Buffer.from(evt.data, "base64");
      frames.push(buf);
      // ACK obligatoire sinon Chrome stoppe / bufferise
      await client.send("Page.screencastFrameAck", { sessionId: evt.sessionId });            
    });

    await new Promise((resolve) => {      
      client.on("Page.screencastFrame", async () => {      
        distances.push(await frameDistanceMAD(frames[0], frames[frames.length - 1]));        
        if (frames.length >= 800) { // sécurité au cas où
          client.send("Page.stopScreencast").then(resolve);
        }
      }); 
    });
    let min=distances.length - 1;
    for(let i = distances.length - 2; i >= 100; i--) {
      console.log("distance frame 0 vs frame", i, ":\t", distances[i]);
      if(distances[i] < distances[min]) {        
        min = i;
      }
    }

    console.log(`OK: ${frames.length} frames chargées boucle sur frame ${min}`);
    frames.splice(min + 1); // on garde que jusqu'à la frame la plus proche de la première
    /*const frames = [];
    for (let i = 0; i < 85; i++) {
      const frame = await screenshotPage(page);
      console.log(`captured frame ${i + 1}/85 for dna ${dna.id}`);
      if (frame) {
        frames.push(frame);
      } else {
        console.warn(`frame ${i} was null`);
      }
      await delay(5);
    }
    console.log(`captured ${frames.length} valid frames`);
    */

    console.log(`✓ Beginning ffmpeg encode for dna ${dna.id}`);
    // feed frames and log progress as we write them
    const totalFrames = frames.length;
    let written = 0;
    // to avoid pipe/seek issues we write to a temp file first
    const tmp = join(os.tmpdir(), `loop-${dna.id}.mp4`);    
    let lastReported = 0;
    const ff = spawn(ffmpegPath || "ffmpeg", [
      "-y",// overwrite output if exists
      "-f",// input format
      "image2pipe", // read images from pipe
      // encode at 5fps instead of 10 to halve CPU work (still 5 second loop)
      "-r",// input frame rate
      "60", // x fps (lower = less CPU but choppier; 5 is a good balance for this use case)
      "-i",
      "-",
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      "28", // quality (lower is better quality but bigger file; 28 is a good starting point for 1080p)
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      tmp,
    ]);

    // no need to accumulate buffer; we'll read file later
    // report ffmpeg stderr as before
    ff.stderr.on("data", (d) => {
      const txt = d.toString();
      process.stdout.write(`\n[ffmpeg] ${txt}`);
      const m = txt.match(/frame=\s*(\d+)/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n !== lastReported) {
          lastReported = n;
          process.stdout.write(`\rencoding ${n}/${totalFrames} frames`);
        }
      }
    });

    ff.stdin.on('error', (err) => {
      if (err.code !== 'EPIPE' && err.code !== 'EOF') {
        console.error('stdin write error', err);
      }
    });
    for (const f of frames) {
      if (ff.stdin.writable) {
        ff.stdin.write(f);
        written++;
        process.stdout.write(`\rfeeding ${written}/${totalFrames} frames`);
      }
    }
    ff.stdin.end();
    process.stdout.write("\n");
    await new Promise((resolve) => ff.on("close", resolve));
    process.stdout.write("\n");

    const filePath = join(outDir, `${dna.id}.mp4`);
    try {
      const bufData = readFileSync(tmp);
      writeFileSync(filePath, bufData);
      if (bufData.length === 0) {
        console.warn(`⚠️ ffmpeg produced empty file for dna ${dna.id}`);
      }
      console.log(`✓ Wrote loop file ${filePath} (${bufData.length} bytes)`);
    } catch (e) {
      console.error(`failed to read temp file ${tmp}:`, e);
    }
    // clean up
    try { unlinkSync(tmp); } catch {};

    await page.close();
  }

  await browser.close();
  renderServer.close();
  console.log("✅ Video generation complete");
}

main().catch((e) => {
  console.error("Generation failed:", e);
  process.exit(1);
});

