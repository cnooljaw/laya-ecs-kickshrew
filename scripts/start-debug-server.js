const fs = require("fs");
const http = require("http");
const path = require("path");
const { execFileSync, spawn } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const binDir = path.join(rootDir, "bin");
const logDir = path.join(rootDir, "bin", "js", "debug");
const logPath = path.join(logDir, "http-server.log");
const host = "127.0.0.1";
const port = 8080;
const debugPath = "/debug-tsc.html";

function requestDebugPage() {
  return new Promise((resolve) => {
    const req = http.get({ host, port, path: debugPath, timeout: 500 }, (res) => {
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
  try {
    execFileSync("lsof", ["-iTCP:8080", "-sTCP:LISTEN", "-n", "-P"], {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
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
  if (await requestDebugPage()) {
    console.log(`Debug server already ready: http://localhost:${port}${debugPath}`);
    return;
  }

  if (isPortListening()) {
    console.log(`Port ${port} is already listening. Use http://localhost:${port}${debugPath}`);
    return;
  }

  fs.mkdirSync(logDir, { recursive: true });
  const logFd = fs.openSync(logPath, "a");
  const child = spawn("python3", ["-m", "http.server", String(port), "--bind", host], {
    cwd: binDir,
    detached: true,
    stdio: ["ignore", logFd, logFd],
  });

  child.unref();

  if (!(await waitForServer(5000)) && !isPortListening()) {
    console.error(`Failed to start debug server. Check ${logPath}`);
    process.exit(1);
  }

  console.log(`Debug server ready: http://localhost:${port}${debugPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
