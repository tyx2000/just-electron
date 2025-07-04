let webrtcClient = null;

const onLocalStream = (stream) => {
  const localVideo = document.getElementById("local-video");
  localVideo.srcObject = stream;
};

const onRemoteStream = (stream) => {
  const remoteVideo = document.getElementById("remote-video");
  remoteVideo.srcObject = stream;
};

const handleSignalingMessage = (message) => {
  console.log("signaling", message);
  switch (message.type) {
    case "created-room":
      // webrtcClient.
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
      console.log("error message", message);
      break;
  }
};

const sendToSignalingServer = async (socketId, data) => {
  try {
    const success = await window.api.sendWebSocketMessage(socketId, data);
    console.log("sendToSignalingServer", success);
  } catch (error) {
    console.log("sendToSignalingServer failed", error);
  }
};

const connectToSignalingServer = async () => {
  try {
    const socketId = await window.api.createWebSocketConnection("stream");
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

    webrtcClient = new WebRTCClient(socketId, {
      sendToSignalingServer,
      onLocalStream,
      onRemoteStream,
    });
  } catch (error) {
    console.log("failed to createWebSocketConnection", error);
  }
};

const launchMeetingBtn = document.getElementById("launch-meeting");
const joinMeetingBtn = document.getElementById("join-meeting");

launchMeetingBtn.onclick = async () => {
  webrtcClient.sendToRemote({
    type: "create-room",
  });
  await webrtcClient.createPeerConnection();
  await webrtcClient.getMediaStream();
};
joinMeetingBtn.onclick = () => {};

window.addEventListener("DOMContentLoaded", async () => {
  await connectToSignalingServer();
});
