const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let mainWindow;
let overlayWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
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
  backgroundColor: "#00000000", // fully transparent
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
