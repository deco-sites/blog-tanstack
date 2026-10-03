#!/usr/bin/env node
// Parity harness: deterministic visual + snapshot baseline for blog-tanstack.
//
//   node parity/run.mjs record  [--target URL]            -> writes parity/baseline/
//   node parity/run.mjs compare [--target URL] [--out DIR] -> writes DIR (default parity/results/<ts>/), exit 1 on any diff
//
// Common flags: --only <substring>  (filter entries by id)   --viewport mobile|desktop
//
// See parity/README.md for the design and the normalization rules.
import { chromium } from "playwright";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import fs from "node:fs";
import os from "node:os";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST = JSON.parse(fs.readFileSync(path.join(HERE, "pages.json"), "utf8"));
const BASELINE = path.join(HERE, "baseline");

// ---------- args ----------
const argv = process.argv.slice(2);
const mode = argv[0];
if (mode !== "record" && mode !== "compare") {
  console.error("usage: node parity/run.mjs record|compare [--target URL] [--out DIR] [--only ID] [--viewport NAME]");
  process.exit(2);
}
const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i > 0 ? argv[i + 1] : undefined;
};
const target = (flag("target") ?? process.env.PARITY_TARGET ?? MANIFEST.baseUrl).replace(/\/$/, "");
const only = flag("only");
// Harness-managed server (default when pages.json has `server`): restarted before
// every page/flow so no server-side state leaks between entries. Against a single
// long-lived server, today's post page showed its reading-progress bar in some runs
// and not in others (likely request-order-dependent server state: BlogHeader is a
// `layout` section, and @decocms/start caches resolved layout sections for 5 minutes
// per section type). A fresh server per entry makes runs identical.
const serveCmd = flag("serve-cmd") ?? process.env.PARITY_SERVE_CMD ?? MANIFEST.server?.command;
const manageServer = !argv.includes("--no-serve") && !!serveCmd;
const onlyViewport = flag("viewport");
// record = two passes: "har" (live upstream, records the HAR; captures discarded)
// then "baseline" (replays the HAR exactly like compare does, writes parity/baseline/).
// The baseline is therefore produced by the very same code path as compare.
let pass = mode === "record" ? "har" : "compare";
let outDir =
  mode === "record"
    ? BASELINE
    : path.resolve(flag("out") ?? path.join(HERE, "results", new Date().toISOString().replace(/[:.]/g, "-")));

// ---------- determinism ----------
// Requests to anything but the target origin are served from the HAR fixture
// (recorded once in `record`). Requests to the site under test always go live.
const targetOrigin = new URL(target).origin;
const isExternal = (url) => {
  try {
    return new URL(url).origin !== targetOrigin && /^https?:$/.test(new URL(url).protocol);
  } catch {
    return false;
  }
};

const FREEZE_CSS = `
*, *::before, *::after {
  animation-duration: 0s !important;
  animation-delay: 0s !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0s !important;
  transition-delay: 0s !important;
  caret-color: transparent !important;
}
html, body { scroll-behavior: auto !important; }
`;

// Seeded Math.random (mulberry32) + CSS freeze injected as early as possible.
const initScript = ({ seed, css }) => {
  let a = seed >>> 0;
  Math.random = function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // Constructable stylesheet instead of a <style> element: an extra DOM node
  // inside <html>/<head> makes React's hydration of the document mismatch and
  // re-render client-side, which changes what the page shows.
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
};

// Two animation frames, bounded: headless Chromium can stop producing frames
// (rAF never fires), which would otherwise hang the run forever.
const raf2 = (page) =>
  page.evaluate(
    () =>
      new Promise((r) => {
        const t = setTimeout(() => r("timeout"), 1000);
        requestAnimationFrame(() => requestAnimationFrame(() => (clearTimeout(t), r("raf"))));
      }),
  );

// Hard watchdog per page/flow: a hung capture is retried once from scratch.
const ENTRY_TIMEOUT_MS = 180000;
async function withRetry(context, label, fn) {
  for (let attempt = 1; ; attempt++) {
    let timer;
    try {
      return await Promise.race([
        fn(),
        new Promise((_, rej) => (timer = setTimeout(() => rej(new Error(`watchdog: ${label} exceeded ${ENTRY_TIMEOUT_MS}ms`)), ENTRY_TIMEOUT_MS))),
      ]);
    } catch (e) {
      if (!/watchdog/.test(String(e))) throw e;
      await Promise.all(context.pages().map((p) => p.close().catch(() => {})));
      if (attempt >= 2) throw e;
      process.stdout.write("(retry) ");
    } finally {
      clearTimeout(timer);
    }
  }
}

async function networkIdle(page) {
  try {
    await page.waitForLoadState("networkidle", { timeout: 15000 });
  } catch {
    /* long-polling etc. — fall through, image/font waits below still apply */
  }
}

async function waitAssets(page) {
  await networkIdle(page);
  // stylesheets (incl. media=print swap pattern) -> fonts -> images
  await page.evaluate(async () => {
    const links = [...document.querySelectorAll('link[rel="stylesheet"]')];
    await Promise.all(
      links.map((l) =>
        l.sheet
          ? null
          : new Promise((r) => {
              l.addEventListener("load", r, { once: true });
              l.addEventListener("error", r, { once: true });
              setTimeout(r, 5000);
            }),
      ),
    );
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 10000))]);
  });
  await networkIdle(page);
  await page.evaluate(async () => {
    await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 10000))]);
    const imgs = [...document.images];
    await Promise.all(
      imgs.map(async (img) => {
        if (!img.complete) {
          await new Promise((r) => {
            img.addEventListener("load", r, { once: true });
            img.addEventListener("error", r, { once: true });
            setTimeout(r, 10000);
          });
        }
        try {
          await Promise.race([img.decode(), new Promise((r) => setTimeout(r, 5000))]);
        } catch {
          /* broken image renders as broken — that is part of the baseline */
        }
      }),
    );
  });
}

// Scroll through the whole page once so IntersectionObserver reveals and lazy
// images fire exactly as for a reader, then return to the top.
async function scrollThrough(page) {
  const { h, vh } = await page.evaluate(() => ({
    h: document.documentElement.scrollHeight,
    vh: window.innerHeight,
  }));
  const step = Math.max(200, Math.floor(vh * 0.75));
  for (let y = 0; y <= h; y += step) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await raf2(page);
    await page.waitForTimeout(60);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await raf2(page);
  await page.waitForTimeout(100);
  await page.evaluate(() => window.scrollTo(0, 0));
  await raf2(page);
  await page.waitForTimeout(200);
}

const DEBUG = !!process.env.PARITY_DEBUG;
const dbg = (...a) => DEBUG && console.log("  [dbg]", ...a);
async function settle(page) {
  dbg("settle: assets");
  await waitAssets(page);
  dbg("settle: scroll");
  await scrollThrough(page);
  dbg("settle: assets2");
  await waitAssets(page);
  dbg("settle: done");
  await raf2(page);
  await page.waitForTimeout(150);
}

async function shoot(page, file, fullPage) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await raf2(page);
  await page.screenshot({ path: file, fullPage, animations: "disabled", caret: "hide", scale: "css" });
}

// ---------- normalization ----------
function todayStrings() {
  const out = new Set();
  for (const d of [-1, 0, 1]) out.add(new Date(Date.now() + d * 86400000).toISOString().slice(0, 10));
  return [...out];
}
function normalizeText(s, origin) {
  const host = new URL(origin).host;
  let out = s
    .split(origin).join("{ORIGIN}")
    .split(encodeURIComponent(origin)).join("{ORIGIN_ENC}")
    .split(`//${host}`).join("//{HOST}");
  // Server-clock dates (e.g. sitemap <lastmod> = "now"). Content dates are left untouched.
  for (const d of todayStrings()) out = out.split(d).join("{SERVER_TODAY}");
  return out;
}
const normalizeJson = (v, origin) => JSON.parse(normalizeText(JSON.stringify(v), origin));

// SEO <head> + JSON-LD + link inventory, extracted from a Document.
// Hashed build assets (/assets/*) are excluded: they legitimately change per build.
const EXTRACT = () => {
  const extract = (doc) => {
    const attrs = (el) => Object.fromEntries([...el.attributes].map((a) => [a.name, a.value]));
    const head = doc.head;
    const meta = [...head.querySelectorAll("meta")].map(attrs);
    const links = [...head.querySelectorAll("link")]
      .map(attrs)
      .filter((l) => !/^\/assets\//.test(l.href || "") && !/modulepreload/.test(l.rel || ""));
    const jsonLd = [...doc.querySelectorAll('script[type="application/ld+json"]')].map((s) => {
      try {
        return JSON.parse(s.textContent);
      } catch {
        return { __unparseable: s.textContent };
      }
    });
    return {
      htmlLang: doc.documentElement.getAttribute("lang"),
      htmlDataTheme: doc.documentElement.getAttribute("data-theme"),
      title: doc.title,
      meta,
      links,
      jsonLd,
    };
  };
  return extract;
};

async function headSnapshot(page, ssrHtml) {
  return page.evaluate(
    ({ src, ssrHtml }) => {
      const extract = eval(src)();
      const dom = extract(document);
      const anchors = [...document.querySelectorAll("a[href]")].map((a) => ({
        href: a.getAttribute("href"),
        text: a.textContent.replace(/\s+/g, " ").trim().slice(0, 120),
        rel: a.getAttribute("rel") || undefined,
        target: a.getAttribute("target") || undefined,
      }));
      const out = { dom, anchors };
      if (ssrHtml != null) out.ssr = extract(new DOMParser().parseFromString(ssrHtml, "text/html"));
      return out;
    },
    { src: `(${EXTRACT.toString()})`, ssrHtml },
  );
}

let server = null;
async function stopServer() {
  if (!server) return;
  const p = server;
  server = null;
  try {
    process.kill(-p.pid, "SIGTERM");
  } catch {}
  await new Promise((r) => {
    const t = setTimeout(() => {
      try {
        process.kill(-p.pid, "SIGKILL");
      } catch {}
      r();
    }, 5000);
    p.once("exit", () => (clearTimeout(t), r()));
  });
}
async function isUp() {
  try {
    const r = await fetch(target + (MANIFEST.server?.readyPath ?? "/"), { signal: AbortSignal.timeout(5000) });
    await r.arrayBuffer();
    return r.status < 500;
  } catch {
    return false;
  }
}
async function startServer() {
  await stopServer();
  // wait for the port to be released
  for (let i = 0; i < 50 && (await isUp()); i++) await new Promise((r) => setTimeout(r, 200));
  server = spawn("/bin/sh", ["-c", serveCmd], {
    cwd: path.join(HERE, ".."),
    detached: true,
    stdio: ["ignore", "ignore", process.env.PARITY_DEBUG ? "inherit" : "ignore"],
  });
  for (let i = 0; i < 300; i++) {
    if (await isUp()) return;
    if (server.exitCode != null) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`server did not come up: ${serveCmd}`);
}
const freshServer = async () => {
  if (manageServer) await startServer();
};
for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(sig, () => {
    if (server) {
      try {
        process.kill(-server.pid, "SIGKILL");
      } catch {}
    }
    process.exit(130);
  });
}

// Retry navigation while the server under test is (re)starting.
async function gotoRetry(page, url) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await page.goto(url, { waitUntil: "load", timeout: 60000 });
    } catch (e) {
      if (attempt >= 30 || !/ERR_CONNECTION_REFUSED|ERR_CONNECTION_RESET|ERR_EMPTY_RESPONSE/.test(String(e))) throw e;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

// ---------- comparison ----------
const results = [];
const harMisses = [];
let currentEntry = null;
const entryFailures = (vp, id) =>
  [...new Set(harMisses.filter((h) => h.viewport === vp && h.entry === id).map((h) => `${h.error} ${h.url}`))].sort();

function comparePng(rel, actualFile) {
  const baseFile = path.join(BASELINE, rel);
  if (!fs.existsSync(baseFile)) return { rel, kind: "png", ok: false, reason: "missing in baseline" };
  const a = PNG.sync.read(fs.readFileSync(baseFile));
  const b = PNG.sync.read(fs.readFileSync(actualFile));
  const w = Math.max(a.width, b.width);
  const h = Math.max(a.height, b.height);
  const pad = (img) => {
    if (img.width === w && img.height === h) return img;
    const p = new PNG({ width: w, height: h });
    p.data.fill(0);
    PNG.bitblt(img, p, 0, 0, img.width, img.height, 0, 0);
    return p;
  };
  const A = pad(a);
  const B = pad(b);
  const diff = new PNG({ width: w, height: h });
  const n = pixelmatch(A.data, B.data, diff.data, w, h, { threshold: 0, includeAA: true });
  const sizeMismatch = a.width !== b.width || a.height !== b.height;
  const ok = n === 0 && !sizeMismatch;
  if (!ok) {
    const df = path.join(outDir, "diff", rel);
    fs.mkdirSync(path.dirname(df), { recursive: true });
    fs.writeFileSync(df, PNG.sync.write(diff));
  }
  return {
    rel,
    kind: "png",
    ok,
    diffPixels: n,
    baseline: `${a.width}x${a.height}`,
    actual: `${b.width}x${b.height}`,
    ...(sizeMismatch ? { reason: "size mismatch" } : {}),
  };
}

function firstDiffLines(a, b, max = 12) {
  const A = a.split("\n");
  const B = b.split("\n");
  const out = [];
  for (let i = 0; i < Math.max(A.length, B.length) && out.length < max; i++) {
    if (A[i] !== B[i]) out.push(`L${i + 1}\n  - ${A[i] ?? "<eof>"}\n  + ${B[i] ?? "<eof>"}`);
  }
  return out;
}

function compareText(rel, actualFile) {
  const baseFile = path.join(BASELINE, rel);
  if (!fs.existsSync(baseFile)) return { rel, kind: "snapshot", ok: false, reason: "missing in baseline" };
  const a = fs.readFileSync(baseFile, "utf8");
  const b = fs.readFileSync(actualFile, "utf8");
  return a === b ? { rel, kind: "snapshot", ok: true } : { rel, kind: "snapshot", ok: false, diff: firstDiffLines(a, b) };
}

function emitPng(rel, tmpFile) {
  if (pass === "compare") results.push(comparePng(rel, tmpFile));
  else results.push({ rel, kind: "png", ok: true });
}
function emitJson(rel, value) {
  const file = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(normalizeJson(value, target), null, 2)}\n`);
  if (pass === "compare") results.push(compareText(rel, file));
  else results.push({ rel, kind: "snapshot", ok: true });
}
function emitRaw(rel, text) {
  const file = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, normalizeText(text, target));
  if (pass === "compare") results.push(compareText(rel, file));
  else results.push({ rel, kind: "snapshot", ok: true });
}

// ---------- runners ----------
const pick = (headers) => {
  const keep = ["content-type", "cache-control", "location", "x-robots-tag", "content-language", "link", "vary"];
  return Object.fromEntries(keep.filter((k) => headers[k] != null).map((k) => [k, headers[k]]));
};

async function newPage(context, vpName) {
  const page = await context.newPage();
  await page.clock.setFixedTime(new Date(MANIFEST.clock));
  page.on("requestfailed", (req) => {
    const u = req.url();
    if (isExternal(u) && !isBlocked(u)) harMisses.push({ viewport: vpName, entry: currentEntry, url: u, error: req.failure()?.errorText });
  });
  return page;
}
async function closePage(page) {
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch {}
  await page.context().clearCookies();
  await page.close();
}

const blockRes = (MANIFEST.block ?? []).map(
  (g) => new RegExp(`^${g.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "\u0000").replace(/\*/g, "[^/]*").replace(/\u0000/g, ".*")}$`),
);
const isBlocked = (u) => blockRes.some((r) => r.test(u));

async function runPage(context, vp, entry) {
  currentEntry = entry.id;
  const page = await newPage(context, vp);
  try {
    const resp = await gotoRetry(page, target + entry.path);
    dbg("goto done");
    const ssrHtml = resp ? await resp.text() : null;
    dbg("ssr text");
    await settle(page);
    const shot = path.join(outDir, "screens", `${entry.id}.${vp}.png`);
    await shoot(page, shot, entry.fullPage !== false);
    emitPng(path.relative(outDir, shot), shot);
    const snap = await headSnapshot(page, ssrHtml);
    emitJson(path.join("snapshots", `${entry.id}.${vp}.json`), {
      path: entry.path,
      status: resp?.status(),
      headers: resp ? pick(resp.headers()) : null,
      finalUrl: page.url(),
      // Failed external requests (HAR misses in compare; genuinely broken
      // upstream assets such as 404 images in record) are part of the baseline.
      externalFailures: entryFailures(vp, entry.id),
      ...snap,
    });
  } finally {
    await closePage(page);
  }
}

async function runFlow(context, vp, flow) {
  currentEntry = `flow:${flow.id}`;
  const page = await newPage(context, vp);
  const root = outDir;
  try {
    await gotoRetry(page, target + flow.start);
    await settle(page);
    let n = 0;
    for (const step of flow.steps) {
      n++;
      const loc = () => page.locator(step.selector).filter({ visible: true }).first();
      switch (step.action) {
        case "click":
          await loc().click();
          break;
        case "type":
          await loc().pressSequentially(step.text);
          break;
        case "press":
          await loc().press(step.key);
          break;
        case "keyboard":
          await page.keyboard.press(step.key);
          break;
        case "waitFor":
          await page.locator(step.selector).first().waitFor({ state: "visible", timeout: 15000 });
          break;
        case "waitForURL":
          await page.waitForURL(step.pattern, { timeout: 30000 });
          break;
        case "wait":
          await page.waitForTimeout(step.ms);
          break;
        case "settle":
          await settle(page);
          break;
        case "scrollTo":
          // Resolve on the resulting scroll event (or immediately if already there),
          // so scroll listeners have run before the screenshot.
          await page.evaluate(
            (f) =>
              new Promise((r) => {
                const y = Math.round((document.documentElement.scrollHeight - window.innerHeight) * f);
                if (Math.round(window.scrollY) === y) return r();
                const t = setTimeout(r, 3000);
                window.addEventListener("scroll", () => (clearTimeout(t), setTimeout(r, 0)), { once: true });
                window.scrollTo(0, y);
              }),
            step.fraction,
          );
          await raf2(page);
          await page.waitForTimeout(250);
          await waitAssets(page);
          break;
        case "screenshot": {
          const f = path.join(root, "flows", flow.id, `${String(n).padStart(2, "0")}-${step.name}.${vp}.png`);
          await shoot(page, f, !!step.fullPage);
          emitPng(path.relative(root, f), f);
          break;
        }
        case "url":
          emitJson(path.join("flows", flow.id, `${String(n).padStart(2, "0")}-${step.name}.${vp}.url.json`), {
            url: page.url(),
            scrollY: await page.evaluate(() => Math.round(window.scrollY)),
          });
          break;
        case "head":
          emitJson(
            path.join("flows", flow.id, `${String(n).padStart(2, "0")}-${step.name}.${vp}.head.json`),
            (await headSnapshot(page, null)).dom,
          );
          break;
        default:
          throw new Error(`unknown action ${step.action}`);
      }
    }
    emitJson(path.join("flows", flow.id, `external-failures.${vp}.json`), entryFailures(vp, `flow:${flow.id}`));
  } finally {
    await closePage(page);
  }
}

async function runText(context, entry) {
  let res;
  for (let attempt = 0; ; attempt++) {
    try {
      res = await context.request.get(target + entry.path, { maxRedirects: 0 });
      break;
    } catch (e) {
      if (attempt >= 30 || !/ECONNREFUSED|ECONNRESET/.test(String(e))) throw e;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  const ct = res.headers()["content-type"] ?? "";
  const isHtml = ct.includes("text/html");
  const body = await res.text();
  emitRaw(
    path.join("text", `${entry.id}.txt`),
    `# GET ${entry.path}\n# status: ${res.status()}\n# headers: ${JSON.stringify(pick(res.headers()))}\n\n` +
      (isHtml ? `<html body omitted: ${entry.note ?? "html"}; covered by page snapshots>\n` : body),
  );
}

// ---------- main ----------
// Plain-JSON HAR (+ attached bodies next to it) so it can be post-processed and diffed.
const harPathFor = (vp) => path.join(BASELINE, "har", vp, `${vp}.har`);
// Requests that failed during record (aborted broken images, cancelled loads) are
// stored by Playwright as status -1 entries; replaying those leaves the request
// pending forever. Drop them so compare treats them as misses (abort -> net::ERR_FAILED),
// identical to how record aborted them.
function pruneHar(vp) {
  const file = harPathFor(vp);
  if (!fs.existsSync(file)) return;
  const har = JSON.parse(fs.readFileSync(file, "utf8"));
  const before = har.log.entries.length;
  har.log.entries = har.log.entries.filter((e) => (e.response?.status ?? 0) > 0);
  fs.writeFileSync(file, JSON.stringify(har, null, 1));
  console.log(`[${vp}] HAR: ${har.log.entries.length} entries (${before - har.log.entries.length} failed entries pruned)`);
}

const LAUNCH_ARGS = ["--font-render-hinting=none", "--disable-skia-runtime-opts", "--disable-lcd-text", "--force-color-profile=srgb", "--hide-scrollbars"];
const launchBrowser = () =>
  chromium.launch({ args: LAUNCH_ARGS, ...(process.env.PARITY_CHROMIUM_PATH ? { executablePath: process.env.PARITY_CHROMIUM_PATH } : {}) });
const isCrash = (e) => /Target page, context or browser has been closed|Browser closed|browser has disconnected|Target crashed/i.test(String(e?.message ?? e));

let chromiumVersion;
async function runPass() {
  fs.mkdirSync(outDir, { recursive: true });
  let browser = await launchBrowser();
  chromiumVersion = browser.version();
  const match = (id) => !only || id.includes(only);
  const vps = Object.keys(MANIFEST.viewports).filter((v) => !onlyViewport || v === onlyViewport);

  async function makeContext(vp) {
    if (!browser.isConnected()) browser = await launchBrowser();
    const harPath = harPathFor(vp);
    fs.mkdirSync(path.dirname(harPath), { recursive: true });
    const { width, height, ...device } = MANIFEST.viewports[vp];
    const context = await browser.newContext({
      viewport: { width, height },
      ...device,
      locale: MANIFEST.locale,
      timezoneId: MANIFEST.timezoneId,
      colorScheme: "light",
      reducedMotion: "no-preference",
      serviceWorkers: "block",
    });
    await context.addInitScript(initScript, { seed: MANIFEST.randomSeed, css: FREEZE_CSS });
    if (pass !== "har" && !fs.existsSync(harPath)) throw new Error(`missing HAR fixture ${harPath}; run parity:record first`);
    const esc = targetOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await context.routeFromHAR(harPath, {
      url: new RegExp(`^(?!${esc}[/?#]|${esc}$)https?://`),
      update: pass === "har",
      updateContent: "attach",
      updateMode: "minimal",
      notFound: "abort",
    });
    if (pass === "har") {
      // Upstream images that fail (e.g. Unsplash 404 -> text/html, which Chromium
      // blocks via ORB) are NOT stored in the HAR: replaying such an entry leaves
      // the <img> pending forever instead of erroring, which is nondeterministic.
      // Aborting them here makes record behave exactly like a HAR miss in compare
      // (net::ERR_FAILED -> broken image with alt text) in both modes.
      await context.route(
        (u) => isExternal(u.toString()),
        async (route) => {
          if (route.request().resourceType() !== "image") return route.fallback();
          let ok = false;
          try {
            const r = await route.fetch();
            ok = r.ok() && /^image\//.test(r.headers()["content-type"] ?? "");
          } catch {}
          return ok ? route.fallback() : route.abort("failed");
        },
      );
    }
    // Registered last => matched first: analytics/beacons never leave the browser.
    await context.route((u) => isBlocked(u.toString()), (r) => r.abort());
    return context;
  }

  try {
    for (const vp of vps) {
      let context = await makeContext(vp);
      // If the browser process dies mid-run (crash, or an external kill), compare
      // mode relaunches it and retries the entry. Record mode cannot: the HAR
      // being written lives in the dead context, so it fails loudly instead.
      const attempt = async (label, fn) => {
        for (let i = 0; ; i++) {
          try {
            await freshServer();
            return await withRetry(context, label, () => fn(context));
          } catch (e) {
            if (pass === "har" || i >= 3 || !isCrash(e)) throw e;
            process.stdout.write("(browser lost, relaunching) ");
            await context.close().catch(() => {});
            context = await makeContext(vp);
          }
        }
      };

      for (const entry of MANIFEST.pages) {
        if (!match(entry.id) || !(entry.viewports ?? MANIFEST.defaultViewports).includes(vp)) continue;
        process.stdout.write(`[${vp}] page ${entry.id} ... `);
        try {
          await attempt(entry.id, (ctx) => runPage(ctx, vp, entry));
          console.log("ok");
        } catch (e) {
          console.log(`ERROR ${String(e?.message ?? e).split("\n")[0]}`);
          results.push({ rel: `screens/${entry.id}.${vp}.png`, kind: "error", ok: false, reason: String(e?.message ?? e) });
        }
      }
      for (const flow of MANIFEST.flows) {
        if (!match(flow.id) || !(flow.viewports ?? MANIFEST.defaultViewports).includes(vp)) continue;
        process.stdout.write(`[${vp}] flow ${flow.id} ... `);
        try {
          await attempt(flow.id, (ctx) => runFlow(ctx, vp, flow));
          console.log("ok");
        } catch (e) {
          console.log(`ERROR ${String(e?.message ?? e).split("\n")[0]}`);
          results.push({ rel: `flows/${flow.id}.${vp}`, kind: "error", ok: false, reason: String(e?.message ?? e) });
        }
      }
      if (vp === vps[vps.length - 1]) {
        for (const t of MANIFEST.text ?? []) {
          if (!match(t.id)) continue;
          try {
            await attempt(t.id, (ctx) => runText(ctx, t));
          } catch (e) {
            results.push({ rel: `text/${t.id}.txt`, kind: "error", ok: false, reason: String(e?.message ?? e) });
          }
        }
      }
      await context.close(); // flushes the HAR in record mode
      if (pass === "har") pruneHar(vp);
    }
  } finally {
    await browser.close().catch(() => {});
  }
}

async function main() {
  const started = Date.now();
  if (manageServer) console.log(`server: fresh \`${serveCmd}\` per entry`);
  else if (!(await isUp())) throw new Error(`nothing is serving ${target}; start it (bun run parity:serve) or configure server.command`);
  if (mode === "record") {
    if (!only && !onlyViewport) {
      for (const d of ["screens", "snapshots", "flows", "text", "har"]) fs.rmSync(path.join(BASELINE, d), { recursive: true, force: true });
    }
    console.log("== pass 1/2: recording upstream HAR (live network) ==");
    outDir = fs.mkdtempSync(path.join(os.tmpdir(), "parity-har-pass-"));
    await runPass();
    const harErrors = results.filter((r) => !r.ok);
    if (harErrors.length) {
      console.error(`HAR pass had ${harErrors.length} errors; aborting`, harErrors);
      process.exit(1);
    }
    fs.rmSync(outDir, { recursive: true, force: true });
    results.length = 0;
    harMisses.length = 0;
    console.log("== pass 2/2: capturing baseline from the HAR (same path as compare) ==");
    pass = "baseline";
    outDir = BASELINE;
  }
  await runPass();

  const failed = results.filter((r) => !r.ok);
  const summary = {
    mode,
    target,
    startedAt: new Date(started).toISOString(),
    durationSec: Math.round((Date.now() - started) / 1000),
    totals: {
      checks: results.length,
      screenshots: results.filter((r) => r.kind === "png").length,
      snapshots: results.filter((r) => r.kind === "snapshot").length,
      failed: failed.length,
      failedExternalRequests: harMisses.length,
    },
    failed,
  };
  if (mode === "compare") {
    fs.writeFileSync(path.join(outDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    const md = [
      `# Parity compare: ${failed.length === 0 ? "PASS" : "FAIL"}`,
      "",
      `target: ${target}`,
      `checks: ${results.length} (screenshots ${summary.totals.screenshots}, snapshots ${summary.totals.snapshots})`,
      `failed: ${failed.length} (failed external requests, incl. HAR misses, are diffed via externalFailures in each snapshot)`,
      "",
      ...failed.map(
        (f) =>
          `- **${f.rel}** (${f.kind}) ${f.reason ?? ""}${f.diffPixels != null ? ` diffPixels=${f.diffPixels} baseline=${f.baseline} actual=${f.actual}` : ""}${f.diff ? `\n\n\`\`\`\n${f.diff.join("\n")}\n\`\`\`` : ""}`,
      ),
      "",
    ].join("\n");
    fs.writeFileSync(path.join(outDir, "summary.md"), md);
    console.log(`\n${md}\nresults: ${outDir}`);
    process.exit(failed.length === 0 ? 0 : 1);
  } else {
    fs.writeFileSync(
      path.join(BASELINE, "meta.json"),
      `${JSON.stringify(
        {
          recordedAgainst: "{ORIGIN} (vite preview of `bun run build`)",
          playwright: JSON.parse(fs.readFileSync(path.join(HERE, "..", "node_modules", "playwright", "package.json"), "utf8")).version,
          chromium: chromiumVersion,
          totals: summary.totals,
          errors: failed,
          failedExternalRequests: [...new Set(harMisses.map((h) => `${h.error} ${h.url}`))].sort(),
        },
        null,
        2,
      )}\n`,
    );
    console.log(`\nrecorded ${results.length} checks into ${BASELINE} (${failed.length} errors, ${harMisses.length} failed external requests)`);
    process.exit(failed.length === 0 ? 0 : 1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 2;
  })
  .finally(() => stopServer());
process.on("exit", () => {
  if (server) {
    try {
      process.kill(-server.pid, "SIGKILL");
    } catch {}
  }
});
