const notes = window.__ebookNotes || [
  "assets/images/2 notes.png",
  "assets/images/Aditya G.png",
  "assets/images/Anonymous_1.png",
  "assets/images/Anushweta.png",
  "assets/images/Ashwini K.png",
  "assets/images/Ashwini V.png",
  "assets/images/Bhagyashree.png",
  "assets/images/Girish K.png",
  "assets/images/Harshwardhan.png",
  "assets/images/Isha.png",
  "assets/images/Jayati.png",
  "assets/images/Jignesh J.jpg",
  "assets/images/K.V.Sai.jpg",
  "assets/images/Khushboo.png",
  "assets/images/Komal.png",
  "assets/images/Laksh.png",
  "assets/images/Mahesh S.jpg",
  "assets/images/Maumit.png",
  "assets/images/Moumit D.png",
  "assets/images/note (3).png",
  "assets/images/Pallavi D.jpg",
  "assets/images/Pradnya.png",
  "assets/images/Prasad.png",
  "assets/images/Radhika P.jpg",
  "assets/images/Ravindra.png",
  "assets/images/Ruchita.png",
  "assets/images/Rutuja.png",
  "assets/images/Sagar K.png",
  "assets/images/Sagar.png",
  "assets/images/Sarthak.png",
  "assets/images/Seema.png",
  "assets/images/Shahruk.png",
  "assets/images/Shamli.png",
  "assets/images/Shashank.png",
  "assets/images/Shraddha.png",
  "assets/images/Shrushti.png",
  "assets/images/Sonal.png",
  "assets/images/Suhas.png",
  "assets/images/Sumit J.png",
  "assets/images/Ujwala.png"
];

let currentIndex = 0;
let turnDirection = 1;
let isTurning = false;
let turnCleanupTimer = null;
const TURN_DURATION_MS = 1120;

const launchPage = document.getElementById("launchPage");
const ebook = document.getElementById("ebook");
const openBookBtn = document.getElementById("openBookBtn");
const homeBtn = document.getElementById("homeBtn");
const bookLayout = document.querySelector(".book-layout");
const staticCard = document.querySelector(".static-card");
const interactiveShell = document.querySelector(".interactive-shell");
const blurPrev = document.getElementById("blurPrev");
const blurCurrent = document.getElementById("blurCurrent");
const blurNext = document.getElementById("blurNext");
const rightImage = document.getElementById("rightImage");
const rightFrame = document.getElementById("rightFrame");
const flipSheet = document.getElementById("flipSheet");
const flipImage = document.getElementById("flipImage");
const noteLabel = document.querySelector(".page-label");
const pageIndicator = document.getElementById("pageIndicator");
const progressLabel = document.getElementById("progressLabel");
const progressCount = document.getElementById("progressCount");
const progressBar = document.getElementById("progressBar");
const flipSound = document.getElementById("flipSound");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateButtons() {
  prevBtn.disabled = isTurning || currentIndex === 0;
  nextBtn.disabled = isTurning || currentIndex === notes.length - 1;
}

function getNoteName(index) {
  return notes[index].split("/").pop();
}

function updateIndicator(index = currentIndex) {
  const currentName = getNoteName(index);
  const progress = ((index + 1) / notes.length) * 100;

  pageIndicator.textContent = `Page ${index + 1} of ${notes.length} - ${currentName}`;

  if (noteLabel) {
    noteLabel.textContent = currentName.replace(/\.[^.]+$/, "");
  }

  if (progressLabel) {
    progressLabel.textContent = currentName.replace(/\.[^.]+$/, "");
  }

  if (progressCount) {
    progressCount.textContent = `${index + 1} / ${notes.length}`;
  }

  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }
}

function clearTurnTimers() {
  if (turnCleanupTimer !== null) {
    window.clearTimeout(turnCleanupTimer);
    turnCleanupTimer = null;
  }
}

function resetZoomAndTilt() {
  rightFrame.classList.remove("is-zoomed", "auto-zoom");
  rightFrame.style.transform = "";
  rightImage.style.transform = "";
}

function updateBlurBackground(index) {
  const prevImage = notes[Math.max(index - 1, 0)];
  const currentImage = notes[index];
  const nextImage = notes[Math.min(index + 1, notes.length - 1)];

  if (blurPrev) {
    blurPrev.style.backgroundImage = `url("${prevImage}")`;
  }

  if (blurCurrent) {
    blurCurrent.style.backgroundImage = `url("${currentImage}")`;
  }

  if (blurNext) {
    blurNext.style.backgroundImage = `url("${nextImage}")`;
  }
}

function playFlipSound() {
  if (!flipSound) {
    return;
  }

  try {
    flipSound.currentTime = 0;
    const playPromise = flipSound.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  } catch (error) {
    // Keep navigation working even if audio playback is blocked.
  }
}

function syncVisiblePage(index, options = {}) {
  const imagePath = notes[index];
  currentIndex = index;
  window.__ebookIndex = index;
  rightImage.src = imagePath;
  rightImage.alt = `Interactive view for ${imagePath}`;
  updateIndicator(index);
  updateButtons();
}

function runTurnAnimation(fromIndex, toIndex) {
  const previousImage = notes[fromIndex];

  if (!flipSheet || !flipImage || !previousImage) {
    syncVisiblePage(toIndex);
    return;
  }

  clearTurnTimers();
  isTurning = true;
  flipImage.src = previousImage;
  syncVisiblePage(toIndex);
  rightFrame.classList.remove("is-turning");
  flipSheet.classList.remove("turning-forward", "turning-backward");
  void flipSheet.offsetWidth;
  rightFrame.classList.add("is-turning");
  flipSheet.classList.add(turnDirection >= 0 ? "turning-forward" : "turning-backward");

  turnCleanupTimer = window.setTimeout(() => {
    isTurning = false;
    rightFrame.classList.remove("is-turning");
    flipSheet.classList.remove("turning-forward", "turning-backward");
    updateButtons();
    clearTurnTimers();
  }, TURN_DURATION_MS);
}

function renderPage(index) {
  updateBlurBackground(index);
  resetZoomAndTilt();
  triggerSpreadTransition();
  syncVisiblePage(index);
}

function triggerSpreadTransition() {
  const directionClass = turnDirection >= 0 ? "panel-forward" : "panel-backward";

  if (bookLayout) {
    bookLayout.classList.remove("is-transitioning");
    void bookLayout.offsetWidth;
    bookLayout.classList.add("is-transitioning");
    window.setTimeout(() => {
      bookLayout.classList.remove("is-transitioning");
    }, 420);
  }

  [staticCard, interactiveShell].forEach((card) => {
    if (!card) {
      return;
    }

    card.classList.remove("panel-forward", "panel-backward");
    void card.offsetWidth;
    card.classList.add(directionClass);
  });
}

function showBook() {
  launchPage.classList.add("hidden");
  ebook.classList.remove("hidden");
  launchPage.style.display = "none";
  ebook.style.display = "grid";
  renderPage(currentIndex);

  if (!document.fullscreenElement) {
    toggleFullscreen().catch(() => {});
  }
}

function goHome() {
  ebook.classList.add("hidden");
  launchPage.classList.remove("hidden");
  ebook.style.display = "none";
  launchPage.style.display = "grid";
  currentIndex = 0;
  window.__ebookIndex = 0;
  turnDirection = 1;
  isTurning = false;
  clearTurnTimers();
  resetZoomAndTilt();
  updateIndicator(0);
  updateButtons();

  try {
    if (window.location.hash === "#ebook") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  } catch (error) {
    if (window.location.hash === "#ebook") {
      window.location.hash = "";
    }
  }
}

window.__openEbook = showBook;
window.__changeEbookPage = changePage;
window.__goHome = goHome;

function changePage(step) {
  if (isTurning) {
    return;
  }

  const fromIndex = currentIndex;
  const nextIndex = clamp(fromIndex + step, 0, notes.length - 1);
  if (nextIndex === fromIndex) {
    return;
  }

  turnDirection = step;
  resetZoomAndTilt();
  triggerSpreadTransition();
  updateBlurBackground(nextIndex);
  playFlipSound();
  runTurnAnimation(fromIndex, nextIndex);
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
    fullscreenBtn.classList.add("is-active");
    fullscreenBtn.setAttribute("aria-label", "Exit fullscreen");
    fullscreenBtn.setAttribute("title", "Exit fullscreen");
    return;
  }

  await document.exitFullscreen();
  fullscreenBtn.classList.remove("is-active");
  fullscreenBtn.setAttribute("aria-label", "Enter fullscreen");
  fullscreenBtn.setAttribute("title", "Enter fullscreen");
}

fullscreenBtn.addEventListener("click", () => {
  toggleFullscreen().catch(() => {});
});

document.addEventListener("fullscreenchange", () => {
  const isFullscreen = Boolean(document.fullscreenElement);
  fullscreenBtn.classList.toggle("is-active", isFullscreen);
  fullscreenBtn.setAttribute("aria-label", isFullscreen ? "Exit fullscreen" : "Enter fullscreen");
  fullscreenBtn.setAttribute("title", isFullscreen ? "Exit fullscreen" : "Enter fullscreen");
});

document.addEventListener("keydown", (event) => {
  if (ebook.classList.contains("hidden")) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      showBook();
    }
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    changePage(1);
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    changePage(-1);
  }

  if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    toggleFullscreen().catch(() => {});
  }
});
