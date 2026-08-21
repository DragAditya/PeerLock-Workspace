import { chromium } from "playwright";

const base = process.env.PEERLOCK_BASE_URL ?? "http://127.0.0.1:3000";
const longToken = "peerlockmobilecontainment".repeat(18);
const longCode = "const encryptedWorkspaceSynchronizationNamespace".repeat(12);

async function enterAndCreateDocument(page, label) {
  await page.goto(base, { waitUntil: "networkidle" });
  const profileInput = page.getByLabel("Display name");
  if (await profileInput.count()) {
    await profileInput.fill(label);
    await page.getByRole("button", { name: /continue as guest/i }).click();
    await page.waitForURL(`${base}/`);
  }
  const createNote = page.getByRole("button", { name: "Start a note" });
  const createFirstNote = page.getByRole("button", { name: "Create first note" });
  if (await createNote.isVisible()) await createNote.click();
  else await createFirstNote.click();
  await page.waitForURL(/\/studio\//);
  const editor = page.locator(".ProseMirror.rich-editor");
  await editor.waitFor({ state: "visible", timeout: 15000 });
  await editor.click();
  await editor.press("Control+A");
  await editor.press("Backspace");
  await editor.pressSequentially(`A real paragraph must wrap within the editor viewport even when it contains ${longToken}.`);
  await editor.press("Enter");
  await page.getByRole("button", { name: "Bullets" }).click();
  await editor.pressSequentially(`List item with ${longToken}.`);
  await editor.press("Enter");
  await page.getByRole("button", { name: "Quote" }).click();
  await editor.pressSequentially(`Quoted content with ${longToken}.`);
  await editor.press("Enter");
  await page.getByRole("button", { name: "Code block" }).click();
  await editor.pressSequentially(longCode);
  return editor;
}

async function assertContained(page, viewportName) {
  const snapshot = await page.evaluate(() => {
    const richEditor = document.querySelector(".ProseMirror.rich-editor");
    const canvas = document.querySelector(".studio-canvas");
    const pre = richEditor?.querySelector("pre");
    const bounds = (element) => element ? element.getBoundingClientRect() : null;
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      canvas: bounds(canvas),
      editor: bounds(richEditor),
      editorScrollWidth: richEditor?.scrollWidth ?? 0,
      editorClientWidth: richEditor?.clientWidth ?? 0,
      editorOverflowWrap: richEditor ? getComputedStyle(richEditor).overflowWrap : "",
      pre: bounds(pre),
      preOverflowX: pre ? getComputedStyle(pre).overflowX : "",
    };
  });
  const overflow = snapshot.documentWidth > snapshot.viewportWidth + 1;
  const editorOutOfView = !snapshot.editor || snapshot.editor.right > snapshot.viewportWidth + 1;
  const canvasOutOfView = !snapshot.canvas || snapshot.canvas.right > snapshot.viewportWidth + 1;
  const codeOutOfView = !snapshot.pre || snapshot.pre.right > snapshot.viewportWidth + 1;
  const editorExpanded = snapshot.editorScrollWidth > snapshot.editorClientWidth + 1;
  const codeNotScrollable = snapshot.preOverflowX !== "auto" && snapshot.preOverflowX !== "scroll";
  if (overflow || editorOutOfView || canvasOutOfView || codeOutOfView || editorExpanded || codeNotScrollable || snapshot.editorOverflowWrap !== "anywhere") {
    throw new Error(`${viewportName} editor containment failed: ${JSON.stringify(snapshot)}`);
  }
  return snapshot;
}

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium" });
try {
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const phonePage = await phone.newPage();
  await enterAndCreateDocument(phonePage, "Phone regression");
  const phoneResult = await assertContained(phonePage, "phone");
  await phone.close();

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const desktopPage = await desktop.newPage();
  await enterAndCreateDocument(desktopPage, "Desktop regression");
  const desktopResult = await assertContained(desktopPage, "desktop");
  await desktop.close();

  console.log(JSON.stringify({ success: true, phone: phoneResult, desktop: desktopResult }));
} finally {
  await browser.close();
}
