const { BrowserWindow } = require("electron");
const WebSocket = require("ws");
const path = require("node:path");

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

const insertStatement = db.prepare(`
  INSERT INTO messages (type, from_socket_id, to_socket_id, content, message_timestamp)
  VALUES (?, ?, ?, ?, ?)
`);

const queryStatement = db.prepare(`
  SELECT * FROM messages ORDER BY message_timestamp ASC
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
 * }
 */
function insertMessageToDB(message) {
  console.log("insertMessageToDB", message);
  insertStatement.run([
    message.type,
    message.from,
    message.to,
    message.content,
    message.timestamp,
  ]);
}
function queryMessageFromDB() {
  console.log("queryMessageFromDB invoke");
  const rows = queryStatement.all();
  return rows;
}

module.exports = {
  createWebSocketConnection,
  sendWebSocketMessage,
  closeWebSocketConnection,
  showMeetingWindow,
  queryMessageFromDB,
};
