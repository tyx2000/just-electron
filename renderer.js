// const settingButton = document.getElementById("setting-button");
// settingButton.onclick = () => {
//   window.api.showMeetingWindow();
// };

const messages = document.getElementById("messages");
const inputBox = document.getElementById("inputBox");

const divider = document.getElementById("divider");
divider.addEventListener("mousedown", (e) => {
  e.preventDefault();
  const startY = e.clientY;

  const onMouseMove = (moveEvent) => {
    const offsetY = moveEvent.clientY - startY;
    const [messagesHeight, inputBoxHeight] = [
      getComputedStyle(messages).height,
      getComputedStyle(inputBox).height,
    ];
    console.log("offsetHeight", offsetY, messagesHeight, inputBoxHeight);
    messages.style.height = `calc(${messagesHeight} + ${offsetY}px)`;
    inputBox.style.height = `calc(${inputBoxHeight} - ${offsetY}px)`;
  };

  const onMouseUp = () => {
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
});

const handleSocketMessage = (data) => {
  console.log("socket message", data);

  if (data.type === "chat-message") {
    console.log("chat-message", data);
    const { from, to, timestamp, content } = data;
    const messageElement = document.createElement("div");
    messageElement.className = "message";
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
