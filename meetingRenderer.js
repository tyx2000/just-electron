window.addEventListener("DOMContentLoaded", () => {
  const sendButton = document.getElementById("send-ws");
  sendButton.onclick = () => {
    window.api.sendWebSocketMessage();
  };
});
