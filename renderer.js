// const settingButton = document.getElementById("setting-button");
// settingButton.onclick = () => {
//   window.api.showMeetingWindow();
// };

let clientId = null;
let latestMessageFromSocketId = null;
const messages = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");

const pickImageButton = document.getElementById("pickImage");
// const captureButton = document.getElementById("capture");
const pickFileButton = document.getElementById("pickFile");
const chatHistoryButton = document.getElementById("chatHistory");
const meetingButton = document.getElementById("meeting");
const sharedDocumentsButton = document.getElementById("sharedDocuments");

const chatHistoryContainer = document.getElementById("chatHistoryContainer");
const chatHistoryType = document.getElementById("chatHistoryType");

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

messageInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    // todo 使用div contenteditable作为输入框时，需要获取innerText/innerHTML
    const message = messageInput.value.trim();
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
      messageInput.value = ""; // Clear the input box after sending
    }
  }
});

pickImageButton.onclick = async () => {
  const filePaths = await window.api.pickFile("Images");
  if (filePaths && Array.isArray(filePaths) && filePaths.length) {
    // todo 文件消息 存储 显示 还原
    filePaths.forEach((filePath) => {
      const imageEl = document.createElement("img");
      imageEl.className = "messageInputImage";
      imageEl.src = filePath;
      messageInput.appendChild(imageEl);
    });
  }
};
pickFileButton.onclick = async () => {
  const filePaths = await window.api.pickFile("All Files");
  console.log("all files", filePaths);
};

// captureButton.onclick = () => {
//   window.api.showCaptureWindow();
// };
chatHistoryButton.onclick = () => {
  chatHistoryContainer.style.display =
    chatHistoryContainer.style.display === "none" ? "flex" : "none";
};

Array.from(chatHistoryType.children).forEach((el, index) => {
  el.onclick = (e) => {
    e.preventDefault();
    console.log("chatHistoryType", e.target.innerText, index);
    el.style.borderColor = "#1FA5F7";
  };
});

meetingButton.onclick = () => {
  window.api.showMeetingWindow();
};
sharedDocumentsButton.onclick = () => {};

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
  // messages.scrollTop = messages.scrollHeight; // Scroll to the bottom
  messages.scrollTo({
    top: messages.scrollHeight,
    behavior: "smooth",
  });
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

const renderPreviousMessages = async () => {
  const rows = await window.api.queryMessageFromDB();
  rows.forEach((row) => {
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
  renderPreviousMessages();
  await initWebSocket();
});
