const handleSocketMessage = (data) => {
  console.log("socket message", data);
  switch (data.type) {
    case "notification":
      break;
    case "chat":
      break;
    case "created-room":
      break;
    case "joined-room":
      break;
    case "offer":
      break;
    case "answer":
      break;
    case "candidate":
      break;
    case "error":
      break;
    default:
      console.log("unknown message type");
      break;
  }
};

window.addEventListener("DOMContentLoaded", async () => {
  try {
    const socketId = await window.api.createWebSocketConnection();

    window.api.onWebSocketStateActive(socketId, "Open", (socketId) => {
      console.log("websocket OPEN", socketId);
    });
    window.api.onWebSocketStateActive(socketId, "Close", () => {
      console.log("websocket CLOSE");
    });
    window.api.onWebSocketStateActive(socketId, "Error", () => {
      console.log("websocket ERROR");
    });

    window.api.receiveWebSocketMessage(socketId, handleSocketMessage);
  } catch (error) {
    console.log("websocketconnection failed", error);
  }
});

const settingButton = document.getElementById("setting-button");
settingButton.onclick = () => {
  window.api.showMeetingWindow();
};
