const os = require("os");

let adapter;

switch (os.platform()) {
  case "win32":
    adapter = require("./windows");
    break;
  case "darwin":
    adapter = require("./mac");
    break;
  case "linux":
    adapter = require("./linux");
    break;
  default:
    adapter = {
      protectWindow: () => console.warn("Secure display not supported on this OS"),
      unprotectWindow: () => {}
    };
}

module.exports = adapter;
