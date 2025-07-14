const { BrowserWindow } = require("electron");
const WebSocket = require("ws");
const path = require("node:path");

const clients = new Map();

module.exports = {
  createWebSocketConnection: (event, type) => {
    return new Promise((resolve, reject) => {
      const socketId = `${type}-${Math.random().toString(36).slice(2)}`;
      console.log("createWebSocketConnection", socketId);

      try {
        const socket = new WebSocket(
          `ws://localhost:8080?socketId=${socketId}`,
        );
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
        });

        resolve(socketId);
      } catch (error) {
        console.log("createWebSocketConnection failed", error);
        reject(error);
      }
    });
  },

  sendWebSocketMessage: async (_, socketId, data) => {
    console.log("send websocket message", socketId, data);

    const socket = clients.get(socketId);
    if (socket && socket.readyState === 1) {
      socket.send(JSON.stringify(data));
      return true;
    } else {
      return false;
    }
  },

  closeWebSocketConnection: (_, socketId) => {},

  showMeetingWindow: () => {
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

    meetingWindow.loadURL("http://mirror.yamazaki.buzz");

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
  },
};
