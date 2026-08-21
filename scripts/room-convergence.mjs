import { chromium } from "playwright";

const base = "http://127.0.0.1:3000";
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
  await owner.getByRole("button", { name: /^room$/i }).click();
  await owner.getByRole("button", { name: /create open room/i }).click();
  await owner.locator(".invite-card strong").waitFor({ timeout: 15000 });
  const code = (await owner.locator(".invite-card strong").textContent())?.trim();
  if (!code || !/^[A-Z0-9]{8}$/.test(code)) throw new Error("Owner room code was not created.");
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
  await guest.getByText(initialText).waitFor({ timeout: 20000 });
  await owner.getByLabel("Open settings").click();
  await owner.waitForURL(`${base}/settings`);
  await owner.getByLabel("Close settings").click();
  await owner.waitForURL(/\/studio\//);
  await ownerEditor.click();
  await ownerEditor.press("Control+A");
  await ownerEditor.press("Backspace");
  await ownerEditor.type("owner and approved guest share this exact room");
  await guest.getByText("owner and approved guest share this exact room").waitFor({ timeout: 20000 });
  console.log(JSON.stringify({ success: true, code, ownerUrl: owner.url(), guestUrl: guest.url() }));
} finally {
  await browser.close();
}
