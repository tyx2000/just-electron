const { ipcMain } = require("electron");
const {
  createWebSocketConnection,
  sendWebSocketMessage,
  closeWebSocketConnection,
  showMeetingWindow,
  queryMessageFromDB,
} = require("./ipc-service");

module.exports = function () {
  ipcMain.handle("createWebSocketConnection", createWebSocketConnection);

  ipcMain.handle("sendWebSocketMessage", sendWebSocketMessage);

  ipcMain.handle("closeWebSocketMessage", closeWebSocketConnection);

  ipcMain.handle("showMeetingWindow", showMeetingWindow);

  ipcMain.handle("queryMessageFromDB", queryMessageFromDB);
};
