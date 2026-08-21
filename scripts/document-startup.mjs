import { chromium } from "playwright";

const base = process.env.PEERLOCK_BASE_URL ?? "http://127.0.0.1:3000";

async function requiredAccountGate(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Sign in to enter." }).waitFor({ state: "visible", timeout: 15_000 });
  const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  if (dimensions.scrollWidth > dimensions.viewport + 1) throw new Error(`Account gate overflow: ${JSON.stringify(dimensions)}`);
  await context.close();
  return { accountRequired: true, ...dimensions };
}

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium" });
try {
  const phone = await requiredAccountGate(browser, { width: 390, height: 844 });
  const desktop = await requiredAccountGate(browser, { width: 1440, height: 900 });
  console.log(JSON.stringify({ success: true, phone, desktop }));
} finally {
  await browser.close();
}
