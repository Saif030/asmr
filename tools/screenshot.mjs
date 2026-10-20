/**
 * Screenshots the app's key screens against the local mock Appwrite.
 * Development fixture only.
 *
 *   node tools/screenshot.mjs http://127.0.0.1:3000 /tmp/shots
 */

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const OUT = process.argv[3] ?? "/tmp/shots";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9333;

mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const edge = spawn(
  EDGE,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${PORT}`,
    "--user-data-dir=/tmp/rea-shot-profile",
    "--window-size=1360,900",
    "about:blank",
  ],
  { detached: true, stdio: "ignore" },
);
edge.unref();

async function waitForCdp() {
  for (let i = 0; i < 60; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (response.ok) return;
    } catch {
      // The browser is not up yet.
    }
    await sleep(500);
  }
  throw new Error("CDP did not start");
}

/** Minimal CDP client over the built-in WebSocket. */
class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(JSON.stringify(message.error)));
        else resolve(message.result);
      }
    });
  }

  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
      ws.addEventListener("open", resolve, { once: true });
      ws.addEventListener("error", reject, { once: true });
    });
    return new Cdp(ws);
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
}

await waitForCdp();

const target = await (
  await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(`${BASE}/login`)}`, {
    method: "PUT",
  })
).json();

const cdp = await Cdp.connect(target.webSocketDebuggerUrl);
await cdp.send("Page.enable");
await cdp.send("Runtime.enable");
await cdp.send("Emulation.setDeviceMetricsOverride", {
  width: Number((process.argv[4] ?? "1360,900").split(",")[0]),
  height: Number((process.argv[4] ?? "1360,900").split(",")[1]),
  deviceScaleFactor: 1,
  mobile: (process.argv[5] ?? "") === "-mobile",
});

// Sign in inside the browser so the session cookie lands on the app origin.
await cdp.send("Runtime.evaluate", {
  expression: `fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'aisha@example.com',password:'password123'})}).then(r=>r.text())`,
  awaitPromise: true,
  returnByValue: true,
});
console.log("signed in");

const pages = [
  ["home", "/home"],
  ["library", "/library"],
  ["chat", "/chat"],
  ["saved", "/saved"],
  ["members", "/members"],
  ["admin", "/admin"],
];

const suffix = process.argv[5] ?? "";

for (const [name, route] of pages) {
  await cdp.send("Page.navigate", { url: `${BASE}${route}` });
  await sleep(3500);
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
  const file = path.join(OUT, `${name}${suffix}.png`);
  writeFileSync(file, Buffer.from(data, "base64"));
  console.log("captured", name, file);
}

await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`);
console.log("done");
process.exit(0);
