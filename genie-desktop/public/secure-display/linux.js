const { BrowserWindow } = require("electron");
const dbus = require("dbus-next");

let protectedWins = new WeakSet();
let cookies = new Map();

async function requestInhibit(win) {
  try {
    const bus = dbus.sessionBus();

    const proxyObj = await bus.getProxyObject(
      "org.freedesktop.portal.Desktop",
      "/org/freedesktop/portal/desktop"
    );

    const inhibitIface = proxyObj.getInterface("org.freedesktop.portal.Inhibit");

    const appId = "com.example.secureapp"; // your app ID
    const flags = 4; // 4 = inhibit screen-sharing
    const options = {
      reason: new dbus.Variant("s", "Secure window — prevent capture")
    };

    // Only 3 args here: (s, u, a{sv})
    const cookie = await inhibitIface.Inhibit(appId, flags, options);
    console.log("🔒 Wayland: capture inhibited, cookie =", cookie);

    cookies.set(win, cookie);
    return true;
  } catch (err) {
    console.error("❌ Failed to inhibit capture on Wayland:", err);
    return false;
  }
}

module.exports = {
  async protectWindow(win) {
    if (!(win instanceof BrowserWindow)) return;

    const displayServer = process.env.XDG_SESSION_TYPE || "unknown";

    if (displayServer === "wayland") {
      console.log("👉 Trying Wayland inhibit API...");

      const ok = await requestInhibit(win);
      if (ok) {
        // Give compositor a moment, then check fallback
        setTimeout(() => {
          // ⚠️ There’s no direct way to “check” if Meet still shows it.
          // For now, always apply fallback as well:
          console.log("⚠️ Applying fallback overlay for reliability.");
          win.setOpacity(0.0);
        }, 1000);
      } else {
        console.log("⚠️ Inhibit failed — falling back immediately.");
        win.setOpacity(0.0);
      }

      protectedWins.add(win);
    } else if (displayServer === "x11") {
      console.log("⚠️ X11: cannot block capture, using opacity fallback.");
      win.setOpacity(0.0);
      protectedWins.add(win);
    } else {
      console.log("⚠️ Unknown Linux display server:", displayServer);
      win.setOpacity(0.0);
      protectedWins.add(win);
    }
  },

  unprotectWindow(win) {
    if (!(win instanceof BrowserWindow)) return;

    if (protectedWins.has(win)) {
      win.setOpacity(1.0); // restore visibility

      // TODO: call Uninhibit(cookie) if compositor supported it
      if (cookies.has(win)) {
        console.log("🔓 Would release cookie:", cookies.get(win));
        // not implemented yet
        cookies.delete(win);
      }

      protectedWins.delete(win);
    }
  }
};
