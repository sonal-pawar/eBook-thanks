const notes = window.__ebookNotes || [
  "assets/images/Poonam.jpg",
  "assets/images/Laksh.png",
  "assets/images/Ashwini V.png",
  "assets/images/Prasad.png",
  "assets/images/Shrushti.png",
  "assets/images/Shamli.png",
  "assets/images/Ashwini K.png",
  "assets/images/Ruchita.png",
  "assets/images/Bhagyashree.png",
  "assets/images/Sagar.png",
  "assets/images/Jayati.png",
  "assets/images/Jignesh J.jpg",
  "assets/images/Anushweta.png",
  "assets/images/Sonal.png",
  "assets/images/Sagar K.png",
  "assets/images/Mahesh S.jpg",
  "assets/images/Komal.png",
  "assets/images/2 notes.png",
  "assets/images/Ujwala.png",
  "assets/images/Rutuja.png",
  "assets/images/Pradnya.png",
  "assets/images/Shashank.png",
  "assets/images/Pallavi D.jpg",
  "assets/images/Girish K.png",
  "assets/images/Sarthak.png",
  "assets/images/Isha.png",
  "assets/images/Harshwardhan.png",
  "assets/images/Khushboo.png",
  "assets/images/Anonymous_1.png",
  "assets/images/Aditya G.png",
  "assets/images/Shahruk.png",
  "assets/images/Moumit D.png",
  "assets/images/Shraddha.png",
  "assets/images/K.V.Sai.jpg",
  "assets/images/Suhas.png",
  "assets/images/Maumit.png",
  "assets/images/Seema.png",
  "assets/images/Radhika P.jpg",
  "assets/images/note (3).png",
  "assets/images/Sumit J.png",
  "assets/images/Ravindra.png"
];

const BACK_COVER_IMAGE = window.__ebookBackCover || "assets/images/back_cover.png";
const TURN_DURATION_MS = 980;
const imageCache = new Set();

let currentIndex = 0;
let turnDirection = 1;
let isTurning = false;
let isBackCoverOpen = false;
let turnCleanupTimer = null;

const launchPage = document.getElementById("launchPage");
const ebook = document.getElementById("ebook");
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
const flipBackImage = document.getElementById("flipBackImage");
const noteLabel = document.querySelector(".page-label");
const pageIndicator = document.getElementById("pageIndicator");
const progressLabel = document.getElementById("progressLabel");
const progressCount = document.getElementById("progressCount");
const progressBar = document.getElementById("progressBar");
const footerHint = document.querySelector(".footer-hint");
const tocOverlay = document.getElementById("tocOverlay");
const tocBackdrop = document.getElementById("tocBackdrop");
const tocToggleBtn = document.getElementById("tocToggleBtn");
const tocCloseBtn = document.getElementById("tocCloseBtn");
const tocList = document.getElementById("tocList");
const flipSound = document.getElementById("flipSound");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const fullscreenBtn = document.getElementById("fullscreenBtn");
let isTocOpen = false;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function hasNotes() {
  return notes.length > 0;
}

function getLastNoteIndex() {
  return Math.max(notes.length - 1, 0);
}

function getCurrentPosition() {
  return isBackCoverOpen ? notes.length : currentIndex;
}

function getNoteName(index) {
  return notes[index].split("/").pop();
}

function getNoteLabel(index) {
  return getNoteName(index).replace(/\.[^.]+$/, "");
}

function getImagePath(index = currentIndex, backCover = isBackCoverOpen) {
  return backCover ? BACK_COVER_IMAGE : notes[index];
}

function preloadImage(path) {
  if (!path || imageCache.has(path)) {
    return;
  }

  const img = new Image();
  img.src = path;
  imageCache.add(path);
}

function preloadAround(index) {
  if (!hasNotes()) {
    preloadImage(BACK_COVER_IMAGE);
    return;
  }

  const safeIndex = clamp(index, 0, getLastNoteIndex());
  preloadImage(notes[safeIndex]);
  preloadImage(notes[Math.max(safeIndex - 1, 0)]);
  preloadImage(notes[Math.min(safeIndex + 1, getLastNoteIndex())]);
  preloadImage(BACK_COVER_IMAGE);
}

function setBackCoverState(active) {
  isBackCoverOpen = active;
  rightFrame.classList.toggle("is-back-cover", active);

  if (interactiveShell) {
    interactiveShell.classList.toggle("is-back-cover-view", active);
  }

  updateTocSelection();
}

function updateButtons() {
  const position = getCurrentPosition();
  prevBtn.disabled = isTurning || position === 0;
  nextBtn.disabled = isTurning || !hasNotes() || isBackCoverOpen;
}

function updateIndicator(index = currentIndex, options = {}) {
  const backCover = options.backCover ?? isBackCoverOpen;
  const pageNumber = backCover ? notes.length : index + 1;
  const progress = notes.length ? (pageNumber / notes.length) * 100 : 0;
  const label = backCover ? "Back Cover" : getNoteLabel(index);
  const indicatorText = backCover ? "Back Cover" : `Page ${pageNumber} of ${notes.length} - ${getNoteName(index)}`;

  if (pageIndicator) {
    pageIndicator.textContent = indicatorText;
  }

  if (noteLabel) {
    noteLabel.textContent = label;
  }

  if (progressLabel) {
    progressLabel.textContent = label;
  }

  if (progressCount) {
    progressCount.textContent = `${pageNumber} / ${notes.length}`;
  }

  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }

  if (footerHint) {
    footerHint.textContent = backCover
      ? "Use Back to revisit the last note."
      : "Use the side arrows to turn pages.";
  }
}

function renderToc() {
  if (!tocList) {
    return;
  }

  tocList.innerHTML = notes
    .map((notePath, index) => {
      const label = getNoteLabel(index);
      return `
        <button class="toc-item" type="button" data-note-index="${index}">
          <span class="toc-item-count">${index + 1}</span>
          <span class="toc-item-label">${label}</span>
        </button>
      `;
    })
    .join("");
}

function updateTocSelection() {
  if (!tocList) {
    return;
  }

  const items = tocList.querySelectorAll(".toc-item");
  items.forEach((item) => {
    const itemIndex = Number(item.getAttribute("data-note-index"));
    const isActive = !isBackCoverOpen && itemIndex === currentIndex;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-current", isActive ? "true" : "false");
  });
}

function closeToc() {
  if (!tocOverlay || !tocToggleBtn) {
    return;
  }

  isTocOpen = false;
  tocOverlay.classList.add("hidden");
  tocOverlay.classList.remove("is-open");
  tocOverlay.setAttribute("aria-hidden", "true");
  tocToggleBtn.classList.remove("is-active");
  tocToggleBtn.setAttribute("aria-label", "Open notes menu");
  tocToggleBtn.setAttribute("title", "Open notes menu");
}

function openToc() {
  if (!tocOverlay || !tocToggleBtn) {
    return;
  }

  isTocOpen = true;
  tocOverlay.classList.remove("hidden");
  tocOverlay.classList.add("is-open");
  tocOverlay.setAttribute("aria-hidden", "false");
  tocToggleBtn.classList.add("is-active");
  tocToggleBtn.setAttribute("aria-label", "Close notes menu");
  tocToggleBtn.setAttribute("title", "Close notes menu");
  updateTocSelection();
}

function toggleToc() {
  if (isTocOpen) {
    closeToc();
    return;
  }

  openToc();
}

function jumpToNote(index) {
  const safeIndex = clamp(index, 0, getLastNoteIndex());

  if (safeIndex === currentIndex && !isBackCoverOpen) {
    closeToc();
    return;
  }

  turnDirection = safeIndex >= currentIndex && !isBackCoverOpen ? 1 : -1;
  clearTurnTimers();
  isTurning = false;
  rightFrame.classList.remove("is-turning");
  flipSheet.classList.remove("is-source-back-cover", "is-target-back-cover", "turning-forward", "turning-backward");
  setBackCoverState(false);
  resetZoomAndTilt();
  updateBlurBackground(safeIndex, { backCover: false });
  triggerSpreadTransition();
  syncVisiblePage(safeIndex, { backCover: false });
  closeToc();
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

function updateBlurBackground(index = currentIndex, options = {}) {
  const backCover = options.backCover ?? isBackCoverOpen;
  const safeIndex = clamp(index, 0, getLastNoteIndex());
  const previousImage = hasNotes() ? notes[Math.max(safeIndex - 1, 0)] : BACK_COVER_IMAGE;
  const currentImage = backCover ? BACK_COVER_IMAGE : getImagePath(safeIndex, false);
  const nextImage = backCover
    ? BACK_COVER_IMAGE
    : notes[Math.min(safeIndex + 1, getLastNoteIndex())];

  if (blurPrev) {
    blurPrev.style.backgroundImage = `url("${previousImage}")`;
  }

  if (blurCurrent) {
    blurCurrent.style.backgroundImage = `url("${currentImage}")`;
  }

  if (blurNext) {
    blurNext.style.backgroundImage = `url("${nextImage || currentImage}")`;
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

function syncVisiblePage(index = currentIndex, options = {}) {
  const backCover = options.backCover ?? false;
  const safeIndex = clamp(index, 0, getLastNoteIndex());
  const imagePath = getImagePath(safeIndex, backCover);

  currentIndex = safeIndex;
  window.__ebookIndex = backCover ? notes.length : safeIndex;
  setBackCoverState(backCover);
  rightImage.src = imagePath;
  rightImage.alt = backCover ? "Back cover view" : `Interactive view for ${imagePath}`;

  updateIndicator(safeIndex, { backCover });
  updateButtons();
  preloadAround(safeIndex);
}

function runTurnAnimation(fromState, toState) {
  const previousImage = getImagePath(fromState.index, fromState.backCover);
  const nextImage = getImagePath(toState.index, toState.backCover);

  if (!flipSheet || !flipImage || !flipBackImage || !previousImage || !nextImage) {
    syncVisiblePage(toState.index, { backCover: toState.backCover });
    return;
  }

  clearTurnTimers();
  isTurning = true;
  flipImage.src = previousImage;
  flipBackImage.src = nextImage;
  flipImage.alt = fromState.backCover ? "Back cover page turn" : "";
  flipBackImage.alt = toState.backCover ? "Back cover page reveal" : "";
  flipSheet.classList.toggle("is-source-back-cover", fromState.backCover);
  flipSheet.classList.toggle("is-target-back-cover", toState.backCover);

  syncVisiblePage(toState.index, { backCover: toState.backCover });

  rightFrame.classList.remove("is-turning");
  flipSheet.classList.remove("turning-forward", "turning-backward");

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      rightFrame.classList.add("is-turning");
      flipSheet.classList.add(turnDirection >= 0 ? "turning-forward" : "turning-backward");

      turnCleanupTimer = window.setTimeout(() => {
        isTurning = false;
        rightFrame.classList.remove("is-turning");
        flipSheet.classList.remove("is-source-back-cover", "is-target-back-cover", "turning-forward", "turning-backward");
        updateButtons();
        clearTurnTimers();
      }, TURN_DURATION_MS);
    });
  });
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

function renderPage(index) {
  updateBlurBackground(index, { backCover: false });
  resetZoomAndTilt();
  triggerSpreadTransition();
  syncVisiblePage(index, { backCover: false });
}

function renderBackCover() {
  const lastNoteIndex = getLastNoteIndex();
  updateBlurBackground(lastNoteIndex, { backCover: true });
  resetZoomAndTilt();
  triggerSpreadTransition();
  syncVisiblePage(lastNoteIndex, { backCover: true });
}

function showBook() {
  launchPage.classList.add("hidden");
  ebook.classList.remove("hidden");
  launchPage.style.display = "none";
  ebook.style.display = "grid";
  closeToc();
  setBackCoverState(false);
  preloadAround(currentIndex);
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
  closeToc();
  currentIndex = 0;
  turnDirection = 1;
  isTurning = false;
  clearTurnTimers();
  setBackCoverState(false);
  resetZoomAndTilt();
  updateBlurBackground(0, { backCover: false });
  syncVisiblePage(0, { backCover: false });

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

function getNextState(step) {
  if (!hasNotes() || step === 0) {
    return null;
  }

  if (step > 0) {
    if (isBackCoverOpen) {
      return null;
    }

    if (currentIndex === getLastNoteIndex()) {
      return { index: getLastNoteIndex(), backCover: true };
    }

    return { index: clamp(currentIndex + 1, 0, getLastNoteIndex()), backCover: false };
  }

  if (isBackCoverOpen) {
    return { index: getLastNoteIndex(), backCover: false };
  }

  if (currentIndex === 0) {
    return null;
  }

  return { index: clamp(currentIndex - 1, 0, getLastNoteIndex()), backCover: false };
}

function changePage(step) {
  if (isTurning) {
    return;
  }

  const targetState = getNextState(step);
  if (!targetState) {
    return;
  }

  const fromState = {
    index: isBackCoverOpen ? getLastNoteIndex() : currentIndex,
    backCover: isBackCoverOpen
  };

  turnDirection = step > 0 ? 1 : -1;
  resetZoomAndTilt();
  updateBlurBackground(targetState.index, { backCover: targetState.backCover });
  preloadAround(targetState.index);
  playFlipSound();
  runTurnAnimation(fromState, targetState);
}

async function toggleFullscreen() {
  if (!fullscreenBtn) {
    return;
  }

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

if (fullscreenBtn) {
  fullscreenBtn.addEventListener("click", () => {
    toggleFullscreen().catch(() => {});
  });
}

if (tocToggleBtn) {
  tocToggleBtn.addEventListener("click", () => {
    toggleToc();
  });
}

if (tocCloseBtn) {
  tocCloseBtn.addEventListener("click", () => {
    closeToc();
  });
}

if (tocBackdrop) {
  tocBackdrop.addEventListener("click", () => {
    closeToc();
  });
}

if (tocList) {
  tocList.addEventListener("click", (event) => {
    const target = event.target.closest(".toc-item");
    if (!target) {
      return;
    }

    jumpToNote(Number(target.getAttribute("data-note-index")));
  });
}

document.addEventListener("fullscreenchange", () => {
  if (!fullscreenBtn) {
    return;
  }

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

  if (event.key === "Escape" && isTocOpen) {
    event.preventDefault();
    closeToc();
  }

  if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    toggleFullscreen().catch(() => {});
  }
});

renderToc();
updateTocSelection();
preloadAround(0);
