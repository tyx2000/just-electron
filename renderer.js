// const settingButton = document.getElementById("setting-button");
// settingButton.onclick = () => {
//   window.api.showMeetingWindow();
// };

let clientId = null;
let latestMessageFromSocketId = null;
const messages = document.getElementById("messages");
const inputBox = document.getElementById("inputBox");
const textarea = document.getElementById("messageInput");

// const divider = document.getElementById("divider");
// divider.addEventListener("mousedown", (e) => {
//   e.preventDefault();
//   const startY = e.clientY;

//   const onMouseMove = (moveEvent) => {
//     const offsetY = moveEvent.clientY - startY;
//     const [messagesHeight, inputBoxHeight] = [
//       getComputedStyle(messages).height,
//       getComputedStyle(inputBox).height,
//     ];
//     console.log("offsetHeight", offsetY, messagesHeight, inputBoxHeight);
//     messages.style.height = `calc(${messagesHeight} + ${offsetY}px)`;
//   };

//   const onMouseUp = () => {
//     document.removeEventListener("mousemove", onMouseMove);
//     document.removeEventListener("mouseup", onMouseUp);
//   };

//   document.addEventListener("mousemove", onMouseMove);
//   document.addEventListener("mouseup", onMouseUp);
// });

textarea.addEventListener("keydown", async (e) => {
  console.log(e);
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const message = textarea.value.trim();
    if (message) {
      const msg = {
        type: "chat-message",
        content: message,
        from: clientId,
        timestamp: Date.now(),
        to: "all",
      };
      const success = await window.api.sendWebSocketMessage(clientId, msg);
      if (success) {
        insertMessageToChat("sent", msg);
      }
      textarea.value = ""; // Clear the input box after sending
    }
  }
});

/**
 * Inserts a message into the chat window.
 * @param {string} type - sent or received.
 * @param {*} message - The message content.
 */
const insertMessageToChat = (type, message) => {
  const { from, timestamp, content } = message;
  if (from === latestMessageFromSocketId) {
    // If the message is from the latest sender, hide the same sender info
    const lastMessage = messages.lastElementChild;
    const messageContentEl = document.createElement("div");
    messageContentEl.className = "messageContent";
    messageContentEl.innerText = content;
    lastMessage.appendChild(messageContentEl);
  } else {
    latestMessageFromSocketId = from;
    // If the message is from a different sender, insert a new message
    const el = document.createElement("div");
    el.className = `${type}Message`;
    el.innerHTML = `<div class="messageInfo">${from
      .split("-")[1]
      .slice(0, 10)} ${new Date(timestamp)
      .toISOString()
      .replace("T", " ")
      .slice(0, 19)}</div><div class="messageContent">${content}</div>`;
    messages.appendChild(el);
  }
  messages.scrollTop = messages.scrollHeight; // Scroll to the bottom
};

const handleSocketMessage = (data) => {
  if (data.type === "chat-message") {
    const { from, timestamp, content } = data;
    insertMessageToChat("received", {
      from,
      timestamp,
      content,
    });
  } else {
    return;
  }
};

const queryAllMessages = async () => {
  const rows = await window.api.queryMessageFromDB();
  rows.forEach((row) => {
    console.log({ row });
    insertMessageToChat("received", {
      from: row.from_socket_id,
      timestamp: row.message_timestamp,
      content: row.content,
    });
  });
};

const initWebSocket = async () => {
  try {
    const socketId = await window.api.createWebSocketConnection("text");

    window.api.onWebSocketStateActive(socketId, "Open", (socketId) => {
      clientId = socketId;
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
};

window.addEventListener("DOMContentLoaded", async () => {
  queryAllMessages();
  await initWebSocket();
});
