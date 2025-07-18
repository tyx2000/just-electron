const { ipcMain } = require("electron");
const {
  createWebSocketConnection,
  sendWebSocketMessage,
  closeWebSocketConnection,
  showMeetingWindow,
  queryMessageFromDB,
  pickFile,
  showCaptureWindow,
} = require("./ipc-service");

module.exports = function (win) {
  ipcMain.handle("createWebSocketConnection", createWebSocketConnection);

  ipcMain.handle("sendWebSocketMessage", sendWebSocketMessage);

  ipcMain.handle("closeWebSocketMessage", closeWebSocketConnection);

  ipcMain.handle("showMeetingWindow", showMeetingWindow);

  ipcMain.handle("queryMessageFromDB", queryMessageFromDB);

  ipcMain.handle("pickFile", (_, type) => pickFile(null, { win, type }));

  ipcMain.handle("showCaptureWindow", showCaptureWindow);
};
