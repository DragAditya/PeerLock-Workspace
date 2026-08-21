import { chromium } from "playwright";

const base = "https://3000-ixdlahreich8vhd25m5zq-3827058c.sg1.manus.computer";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium" });
const desktop = process.env.PEERLOCK_DESKTOP === "1";
const context = await browser.newContext({ viewport: desktop ? { width: 1280, height: 720 } : { width: 375, height: 812 } });
const page = await context.newPage();

try {
  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByLabel("Display name").fill("Startup check");
  await page.getByRole("button", { name: /continue as guest/i }).click();
  await page.getByRole("button", { name: /start a note/i }).click();
  await page.waitForURL(/\/studio\//, { timeout: 15000 });
  await page.locator(".studio-canvas").waitFor({ timeout: 12000 });
  await page.waitForTimeout(4200);
  if (await page.locator(".route-recovery").count()) throw new Error("Document startup entered recovery mode.");
  if (!await page.locator(".rich-editor, .rich-editor-loading").count()) throw new Error("Editor surface did not render.");
  console.log(JSON.stringify({ success: true, viewport: desktop ? "desktop" : "phone", url: page.url(), overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) }));
} finally {
  await browser.close();
}
