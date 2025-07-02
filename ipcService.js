const { BrowserWindow } = require("electron");
const WebSocket = require("ws");
const path = require("node:path");

const clients = new Map();

module.exports = {
  createWebSocketConnection: (event) => {
    return new Promise((resolve, reject) => {
      const socketId = Math.random().toString(36).slice(2);
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

  sendWebSocketMessage: () => {
    console.log("send websocket message");
  },

  closeWebSocketConnection: () => {},

  showMeetingWindow: () => {
    const meetingWindow = new BrowserWindow({
      width: 800,
      height: 600,
      modal: true,
      show: false,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
      },
    });

    meetingWindow.loadFile("./meeting.html");

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

  meetingInvoke: () => {},
};
