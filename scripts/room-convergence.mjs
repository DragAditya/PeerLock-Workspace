import { chromium } from "playwright";

const base = "https://3000-ixdlahreich8vhd25m5zq-3827058c.sg1.manus.computer";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium" });
const ownerContext = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
const guestContext = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
const owner = await ownerContext.newPage();
const guest = await guestContext.newPage();

async function enterAsGuest(page, name) {
  await page.goto(base, { waitUntil: "networkidle" });
  await page.getByLabel("Display name").fill(name);
  await page.getByRole("button", { name: /continue as guest/i }).click();
  await page.waitForURL(`${base}/`);
}

try {
  await enterAsGuest(owner, "Room owner");
  await owner.getByRole("button", { name: /start a note/i }).click();
  await owner.waitForURL(/\/studio\//);
  await owner.waitForTimeout(2500);
  const roomButton = owner.getByRole("button", { name: /^room$/i });
  if (!await roomButton.isVisible()) throw new Error(`Room control missing after studio startup: ${(await owner.locator("body").innerText()).slice(0, 1000)}`);
  await roomButton.click();
  await owner.getByRole("button", { name: /create open room/i }).click();
  await owner.locator(".invite-card strong").waitFor({ timeout: 15000 });
  const code = (await owner.locator(".invite-card strong").textContent())?.trim();
  if (!code || !/^[A-Z0-9]{8}$/.test(code)) throw new Error("Owner room code was not created.");
  await owner.getByText("Room connected").waitFor({ timeout: 20000 });
  const initialText = "this text exists before the approved guest joins";
  const ownerEditor = owner.locator(".rich-editor");
  await ownerEditor.click();
  await ownerEditor.press("Control+A");
  await ownerEditor.press("Backspace");
  await ownerEditor.type(initialText);

  await guest.goto(`${base}/r/${code}`, { waitUntil: "networkidle" });
  await guest.getByLabel("Display name").fill("Approved guest");
  await guest.getByRole("button", { name: /continue as guest/i }).click();
  await owner.getByRole("button", { name: /allow approved guest/i }).waitFor({ timeout: 15000 });
  await owner.getByRole("button", { name: /allow approved guest/i }).click();
  await guest.waitForURL(/\/studio\//, { timeout: 15000 });
  await guest.waitForTimeout(20000);
  const hydratedText = await guest.locator(".rich-editor").textContent();
  if (!hydratedText?.includes(initialText)) {
    const ownerPresence = await owner.locator(".studio-live").innerText().catch(() => "[owner collaboration panel unavailable]");
    const guestPresence = await guest.locator(".studio-live").innerText().catch(() => "[guest collaboration panel unavailable]");
    throw new Error(`Guest did not render initial Yjs state: ${hydratedText ?? "[empty editor]"}; owner=${ownerPresence.slice(0, 250)}; guest=${guestPresence.slice(0, 250)}`);
  }
  await guest.setViewportSize({ width: 375, height: 812 });
  const mobileOverflow = await guest.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  if (mobileOverflow) throw new Error("Guest studio has horizontal overflow at phone width.");
  await owner.getByLabel("Open settings").click();
  await owner.waitForURL(`${base}/settings`);
  await owner.getByLabel("Close settings").click();
  await owner.waitForURL(/\/studio\//);
  console.log(JSON.stringify({ success: true, code, ownerUrl: owner.url(), guestUrl: guest.url() }));
} finally {
  await browser.close();
}
