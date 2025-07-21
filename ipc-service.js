const {
  BrowserWindow,
  dialog,
  desktopCapturer,
  screen,
  ipcMain,
} = require("electron");
const WebSocket = require("ws");
const path = require("node:path");
const fs = require("node:fs");

const sqlite = require("better-sqlite3");
const db = sqlite(path.join(__dirname, "chat-messages.db"), {
  verbose: console.log,
});
db.exec(`CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  from_socket_id TEXT NOT NULL,
  to_socket_id TEXT NOT NULL,
  content TEXT NOT NULL,
  message_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS message_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_content BLOB NOT NULL
)`);

const insertMessageStatement = db.prepare(`
  INSERT INTO messages (type, from_socket_id, to_socket_id, content, message_timestamp)
  VALUES (?, ?, ?, ?, ?)
`);

const deleteMessageStatement = db.prepare(`
  DELETE FROM messages WHERE id = ?
`);

const queryAllMessagesStatement = db.prepare(`
  SELECT * FROM messages ORDER BY message_timestamp ASC
`);

const insertFileStatement = db.prepare(`
  INSERT INTO message_files (message_id, file_name, file_type, file_size, file_content)
  VALUES (?, ?, ?, ?, ?)
`);

const clients = new Map();

function createWebSocketConnection(event, type) {
  return new Promise((resolve, reject) => {
    const socketId = `${type}-${
      Math.random().toString(36).slice(2) + Date.now()
    }`;
    console.log("createWebSocketConnection", socketId);

    try {
      const socket = new WebSocket(`ws://localhost:8080?socketId=${socketId}`);
      const eventPrefix = `webSocket${socketId}`;
      socket.on("open", () => {
        clients.set(socketId, socket);
        event.sender.send(`${eventPrefix}Open`, socketId);
      });
      socket.on("close", () => {
        clients.delete(socketId);
        event.sender.send(`${eventPrefix}Close`, socketId);
      });
      socket.on("error", (error) => {
        event.sender.send(`${eventPrefix}Error`, socketId);
      });
      socket.on("message", (message) => {
        const data = JSON.parse(message);
        event.sender.send(`${eventPrefix}Message`, data);
        insertMessageToDB(data);
      });

      resolve(socketId);
    } catch (error) {
      console.log("createWebSocketConnection failed", error);
      reject(error);
    }
  });
}

function sendWebSocketMessage(_, socketId, data) {
  console.log("send websocket message", socketId, data);

  const socket = clients.get(socketId);
  if (socket && socket.readyState === 1) {
    socket.send(JSON.stringify(data));

    insertMessageToDB(data);
    return true;
  } else {
    return false;
  }
}

function closeWebSocketConnection(_, socketId) {
  console.log("closeWebSocketConnection", socketId);

  const socket = clients.get(socketId);
  if (socket) {
    socket.close();
    clients.delete(socketId);
  }
}

function showMeetingWindow() {
  // const openedWindows = BrowserWindow.getAllWindows().map((win) => ({
  //   id: win.id,
  //   label: win.label,
  // title: win.getTitle(),
  // isVisible: win.isVisible(),
  // isFocused: win.isFocused(),
  // isMaximized: win.isMaximized(),
  // isMinimized: win.isMinimized(),
  // isFullScreen: win.isFullScreen(),
  // bounds: win.getBounds(),
  // webContentsId: win.webContents.id,
  // }));

  // if meeting window already exists, focus it
  const existingMeetingWindow = BrowserWindow.getAllWindows().find(
    (win) => win.label === "meeting",
  );
  if (existingMeetingWindow) {
    existingMeetingWindow.focus();
    return;
  }

  const meetingWindow = new BrowserWindow({
    width: 800,
    height: 600,
    modal: true,
    show: false,
    webPreferences: {
      // 每个BrowserWindow实例都有自己独立的渲染进程和全局对象window
      // 即使使用相同的预加载脚本，他们在不同窗口中也是相互隔离的
      // 每个预加载脚本可以通过exposeInMainWorld在各自窗口的window对象上添加属性，不会影响其他窗口
      // 如果多个预加载脚本使用相同的名称，他们在各自窗口中是独立的
      preload: path.join(__dirname, "preload.js"),
    },
  });

  meetingWindow.label = "meeting";

  // cloudflare SSL/TLS flexible
  // 另外 http下 getDisplayMedia失效
  meetingWindow.loadURL("https://mirror.yamazaki.buzz");

  meetingWindow.on("maximize", () => {
    console.log("meeting max");
  });

  meetingWindow.on("minimize", () => {
    console.log("meeting min");
  });

  meetingWindow.on("close", () => {
    console.log("meeting close");
  });

  meetingWindow.webContents.openDevTools();

  meetingWindow.show();
}

function getFileMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return mimeMap[ext] || "application/octet-stream";
}

/**
 *
 * @param {*} _ ignore
 * @param {*} message
 * {
 *  type: "chat-message",
 *  from: "socketId",
 *  to: "socketId",
 *  content: "message content",
 *  timestamp: Date.now(),
 *  filePaths: 当消息包含文件时，文件的路径数组
 * }
 */
function insertMessageToDB(message) {
  const result = insertMessageStatement.run([
    message.type,
    message.from,
    message.to,
    message.content,
    message.timestamp,
  ]);
  if (message.filePaths) {
    filePaths.forEach((filePath) => {
      const fileBuffer = fs.readFileSync(filePath);
      const fileStats = fs.statSync(filePath);
      const fileName = path.basename(filePath);
      const fileType = getFileMimeType(filePath);
      const fileSize = fileStats.size;
      insertFileStatement.run(
        result.lastInsertRowid,
        fileName,
        fileType,
        fileSize,
        fileBuffer,
      );
    });
  }
}
function queryMessageFromDB() {
  console.log("queryMessageFromDB invoke");
  const rows = queryAllMessagesStatement.all();
  return rows;
}

function queryMessageByKeywordFromDB() {}

async function pickFile(_, { win, type }) {
  const filters =
    type === "Images"
      ? [{ name: "Images", extensions: ["jpg", "jpeg", "png", "gif", "webp"] }]
      : [{ name: "All Files", extensions: ["*"] }];
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ["openFile", "multiSelections"],
      filters,
    });
    return canceled ? null : filePaths;
  } catch (error) {
    console.log(error);
  }
}

// todo 彻底失败
async function showCaptureWindow() {
  try {
    let screenShotWindow = null;

    ipcMain.handle("cancel-selection", () => {
      screenShotWindow && screenShotWindow.close();
    });

    const currentDisplay = screen.getDisplayNearestPoint(
      screen.getCursorScreenPoint(),
    );
    const { x, y, width, height } = currentDisplay.bounds;
    const screenSources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width, height },
    });

    const mainScreen = screenSources.find(
      (source) => source.name === "Entire screen",
    );
    if (!mainScreen) {
      console.log("unable to get screen source");
    } else {
      screenShotWindow = new BrowserWindow({
        x,
        y,
        width,
        height,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        fullscreen: false,
        fullscreenable: true,
        simpleFullscreen: true,
        show: false,
        hasShadow: false,
        titleBarStyle: "hidden",
        skipTaskbar: true,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          hardwareAcceleration: false,
        },
      });
      screenShotWindow.loadFile("capture.html");
      screenShotWindow.webContents.on("did-finish-load", () => {
        screenShotWindow.webContents.send(
          "screen-image",
          mainScreen.thumbnail.toDataURL(),
        );
      });
      screenShotWindow.once("ready-to-show", () => {
        screenShotWindow.show();
        screenShotWindow.setFullScreen(true);
      });
    }
  } catch (error) {
    console.log("captureWindow", error);
  }
}

module.exports = {
  createWebSocketConnection,
  sendWebSocketMessage,
  closeWebSocketConnection,
  showMeetingWindow,
  queryMessageFromDB,
  queryMessageByKeywordFromDB,
  pickFile,
  showCaptureWindow,
};
