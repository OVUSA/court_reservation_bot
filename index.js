/**
 * Uses real Chrome to log in — works on Node 16.
 *
 */

const puppeteer   = require("puppeteer");
const fs          = require("fs");
const credentials = require("./credentials.json");

async function main() {

  // Launch real Chrome — headless: false means you can watch it
  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Set a real browser User-Agent so CloudFront does not block us
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
    "AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/122.0.0.0 Safari/537.36"
  );

  // STEP 1 — open the login page
  console.log("Opening login page...");
  await page.goto("https://rippner.clubautomation.com", {
    waitUntil: "networkidle2",
  });

  // STEP 2 — fill in the form
  console.log("Filling credentials...");
  console.log("  login    : " + credentials.USERNAME);
  await page.type('input[name="login"]',    credentials.USERNAME, { delay: 50 });
  await page.type('input[name="password"]', credentials.PASSWORD, { delay: 50 });

  // STEP 3 — click Login button
  console.log("Clicking Login...");
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }),
    page.click('button[type="submit"]'),
  ]);

  // STEP 4 — check where we landed
  const finalUrl = page.url();
  console.log("Final URL: " + finalUrl);

  if (!finalUrl.includes("/member") || finalUrl.includes("/login")) {
    console.error("❌ Login failed — still on login page");
    fs.writeFileSync("debug-failed.html", await page.content(), "utf8");
    console.log("   Saved debug-failed.html — open in browser to see error");
    await browser.close();
    return;
  }

  console.log("✅ Login successful — " + finalUrl);

  // STEP 5 — save session cookies
  // These cookies are what proves we are logged in
  // We will load them into axios for all future requests
  const cookies = await page.cookies();
  fs.writeFileSync("cookies.json", JSON.stringify(cookies, null, 2));

  // STEP 6 — save dashboard HTML so we can inspect it
  fs.writeFileSync("debug-member.html", await page.content(), "utf8");


  //await browser.close();
  console.log("\nDone. Next step: load cookies.json into axios for court booking requests.");
}

main().catch(function(err) {
  console.error("❌ Unexpected error: " + err.message);
  process.exit(1);
});