const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  createWebSocketConnection: (type) =>
    ipcRenderer.invoke("createWebSocketConnection", type),
  // state Open Close Error
  onWebSocketStateActive: (socketId, state, callback) => {
    const eventName = `webSocket${socketId}${state}`;
    ipcRenderer.on(eventName, (_, socketId) => callback(socketId));
    return () => {
      ipcRenderer.off(eventName, (_, socketId) => callback(socketId));
    };
  },
  sendWebSocketMessage: (socketId, message) =>
    ipcRenderer.invoke("sendWebSocketMessage", socketId, message),
  receiveWebSocketMessage: (socketId, callback) => {
    const eventName = `webSocket${socketId}Message`;
    ipcRenderer.on(eventName, (_, data) => {
      callback(data);
    });
    return () => {
      ipcRenderer.off(eventName, (_, data) => {
        callback(data);
      });
    };
  },

  showMeetingWindow: () => ipcRenderer.invoke("showMeetingWindow"),

  queryMessageFromDB: () => ipcRenderer.invoke("queryMessageFromDB"),

  queryAllMessageSenders: () => ipcRenderer.invoke("queryAllMessageSenders"),

  queryMessageByKeywordFromDB: (filterType, filterArgs) =>
    ipcRenderer.invoke("queryMessageByKeywordFromDB", filterType, filterArgs),

  pickFile: (type) => ipcRenderer.invoke("pickFile", type),

  showCaptureWindow: () => ipcRenderer.invoke("showCaptureWindow"),

  showAllSendersOption: (callback) => {
    ipcRenderer.invoke("showAllSendersOption");
    ipcRenderer.on("selectSender", (_, sender) => {
      callback(sender);
    });
  },

  showSharedDocumentWindow: () =>
    ipcRenderer.invoke("showSharedDocumentWindow"),
});
