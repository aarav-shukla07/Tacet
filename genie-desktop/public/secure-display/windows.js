const { BrowserWindow } = require("electron");
const ffi = require("ffi-napi");

// Bind the Win32 API function
const user32 = ffi.Library("user32", {
  SetWindowDisplayAffinity: ["bool", ["pointer", "uint"]],
});

// Constants
const WDA_NONE = 0x00000000;
const WDA_MONITOR = 0x00000001; // prevent capture in screen recording, RDP, etc.

let protectedWins = new WeakSet();

function protectWindow(win) {
  if (!(win instanceof BrowserWindow)) return;

  try {
    const hwnd = win.getNativeWindowHandle();

    const result = user32.SetWindowDisplayAffinity(hwnd, WDA_MONITOR);
    if (result) {
      console.log("🔒 Windows: capture blocked for this window");
      protectedWins.add(win);
    } else {
      console.error("❌ Windows: SetWindowDisplayAffinity failed");
    }
  } catch (err) {
    console.error("❌ Error calling SetWindowDisplayAffinity:", err);
  }
}

function unprotectWindow(win) {
  if (!(win instanceof BrowserWindow)) return;

  if (protectedWins.has(win)) {
    try {
      const hwnd = win.getNativeWindowHandle();

      const result = user32.SetWindowDisplayAffinity(hwnd, WDA_NONE);
      if (result) {
        console.log("🔓 Windows: capture unblocked for this window");
        protectedWins.delete(win);
      } else {
        console.error("❌ Windows: failed to remove capture block");
      }
    } catch (err) {
      console.error("❌ Error calling SetWindowDisplayAffinity:", err);
    }
  }
}

module.exports = {
  protectWindow,
  unprotectWindow,
};
