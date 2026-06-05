const os = require("os");

const DEBUG_SERVER_HOST = "0.0.0.0";
const DEBUG_SERVER_LOCAL_CHECK_HOST = "127.0.0.1";
const DEBUG_SERVER_PORT = 8080;
const DEBUG_SERVER_PATH = "/debug-tsc.html";

function isLanReadyListenAddress(address) {
  return (
    address === `*:${DEBUG_SERVER_PORT}` ||
    address === `${DEBUG_SERVER_HOST}:${DEBUG_SERVER_PORT}` ||
    address === `[::]:${DEBUG_SERVER_PORT}` ||
    address === `:::${DEBUG_SERVER_PORT}`
  );
}

function getLanDebugUrls(debugPath = DEBUG_SERVER_PATH) {
  const urls = [];
  const interfaces = os.networkInterfaces();
  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses || []) {
      if (address.family === "IPv4" && !address.internal) {
        urls.push(`http://${address.address}:${DEBUG_SERVER_PORT}${debugPath}`);
      }
    }
  }
  return urls;
}

module.exports = {
  DEBUG_SERVER_HOST,
  DEBUG_SERVER_LOCAL_CHECK_HOST,
  DEBUG_SERVER_PORT,
  DEBUG_SERVER_PATH,
  getLanDebugUrls,
  isLanReadyListenAddress,
};
