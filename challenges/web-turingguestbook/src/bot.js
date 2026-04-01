const puppeteer = require("puppeteer");
const fs = require("fs");

const FLAG = fs.readFileSync("/flag.txt", "utf8").trim();
const COOKIE = Buffer.from(FLAG).toString("base64");

(async () => {
  while (true) {
    try {
      const browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--no-zygote",
          "--single-process"
        ]
      });

      const page = await browser.newPage();

      await page.setCookie({
        name: "TURING_SESSION",
        value: COOKIE,
        domain: "localhost",
        path: "/"
      });

      await page.goto("http://localhost", { timeout: 5000, waitUntil: "domcontentloaded" });
      await new Promise(r => setTimeout(r, 3000));

      await browser.close();
    } catch (e) {
      console.error("[bot] Error:", e.message);
    }

    await new Promise(r => setTimeout(r, 30000));
  }
})();