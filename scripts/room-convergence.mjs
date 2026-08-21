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
  const approvalStartedAt = Date.now();
  await owner.getByRole("button", { name: /allow approved guest/i }).click();
  try {
    await guest.waitForURL(/\/studio\//, { timeout: 15000 });
  } catch {
    throw new Error(`Approved Fake ID did not open the room: ${JSON.stringify({ owner: { url: owner.url(), text: await owner.locator("body").innerText() }, guest: { url: guest.url(), text: await guest.locator("body").innerText() } })}`);
  }
  const roomOpenedMs = Date.now() - approvalStartedAt;
  try {
    await guest.getByText(initialText).waitFor({ timeout: 20000 });
  } catch {
    const snapshot = await Promise.all([owner, guest].map(async page => ({
      url: page.url(),
      title: await page.getByLabel("Document title").inputValue().catch(() => ""),
      editorText: await page.locator(".ProseMirror.rich-editor").innerText().catch(() => ""),
      status: await page.locator(".canvas-meta").innerText().catch(() => ""),
      peers: await page.locator(".live-peers").innerText().catch(() => ""),
      document: await page.evaluate(async () => new Promise(resolve => {
        const request = indexedDB.open("peerlock-clean-v1");
        request.onsuccess = () => {
          const store = request.result.transaction("documents", "readonly").objectStore("documents");
          const records = store.getAll();
          records.onsuccess = () => resolve(records.result);
        };
      })),
    })));
    throw new Error(`Initial Main ID to Fake ID hydration failed: ${JSON.stringify(snapshot)}`);
  }
  const initialHydrationMs = Date.now() - approvalStartedAt;
  await owner.getByLabel("Open settings").click();
  await owner.waitForURL(`${base}/settings`);
  await owner.getByLabel("Close settings").click();
  await owner.waitForURL(/\/studio\//);
  await ownerEditor.click();
  await ownerEditor.press("Control+A");
  await ownerEditor.press("Backspace");
  await ownerEditor.type("owner and approved guest share this exact room");
  await guest.getByText("owner and approved guest share this exact room").waitFor({ timeout: 20000 });
  console.log(JSON.stringify({ success: true, code, roomOpenedMs, initialHydrationMs, ownerUrl: owner.url(), guestUrl: guest.url() }));
} finally {
  await browser.close();
}
