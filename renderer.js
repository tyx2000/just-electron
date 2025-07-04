const handleSocketMessage = (data) => {
  console.log("socket message", data);

  if (data.type === "chat-message") {
    console.log("chat-message", data);
  } else {
    return;
  }
};

window.addEventListener("DOMContentLoaded", async () => {
  try {
    const socketId = await window.api.createWebSocketConnection("text");

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
