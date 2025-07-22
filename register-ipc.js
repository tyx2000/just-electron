const { ipcMain } = require("electron");
const {
  createWebSocketConnection,
  sendWebSocketMessage,
  closeWebSocketConnection,
  showMeetingWindow,
  queryMessageFromDB,
  queryMessageByKeywordFromDB,
  pickFile,
  showCaptureWindow,
  queryAllMessageSenders,
  showAllSendersOption,
  showSharedDocumentWindow,
} = require("./ipc-service");

module.exports = function (win) {
  ipcMain.handle("createWebSocketConnection", createWebSocketConnection);

  ipcMain.handle("sendWebSocketMessage", sendWebSocketMessage);

  ipcMain.handle("closeWebSocketMessage", closeWebSocketConnection);

  ipcMain.handle("showMeetingWindow", showMeetingWindow);

  ipcMain.handle("queryMessageFromDB", queryMessageFromDB);

  ipcMain.handle("queryMessageByKeywordFromDB", (_, filterType, filterArgs) =>
    queryMessageByKeywordFromDB(filterType, filterArgs),
  );

  ipcMain.handle("pickFile", (_, type) => pickFile(type));

  ipcMain.handle("showCaptureWindow", showCaptureWindow);

  ipcMain.handle("queryAllMessageSenders", queryAllMessageSenders);

  ipcMain.handle("showAllSendersOption", showAllSendersOption);

  ipcMain.handle("showSharedDocumentWindow", showSharedDocumentWindow);
};
