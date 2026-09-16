import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

try {
  const manifestResponse = await context.request.get(`${baseUrl}/manifest.webmanifest`);
  assert.equal(manifestResponse.ok(), true);
  const manifest = await manifestResponse.json();
  assert.deepEqual(
    {
      name: manifest.name,
      start_url: manifest.start_url,
      scope: manifest.scope,
      display: manifest.display,
      background_color: manifest.background_color,
      theme_color: manifest.theme_color,
    },
    {
      name: "LexChain",
      start_url: "/",
      scope: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#0985E7",
    },
  );

  assert.equal((await context.request.get(`${baseUrl}/sw.js`)).ok(), true);
  assert.equal((await context.request.get(`${baseUrl}/offline.html`)).ok(), true);

  await page.goto(baseUrl);
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
  });
  await page.reload();

  const cachedUrls = await page.evaluate(async () => {
    const names = (await caches.keys()).filter((name) => name.startsWith("lexchain-offline-"));
    return (await Promise.all(names.map(async (name) => (await (await caches.open(name)).keys()).map((request) => new URL(request.url).pathname)))).flat();
  });
  assert.deepEqual(cachedUrls, ["/offline.html"]);

  await context.setOffline(true);
  await page.goto(`${baseUrl}/pwa-offline-check`);
  assert.equal(await page.title(), "LexChain is offline");

  for (const path of ["/api/pwa-check", "/documents/private-id", "/files/private-id"]) {
    let servedOfflinePage = false;
    try {
      await page.goto(`${baseUrl}${path}`);
      servedOfflinePage = (await page.title()) === "LexChain is offline";
    } catch {
      // Excluded navigation is expected to fail while offline.
    }
    assert.equal(servedOfflinePage, false, `${path} must not receive the offline fallback`);
  }

  await context.setOffline(false);
  await page.goto(baseUrl);
  assert.notEqual(await page.title(), "LexChain is offline");
} finally {
  await browser.close();
}
