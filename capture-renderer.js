const { ipcRenderer } = require("electron");

let isSelecting = false;
let startX, startY, endX, endY;
let screenImageData = null;

const screenImage = document.getElementById("screen-image");
const selectionBox = document.getElementById("selection-box");
const cancelBtn = document.getElementById("cancel-btn");

ipcRenderer.on("screen-image", (event, dataUrl) => {
  screenImageData = dataUrl;
  screenImage.src = dataUrl;
});

screenImage.addEventListener("mousedown", (event) => {
  if (isSelecting) return;

  isSelecting = true;
  startX = event.clientX;
  startY = event.clientY;

  selectionBox.style.left = `${startX}px`;
  selectionBox.style.top = `${startY}px`;
  selectionBox.style.width = "0px";
  selectionBox.style.height = "0px";
});

screenImage.addEventListener("mousemove", (event) => {
  if (!isSelecting) return;

  endX = event.clientX;
  endY = event.clientY;

  const width = endX - startX;
  const height = endY - startY;

  selectionBox.style.width = `${width}px`;
  selectionBox.style.height = `${height}px`;
});

screenImage.addEventListener("mouseup", (event) => {
  if (!isSelecting) return;

  isSelecting = false;

  const selectedArea = {
    x: startX,
    y: startY,
    width: endX - startX,
    height: endY - startY,
  };

  ipcRenderer.send("select-area", selectedArea);
});

document.addEventListener("keydown", (event) => {
  console.log("Key pressed:", event.key);
  if (event.key === "Escape") {
    isSelecting = false;
    selectionBox.style.width = "0px";
    selectionBox.style.height = "0px";
    console.log("Selection canceled");
    ipcRenderer.invoke("cancel-selection");
  }
});
