const config = {
  iceServers: [
    {
      urls: "stun:stun.l.goole.com:19302",
    },
  ],
  sdpSemantics: "unified-plan",
};

let peerConnection = null;

const createPeerConnection = () =>
  new Promise((resolve, reject) => {
    try {
      peerConnection = new RTCPeerConnection(config);

      peerConnection.onicecandidate = (event) => {
        if (event) {
        }
      };
    } catch (error) {}
  });

const sendWebSocketMessage = () => {
  window.api.sendWebSocketMessage();
};

const handleSignalingMessage = (message) => {
  console.log("signaling", message);
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

    window.api.receiveWebSocketMessage(socketId, handleSignalingMessage);
  } catch (error) {
    console.log("failed to createWebSocketConnection", error);
  }
});
