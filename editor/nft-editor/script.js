import { removeBackgroundFromImageFile } from "@imgly/background-removal";

const uploadInput = document.getElementById("uploadInput");
const backgroundSelect = document.getElementById("backgroundSelect");
const zoomInButton = document.getElementById("zoomInButton");
const zoomOutButton = document.getElementById("zoomOutButton");
const downloadButton = document.getElementById("downloadButton");
const savePresetButton = document.getElementById("savePresetButton");

const backgroundImg = document.getElementById("background");
const canvas = document.getElementById("previewCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 1000;

let cutOutImage = null;
let imageX = 0;
let imageY = 0;
let imageScale = 1;
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let scenePresets = {};

fetch('/assets/scene-presets.json')
  .then(response => response.json())
  .then(data => {
    scenePresets = data;
  });

function drawCombinedImage() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

  if (cutOutImage) {
    const drawWidth = cutOutImage.width * imageScale;
    const drawHeight = cutOutImage.height * imageScale;
    ctx.drawImage(cutOutImage, imageX, imageY, drawWidth, drawHeight);
  }
}

uploadInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const blob = await removeBackgroundFromImageFile({
      imageFile: file,
      model: "medium"
    });

    const img = new Image();
    img.onload = () => {
      cutOutImage = img;
      imageScale = Math.min(canvas.width / img.width, canvas.height / img.height);
      imageX = 0;
      imageY = 0;
      drawCombinedImage();
    };
   img.src = URL.createObjectURL(resultBlob);


  } catch (error) {
    console.error("Background removal failed", error);
    alert("Failed to remove background.");
  }
});

backgroundSelect.addEventListener("change", () => {
  backgroundImg.src = backgroundSelect.value;
  backgroundImg.onload = () => {
    applyScenePreset(backgroundSelect.value);
    drawCombinedImage();
  };
});

function applyScenePreset(backgroundPath) {
  const preset = scenePresets[backgroundPath];
  if (!preset || !cutOutImage) return;

  imageScale = preset.scale;
  imageX = preset.position.x;
  imageY = preset.position.y;
}

canvas.addEventListener("mousedown", (e) => {
  if (!cutOutImage) return;

  const drawWidth = cutOutImage.width * imageScale;
  const drawHeight = cutOutImage.height * imageScale;

  if (
    e.offsetX >= imageX && e.offsetX <= imageX + drawWidth &&
    e.offsetY >= imageY && e.offsetY <= imageY + drawHeight
  ) {
    isDragging = true;
    dragOffsetX = e.offsetX - imageX;
    dragOffsetY = e.offsetY - imageY;
    canvas.style.cursor = "grabbing";
  }
});

canvas.addEventListener("mousemove", (e) => {
  if (isDragging) {
    imageX = e.offsetX - dragOffsetX;
    imageY = e.offsetY - dragOffsetY;
    drawCombinedImage();
  }
});

canvas.addEventListener("mouseup", () => {
  isDragging = false;
  canvas.style.cursor = "grab";
});

function zoomImage(zoomFactor) {
  const prevWidth = cutOutImage.width * imageScale;
  const prevHeight = cutOutImage.height * imageScale;
  const bottomCenterX = imageX + prevWidth / 2;
  const bottomY = imageY + prevHeight;

  imageScale = Math.max(0.1, Math.min(imageScale * zoomFactor, 5));

  const newWidth = cutOutImage.width * imageScale;
  const newHeight = cutOutImage.height * imageScale;

  imageX = bottomCenterX - newWidth / 2;
  imageY = bottomY - newHeight;

  drawCombinedImage();
}

zoomInButton.addEventListener("click", () => zoomImage(1.1));
zoomOutButton.addEventListener("click", () => zoomImage(0.9));

downloadButton.addEventListener("click", () => {
  const link = document.createElement('a');
  link.download = 'combined-image.png';
  link.href = canvas.toDataURL();
  link.click();
});

savePresetButton.addEventListener("click", () => {
  const presetData = {
    scale: imageScale,
    position: {
      x: Math.round(imageX),
      y: Math.round(imageY)
    }
  };

  const backgroundPath = backgroundImg.src.split('/').slice(-3).join('/');
  console.log(`"${backgroundPath}": ${JSON.stringify(presetData, null, 2)},`);
  alert("Preset logged to console.");
});

const nftNumberInput = document.getElementById("nftNumberInput");
const loadNFTButton = document.getElementById("loadNFTButton");

loadNFTButton.addEventListener("click", async () => {
  const number = nftNumberInput.value;
  if (!number) {
    alert("Enter NFT number!");
    return;
  }

  const imagePath = '/images/1.webp';
const response = await fetch(imagePath);
const blob = await response.blob();
const file = new File([blob], 'test.webp', { type: blob.type });

const resultBlob = await removeBackgroundFromImageFile({
  imageFile: file,
  model: 'medium'
});

const img = new Image();
img.onload = () => {
  cutOutImage = img;
  imageScale = Math.min(canvas.width / img.width, canvas.height / img.height);
  imageX = 0;
  imageY = 0;
  drawCombinedImage();
};
img.src = URL.createObjectURL(resultBlob);



  try {
const response = await fetch(imagePath);
const blob = await response.blob();
const file = new File([blob], `${number}.webp`, { type: blob.type });

const resultBlob = await removeBackgroundFromImageFile({
  imageFile: file,
  model: "medium"
});

const img = new Image();
img.onload = () => {
  cutOutImage = img;
  imageScale = Math.min(canvas.width / img.width, canvas.height / img.height);
  imageX = 0;
  imageY = 0;
  drawCombinedImage();
};
img.src = URL.createObjectURL(resultBlob);  // ✅ IMPORTANT FIX

  } catch (error) {
    console.error("Failed to load or process NFT", error);
    alert("Failed to load NFT image.");
  }
});
