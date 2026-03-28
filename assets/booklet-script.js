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

const FRONT_COVER_IMAGE = "assets/images/Launch Page.png";
const BACK_COVER_IMAGE = window.__ebookBackCover || "assets/images/back_cover.png";
const FRONT_SPACER_COUNT = 1;
const needsTrailingSpacer = (notes.length + 3) % 2 !== 0;
const NOTE_PAGE_OFFSET = 1 + FRONT_SPACER_COUNT + 1;
const FRONT_NOTE_BOOKLET_INDEX = 2;
const BACK_COVER_BOOKLET_INDEX = notes.length + 3 + (needsTrailingSpacer ? 1 : 0);

let bookletCurrentIndex = FRONT_NOTE_BOOKLET_INDEX;
let bookletInitialized = false;
let bookletAnimating = false;
let resizeTimer = null;
let isTocOpen = false;

const launchPage = document.getElementById("launchPage");
const ebook = document.getElementById("ebook");
const interactiveShell = document.querySelector(".interactive-shell");
const blurPrev = document.getElementById("blurPrev");
const blurCurrent = document.getElementById("blurCurrent");
const blurNext = document.getElementById("blurNext");
const bookletViewport = document.getElementById("bookletViewport");
const bookElement = document.getElementById("mybook");
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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function hasNotes() {
  return notes.length > 0;
}

function getLastNoteIndex() {
  return Math.max(notes.length - 1, 0);
}

function getNoteName(index) {
  return notes[index].split("/").pop();
}

function getNoteLabel(index) {
  return getNoteName(index).replace(/\.[^.]+$/, "");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function preloadImage(path) {
  if (!path) {
    return;
  }

  const img = new Image();
  img.src = path;
}

function preloadStaticAssets() {
  preloadImage(FRONT_COVER_IMAGE);
  preloadImage(BACK_COVER_IMAGE);
  notes.forEach(preloadImage);
}

function renderToc() {
  if (!tocList) {
    return;
  }

  tocList.innerHTML = notes
    .map((notePath, index) => `
      <button class="toc-item" type="button" data-note-index="${index}">
        <span class="toc-item-count">${index + 1}</span>
        <span class="toc-item-label">${escapeHtml(getNoteLabel(index))}</span>
      </button>
    `)
    .join("");
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

function getBookletSize() {
  if (!bookletViewport) {
    return { width: 884, height: 620 };
  }

  const rect = bookletViewport.getBoundingClientRect();
  return {
    width: Math.max(320, Math.round(rect.width)),
    height: Math.max(360, Math.round(rect.height))
  };
}

function getVisibleNoteIndices(bookletIndex = bookletCurrentIndex) {
  const visible = [];

  [bookletIndex, bookletIndex + 1].forEach((pageIndex) => {
    const noteIndex = pageIndex - NOTE_PAGE_OFFSET;
    if (noteIndex >= 0 && noteIndex < notes.length) {
      visible.push(noteIndex);
    }
  });

  return [...new Set(visible)];
}

function getBookletIndexForNote(noteIndex) {
  const safeIndex = clamp(noteIndex, 0, getLastNoteIndex());
  const physicalPageIndex = safeIndex + NOTE_PAGE_OFFSET;
  return physicalPageIndex % 2 === 0 ? physicalPageIndex : physicalPageIndex - 1;
}

function syncWindowIndex(bookletIndex = bookletCurrentIndex) {
  if (bookletIndex === 0) {
    window.__ebookIndex = -1;
    return;
  }

  if (bookletIndex === BACK_COVER_BOOKLET_INDEX) {
    window.__ebookIndex = notes.length;
    return;
  }

  const visibleNotes = getVisibleNoteIndices(bookletIndex);
  window.__ebookIndex = visibleNotes.length ? visibleNotes[0] : 0;
}

function updateButtons() {
  if (!prevBtn || !nextBtn) {
    return;
  }

  prevBtn.disabled = bookletAnimating || bookletCurrentIndex === 0;
  nextBtn.disabled = bookletAnimating || bookletCurrentIndex === BACK_COVER_BOOKLET_INDEX;
}

function updateBlurBackground(bookletIndex = bookletCurrentIndex) {
  if (!blurPrev || !blurCurrent || !blurNext) {
    return;
  }

  let previousImage = FRONT_COVER_IMAGE;
  let currentImage = FRONT_COVER_IMAGE;
  let nextImage = notes[0] || BACK_COVER_IMAGE;

  if (bookletIndex === BACK_COVER_BOOKLET_INDEX) {
    previousImage = notes[getLastNoteIndex()] || FRONT_COVER_IMAGE;
    currentImage = BACK_COVER_IMAGE;
    nextImage = BACK_COVER_IMAGE;
  } else if (bookletIndex !== 0) {
    const visibleNotes = getVisibleNoteIndices(bookletIndex);
    if (visibleNotes.length) {
      const firstVisible = visibleNotes[0];
      const lastVisible = visibleNotes[visibleNotes.length - 1];
      previousImage = firstVisible > 0 ? notes[firstVisible - 1] : FRONT_COVER_IMAGE;
      currentImage = notes[firstVisible];
      nextImage = lastVisible < getLastNoteIndex() ? notes[lastVisible + 1] : BACK_COVER_IMAGE;
    }
  }

  blurPrev.style.backgroundImage = `url("${previousImage}")`;
  blurCurrent.style.backgroundImage = `url("${currentImage}")`;
  blurNext.style.backgroundImage = `url("${nextImage}")`;
}

function updateIndicator(bookletIndex = bookletCurrentIndex) {
  const isFrontCover = bookletIndex === 0;
  const isBackCover = bookletIndex === BACK_COVER_BOOKLET_INDEX;
  const visibleNotes = getVisibleNoteIndices(bookletIndex);

  if (interactiveShell) {
    interactiveShell.classList.toggle("is-cover-view", isFrontCover || isBackCover);
    interactiveShell.classList.toggle("is-back-cover-view", isBackCover);
  }

  if (isFrontCover) {
    if (pageIndicator) {
      pageIndicator.textContent = "Front Cover";
    }
    if (noteLabel) {
      noteLabel.textContent = "Front Cover";
    }
    if (progressLabel) {
      progressLabel.textContent = "Front Cover";
    }
    if (progressCount) {
      progressCount.textContent = `0 / ${notes.length}`;
    }
    if (progressBar) {
      progressBar.style.width = "0%";
    }
    if (footerHint) {
      footerHint.textContent = "Use Next to open the ebook.";
    }
    return;
  }

  if (isBackCover) {
    if (pageIndicator) {
      pageIndicator.textContent = "Back Cover";
    }
    if (noteLabel) {
      noteLabel.textContent = "Back Cover";
    }
    if (progressLabel) {
      progressLabel.textContent = "Back Cover";
    }
    if (progressCount) {
      progressCount.textContent = `${notes.length} / ${notes.length}`;
    }
    if (progressBar) {
      progressBar.style.width = "100%";
    }
    if (footerHint) {
      footerHint.textContent = "Use Back to revisit the final notes.";
    }
    return;
  }

  if (!visibleNotes.length) {
    return;
  }

  const firstVisible = visibleNotes[0];
  const lastVisible = visibleNotes[visibleNotes.length - 1];
  const countText = visibleNotes.length === 1
    ? `${firstVisible + 1} / ${notes.length}`
    : `${firstVisible + 1}-${lastVisible + 1} / ${notes.length}`;
  const labelText = visibleNotes.length === 1
    ? getNoteLabel(firstVisible)
    : `${getNoteLabel(firstVisible)} / ${getNoteLabel(lastVisible)}`;
  const indicatorText = visibleNotes.length === 1
    ? `Page ${firstVisible + 1} of ${notes.length} - ${getNoteName(firstVisible)}`
    : `Pages ${firstVisible + 1}-${lastVisible + 1} of ${notes.length}`;
  const progress = ((lastVisible + 1) / notes.length) * 100;

  if (pageIndicator) {
    pageIndicator.textContent = indicatorText;
  }
  if (noteLabel) {
    noteLabel.textContent = labelText;
  }
  if (progressLabel) {
    progressLabel.textContent = labelText;
  }
  if (progressCount) {
    progressCount.textContent = countText;
  }
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }
  if (footerHint) {
    footerHint.textContent = "Use the side arrows to turn pages.";
  }
}

function updateTocSelection() {
  if (!tocList) {
    return;
  }

  const visibleNotes = new Set(getVisibleNoteIndices());
  const items = tocList.querySelectorAll(".toc-item");

  items.forEach((item) => {
    const noteIndex = Number(item.getAttribute("data-note-index"));
    const isActive = visibleNotes.has(noteIndex);
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-current", isActive ? "true" : "false");
  });
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
    // Keep navigation working if playback is blocked.
  }
}

function updateUi(bookletIndex = bookletCurrentIndex) {
  bookletCurrentIndex = bookletIndex;
  syncWindowIndex(bookletIndex);
  updateBlurBackground(bookletIndex);
  updateIndicator(bookletIndex);
  updateButtons();
  updateTocSelection();
}

function renderBookPages() {
  if (!bookElement) {
    return;
  }

  const pageMarkup = [];

  pageMarkup.push(`
    <div class="booklet-page cover-page front-cover-page" data-page-type="front-cover">
      <div class="booklet-page-inner">
        <img src="${FRONT_COVER_IMAGE}" alt="Front cover" />
      </div>
    </div>
  `);

  pageMarkup.push(`
    <div class="booklet-page spacer-page front-spacer-page" data-page-type="inside-front-blank" aria-hidden="true">
      <div class="booklet-page-inner"></div>
    </div>
  `);

  notes.forEach((notePath, index) => {
    pageMarkup.push(`
      <div class="booklet-page note-page" data-note-index="${index}">
        <div class="booklet-page-inner">
          <img src="${notePath}" alt="${escapeHtml(getNoteLabel(index))} note" loading="${index < 4 ? "eager" : "lazy"}" />
        </div>
      </div>
    `);
  });

  if (needsTrailingSpacer) {
    pageMarkup.push(`
      <div class="booklet-page spacer-page back-spacer-page" data-page-type="inside-back-blank" aria-hidden="true">
        <div class="booklet-page-inner"></div>
      </div>
    `);
  }

  pageMarkup.push(`
    <div class="booklet-page cover-page back-cover-page" data-page-type="back-cover">
      <div class="booklet-page-inner">
        <img src="${BACK_COVER_IMAGE}" alt="Back cover" />
      </div>
    </div>
  `);

  bookElement.innerHTML = pageMarkup.join("");
}

function hasBookletLibrary() {
  return Boolean(window.jQuery && window.jQuery.fn && typeof window.jQuery.fn.booklet === "function");
}

function initBooklet() {
  if (bookletInitialized || !bookElement) {
    return;
  }

  renderBookPages();

  if (!hasBookletLibrary()) {
    updateUi(FRONT_NOTE_BOOKLET_INDEX);
    return;
  }

  const $book = window.jQuery(bookElement);
  const size = getBookletSize();

  $book.booklet({
    name: "AI Images Thank You Note eBook",
    width: size.width,
    height: size.height,
    speed: 900,
    closed: true,
    covers: true,
    startingPage: FRONT_NOTE_BOOKLET_INDEX,
    pagePadding: 0,
    pageNumbers: false,
    autoCenter: false,
    hoverWidth: 0,
    hovers: false,
    overlays: false,
    manual: false,
    tabs: false,
    arrows: false,
    change: function changeBooklet(event, data) {
      bookletAnimating = false;
      updateUi(data.index);
    },
    start: function startBooklet(event, data) {
      bookletAnimating = true;
      closeToc();
      playFlipSound();
      updateUi(data.index);
    }
  });

  bookletInitialized = true;
  updateUi(FRONT_NOTE_BOOKLET_INDEX);
}

function goToBookletIndex(bookletIndex) {
  const safeIndex = clamp(bookletIndex, 0, BACK_COVER_BOOKLET_INDEX);

  if (!bookletInitialized || !hasBookletLibrary()) {
    updateUi(safeIndex);
    return;
  }

  if (safeIndex === bookletCurrentIndex) {
    updateUi(safeIndex);
    return;
  }

  window.jQuery(bookElement).booklet("gotopage", safeIndex);
}

function jumpToNote(noteIndex) {
  if (!hasNotes()) {
    return;
  }

  closeToc();
  goToBookletIndex(getBookletIndexForNote(noteIndex));
}

function changePage(step) {
  if (bookletAnimating || !hasNotes()) {
    return;
  }

  if (!bookletInitialized || !hasBookletLibrary()) {
    const fallbackIndex = clamp(bookletCurrentIndex + (step > 0 ? 2 : -2), 0, BACK_COVER_BOOKLET_INDEX);
    updateUi(fallbackIndex);
    return;
  }

  if (step > 0 && bookletCurrentIndex < BACK_COVER_BOOKLET_INDEX) {
    window.jQuery(bookElement).booklet("next");
  }

  if (step < 0 && bookletCurrentIndex > 0) {
    window.jQuery(bookElement).booklet("prev");
  }
}

function updateBookletDimensions() {
  if (!bookletInitialized || !hasBookletLibrary()) {
    return;
  }

  const size = getBookletSize();

  try {
    window.jQuery(bookElement).booklet("option", {
      width: size.width,
      height: size.height
    });
    updateUi(bookletCurrentIndex);
  } catch (error) {
    // Leave the current booklet state in place if resizing is unsupported.
  }
}

function scheduleResizeUpdate() {
  if (resizeTimer !== null) {
    window.clearTimeout(resizeTimer);
  }

  resizeTimer = window.setTimeout(() => {
    resizeTimer = null;
    updateBookletDimensions();
  }, 160);
}

function showBook() {
  if (launchPage) {
    launchPage.classList.add("hidden");
    launchPage.style.display = "none";
  }

  if (ebook) {
    ebook.classList.remove("hidden");
    ebook.style.display = "grid";
  }

  closeToc();
  initBooklet();
  goToBookletIndex(FRONT_NOTE_BOOKLET_INDEX);

  if (!document.fullscreenElement) {
    toggleFullscreen().catch(() => {});
  }
}

function goHome() {
  if (ebook) {
    ebook.classList.add("hidden");
    ebook.style.display = "none";
  }

  if (launchPage) {
    launchPage.classList.remove("hidden");
    launchPage.style.display = "grid";
  }

  closeToc();
  bookletAnimating = false;
  goToBookletIndex(FRONT_NOTE_BOOKLET_INDEX);

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

window.__openEbook = showBook;
window.__changeEbookPage = changePage;
window.__goHome = goHome;

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
  if (event.defaultPrevented) {
    return;
  }

  const launchVisible = launchPage ? !launchPage.classList.contains("hidden") : false;

  if (launchVisible && (event.key === "Enter" || event.key === " ")) {
    event.preventDefault();
    showBook();
    return;
  }

  if (launchVisible) {
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

window.addEventListener("resize", scheduleResizeUpdate);

renderToc();
preloadStaticAssets();
updateUi(FRONT_NOTE_BOOKLET_INDEX);
