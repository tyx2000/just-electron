const { ipcMain, ipcRenderer } = require("electron");
const {
  createWebSocketConnection,
  sendWebSocketMessage,
  closeWebSocketConnection,
  showMeetingWindow,
} = require("./ipc-service");

module.exports = function () {
  ipcMain.handle("createWebSocketConnection", createWebSocketConnection);

  ipcMain.handle("sendWebSocketMessage", sendWebSocketMessage);

  ipcMain.handle("closeWebSocketMessage", closeWebSocketConnection);

  ipcMain.handle("showMeetingWindow", showMeetingWindow);
};
