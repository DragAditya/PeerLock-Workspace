import { chromium } from "playwright";

const base = process.env.PEERLOCK_BASE_URL ?? "http://127.0.0.1:3000";

async function enterAsGuestAndCreate(page, label) {
  await page.goto(base, { waitUntil: "networkidle" });
  const profileInput = page.getByLabel("Display name");
  if (await profileInput.count()) {
    await profileInput.fill(label);
    await page.getByRole("button", { name: /continue as guest/i }).click();
    await page.waitForURL(`${base}/`);
  }
  const create = page.getByRole("button", { name: "Start a note" });
  if (await create.isVisible()) await create.click();
  else await page.getByRole("button", { name: "Create first note" }).click();
  await page.waitForURL(/\/studio\//);
  await page.locator(".ProseMirror.rich-editor").waitFor({ state: "visible", timeout: 15000 });
}

async function normalStartup(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await enterAsGuestAndCreate(page, `Startup ${viewport.width}`);
  const route = page.url();
  const dimensions = await page.evaluate(() => ({ viewport: window.innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  if (dimensions.scrollWidth > dimensions.viewport + 1) throw new Error(`Normal startup overflow: ${JSON.stringify(dimensions)}`);
  await context.close();
  return { route, ...dimensions };
}

async function documentPersistenceFallback(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await enterAsGuestAndCreate(page, "Document fallback");
  await context.addInitScript(() => {
    const originalOpen = indexedDB.open.bind(indexedDB);
    indexedDB.open = (name, version) => {
      if (String(name).startsWith("peerlock-document-")) {
        const stalled = new EventTarget();
        Object.assign(stalled, { result: undefined, error: undefined, transaction: undefined, readyState: "pending", onblocked: null, onerror: null, onsuccess: null, onupgradeneeded: null });
        return stalled;
      }
      return originalOpen(name, version);
    };
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".ProseMirror.rich-editor").waitFor({ state: "visible", timeout: 9000 });
  const recovered = await page.getByText("Local storage recovering").count();
  if (!recovered) throw new Error("Yjs persistence timeout did not release the editor with a recovery indicator.");
  await context.close();
  return { recovered: true };
}

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium" });
try {
  const phone = await normalStartup(browser, { width: 390, height: 844 });
  const desktop = await normalStartup(browser, { width: 1440, height: 900 });
  const documentFallback = await documentPersistenceFallback(browser);
  console.log(JSON.stringify({ success: true, phone, desktop, documentFallback }));
} finally {
  await browser.close();
}
