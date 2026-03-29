const printNotes = window.__ebookNotes || [];
const frontCover = window.__ebookFrontCover || "assets/images/Launch Page.png";
const backCover = window.__ebookBackCover || "assets/images/back_cover.png";

const printBook = document.getElementById("printBook");
const printableCount = document.getElementById("printableCount");
const printBtn = document.getElementById("printBtn");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPrintableBook() {
  const pages = [
    { path: frontCover, label: "Front Cover" },
    ...printNotes.map((path) => ({ path, label: "Printable note" })),
    { path: backCover, label: "Back Cover" }
  ];

  if (printableCount) {
    printableCount.textContent = `${pages.length} printable pages`;
  }

  if (!printBook) {
    return;
  }

  printBook.innerHTML = pages
    .map((page) => `
      <section class="print-page">
        <div class="print-frame">
          <img src="${escapeHtml(page.path)}" alt="${escapeHtml(page.label)}" loading="eager" />
        </div>
      </section>
    `)
    .join("");
}

if (printBtn) {
  printBtn.addEventListener("click", () => {
    window.print();
  });
}

renderPrintableBook();
