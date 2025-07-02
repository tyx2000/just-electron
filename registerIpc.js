const { ipcMain, ipcRenderer } = require("electron");
const {
  createWebSocketConnection,
  sendWebSocketMessage,
  closeWebSocketConnection,
  showMeetingWindow,
} = require("./ipcService");

module.exports = function () {
  ipcMain.handle("createWebSocketConnection", createWebSocketConnection);

  ipcMain.handle("sendWebSocketMessage", sendWebSocketMessage);

  ipcMain.handle("closeWebSocketMessage", closeWebSocketConnection);

  ipcMain.handle("showMeetingWindow", showMeetingWindow);

  ipcMain.on("meetingInvoke", (a, b, c) => {
    console.log("meetingInvoke", { a, b, c });
    ipcRenderer.send("meetingInvokeReply", 1, 2, 3);
  });
};
