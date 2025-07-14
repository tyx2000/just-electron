const path = require("node:path");
const { BrowserWindow, app, session, desktopCapturer } = require("electron");
const registerIpc = require("./register-ipc");

function createWindow() {
  const win = new BrowserWindow({
    width: 1080,
    height: 800,
    minWidth: 1080,
    minHeight: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("index.html");

  win.webContents.openDevTools();
}

app.whenReady().then(() => {
  registerIpc();

  createWindow();

  session.defaultSession.setDisplayMediaRequestHandler(
    (request, callback) => {
      desktopCapturer.getSources({ types: ["screen"] }).then((sources) => {
        callback({ video: sources[0], audio: "loopback" });
      });
    },
    { useSystemPicker: true },
  );

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
