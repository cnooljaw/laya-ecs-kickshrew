const fs = require("fs");
const http = require("http");
const path = require("path");
const { execFileSync, spawn } = require("child_process");
const {
  DEBUG_SERVER_HOST,
  DEBUG_SERVER_LOCAL_CHECK_HOST,
  DEBUG_SERVER_PORT,
  DEBUG_SERVER_PATH,
  getLanDebugUrls,
  isLanReadyListenAddress,
} = require("./debug-server-config.cjs");

const rootDir = path.resolve(__dirname, "..");
const binDir = path.join(rootDir, "bin");
const logDir = path.join(rootDir, "bin", "js", "debug");
const logPath = path.join(logDir, "http-server.log");
const host = DEBUG_SERVER_HOST;
const localCheckHost = DEBUG_SERVER_LOCAL_CHECK_HOST;
const port = DEBUG_SERVER_PORT;
const debugPath = DEBUG_SERVER_PATH;

function requestDebugPage() {
  return new Promise((resolve) => {
    const req = http.get({ host: localCheckHost, port, path: debugPath, timeout: 500 }, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });

    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.on("error", () => resolve(false));
  });
}

function isPortListening() {
  return getPortListenAddresses().length > 0;
}

function getPortListenAddresses() {
  try {
    const output = execFileSync("lsof", [`-iTCP:${port}`, "-sTCP:LISTEN", "-n", "-P"], {
      encoding: "utf8",
    });
    return output
      .split("\n")
      .slice(1)
      .map((line) => line.match(/\sTCP\s+(\S+)\s+\(LISTEN\)/)?.[1])
      .filter(Boolean);
  } catch {
    return [];
  }
}

function isPortLanReady() {
  return getPortListenAddresses().some((address) => isLanReadyListenAddress(address));
}

function printReady(prefix) {
  console.log(`${prefix}: http://localhost:${port}${debugPath}`);
  for (const url of getLanDebugUrls(debugPath)) {
    console.log(`LAN: ${url}`);
  }
}

async function waitForServer(timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await requestDebugPage()) return true;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return false;
}

async function main() {
  if ((await requestDebugPage()) && isPortLanReady()) {
    printReady("Debug server already ready");
    return;
  }

  if (isPortListening()) {
    const addresses = getPortListenAddresses().join(", ") || "unknown address";
    console.error(
      `Port ${port} is already listening on ${addresses}, but it is not LAN-ready. ` +
      `Stop that server and rerun npm run debug:ready.`,
    );
    process.exit(1);
  }

  fs.mkdirSync(logDir, { recursive: true });
  const logFd = fs.openSync(logPath, "a");
  const child = spawn("python3", ["-m", "http.server", String(port), "--bind", host], {
    cwd: binDir,
    detached: true,
    stdio: ["ignore", logFd, logFd],
  });

  child.unref();

  if (!(await waitForServer(5000)) || !isPortLanReady()) {
    console.error(`Failed to start debug server. Check ${logPath}`);
    process.exit(1);
  }

  printReady("Debug server ready");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
