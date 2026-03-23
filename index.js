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

// STEP 7 — click "Reserve a Court" link
    console.log("Clicking Reserve a Court...");
    await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 }),
    page.click('#menu_reserve_a_court'),
    ]);
    fs.writeFileSync("debug-court.html", await page.content(), "utf8");


//     await page.goto("https://rippner.clubautomation.com/event/reserve-court-new", {
//     waitUntil: "networkidle2",
//   });
//   console.log("✅ Court reservation page loaded");
 
  // ── STEP 3: Fill the search form ────────────────────────────────
 
  // Sport = Tennis
  // select the option whose text is "Tennis"
  console.log("Selecting sport: Tennis");
  await page.select('select[name="component"]', await page.$eval(
    'select[name="component"] option',
    opts => [...document.querySelectorAll('select[name="component"] option')]
      .find(o => o.text.includes("Tennis"))?.value || "-1"
  ));
 
  // Location = South Austin Tennis Center (value="1")
  console.log("Selecting location: South Austin Tennis Center");
  await page.select('select[name="club"]', "1");
 
  // Court = All Courts (value="-1")
  console.log("Selecting court: All Courts");
  await page.select('select[name="court"]', "-1");
 
  // Host = Olya Velichko (value="57325")
  console.log("Selecting host: Olya Velichko");
  await page.select('select[name="host"]', "57325");
 
  // Date — tomorrow in MM/DD/YYYY format
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date =
    String(tomorrow.getMonth() + 1).padStart(2, "0") + "/" +
    String(tomorrow.getDate()).padStart(2, "0") + "/" +
    tomorrow.getFullYear();
 
  console.log("Setting date: " + date);
  // Clear the field first then type the date
  await page.$eval('input[name="date"]', el => el.value = "");
  await page.type('input[name="date"]', date, { delay: 50 });
 
    console.log("Selecting interval: 90 Min");
    await page.evaluate(() => {
    document.querySelector('#interval-90').click();
    });
  // Time From = 6:00 PM (value="18")
  console.log("Selecting time from: 6:00 PM");
  await page.select('select[name="timeFrom"]', "18");
 
  // Time To = 9:00 PM (value="21")
  console.log("Selecting time to: 9:00 PM");
  await page.select('select[name="timeTo"]', "21");
 
  // ── STEP 4: Click Search ─────────────────────────────────────────
  console.log("Clicking Search...");
//   await Promise.all([
//     page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15000 })
//       .catch(() => {}),           
//     page.click('#reserve-court-search'),
//   ]);
 

console.log("Clicking Search...");
 
  await Promise.all([
    // Wait for the AJAX POST response from the server
    page.waitForResponse(
      res => res.url().includes("reserve-court-new") && res.request().method() === "POST",
      { timeout: 15000 }
    ),
    page.click('#reserve-court-search'),
  ]);
 
  // Give the DOM time to inject the results

 
  // ── STEP 5: Read results ─────────────────────────────────────────
  const resultsHtml = await page.content();
  fs.writeFileSync("debug-results.html", resultsHtml, "utf8");
  console.log("✅ Results saved → debug-results.html");
 
  // Check what came back
  if (resultsHtml.includes("No available times")) {
    console.log("❌ No courts available for this date/time");
  } else if (resultsHtml.includes("r-line available")) {
    console.log("✅ Available courts found — open debug-results.html");
  } else {
    console.log("⚠️  Unexpected result — open debug-results.html to inspect");
  }

  //await browser.close();
  console.log("\nDone. Next step: load cookies.json into axios for court booking requests.");
}

main().catch(function(err) {
  console.error("❌ Unexpected error: " + err.message);
  process.exit(1);
});

//name="component" => Tennis
//name="club"
//<option value="-1">All Locations</option>
  //  <option value="3">Rippner Tennis - Pharr Tennis Center</option>
//    <option value="1" selected="selected">Rippner Tennis - South Austin Tennis Center</option>
//    <option value="2">Rippner Tennis - Williamson County Tennis Center</option>
//name="court" <option value="-1">All Courts</option>
//name="host" value="57325" selected="selected">Olya Velichko</option>
//name="date" value="03/22/2026"
//name="interval" value="90"
//name="timeFrom <option value="18">06:00 PM</option>
//name="timeTo"
//click search