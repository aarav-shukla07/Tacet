const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

// --- CHANGE START ---
// Import your new, robust secure-visibility-api package.
// The name comes from the package.json of your API project.
let SecureVisibility;
try {
  SecureVisibility = require('@your-npm-username/secure-visibility-api').SecureVisibility;
} catch (err) {
  console.error("Failed to load secure-visibility-api. Screen protection will not be available.", err);
  // Create a dummy object if the import fails, so the app doesn't crash.
  SecureVisibility = {
    protect: () => { console.log("Screen protection is not available."); return false; },
    unprotect: () => { console.log("Screen protection is not available."); return false; }
  };
}
// --- CHANGE END ---


let mainWindow;
let overlayWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.DEV_URL || "http://localhost:5173";
  mainWindow.loadURL(devUrl + "/#/");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // --- CHANGE START ---
  // Apply screen-protection on main window using the new API
  mainWindow.webContents.once('did-finish-load', () => {
    const success = SecureVisibility.protect(mainWindow);
    if (success) {
      console.log("Main window protection enabled successfully.");
    } else {
      console.error("Failed to enable protection on the main window.");
    }
  });
  // --- CHANGE END ---
}

function createOverlayWindow() {
  if (overlayWindow) {
    overlayWindow.show();
    return;
  }

  overlayWindow = new BrowserWindow({
    width: 420,
    height: 500,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devUrl = process.env.DEV_URL || "http://localhost:5173";
  overlayWindow.loadURL(devUrl + "/#/overlay");

  overlayWindow.on("closed", () => {
    overlayWindow = null;
  });

  // --- CHANGE START ---
  // Apply screen-protection on the overlay window as well
  overlayWindow.webContents.once('did-finish-load', () => {
    const success = SecureVisibility.protect(overlayWindow);
    if (success) {
      console.log("Overlay window protection enabled successfully.");
    } else {
      console.error("Failed to enable protection on the overlay window.");
    }
  });
  // --- CHANGE END ---
}

app.whenReady().then(() => {
  createMainWindow();

  ipcMain.on("open-overlay", () => {
    createOverlayWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" && !overlayWindow) {
    app.quit();
  }
});
