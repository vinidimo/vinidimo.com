const currentYear = String(new Date().getFullYear());

document.querySelectorAll("[data-current-year]").forEach(element => {
    element.textContent = currentYear;
});

const legacyYearElement = document.getElementById("year");

if (legacyYearElement && !legacyYearElement.textContent.trim()) {
    legacyYearElement.textContent = currentYear;
}

const measurementCanvas = document.createElement("canvas");
const measurementContext = measurementCanvas.getContext("2d");

function getWordmarkTextHeight(wordmark) {
    if (!measurementContext) {
        return wordmark.getBoundingClientRect().height;
    }

    const computedStyle = window.getComputedStyle(wordmark);
    const fallbackFont = [
        computedStyle.fontStyle,
        computedStyle.fontWeight,
        computedStyle.fontSize,
        computedStyle.fontFamily
    ].filter(Boolean).join(" ");
    measurementContext.font = computedStyle.font && computedStyle.font !== "normal normal normal medium / normal none running 0px / 0px serif"
        ? computedStyle.font
        : fallbackFont;

    const metrics = measurementContext.measureText(wordmark.textContent?.trim() || "");
    const actualHeight = (metrics.actualBoundingBoxAscent || 0) + (metrics.actualBoundingBoxDescent || 0);

    return actualHeight || wordmark.getBoundingClientRect().height;
}

function measureLogoLockups() {
    document.querySelectorAll(".brand, .footer-brand, .blog-brand, .photo-brand").forEach(lockup => {
        const symbol = lockup.querySelector("img");
        const wordmark = lockup.querySelector(".brand-wordmark, .footer-name, span");

        if (!symbol || !wordmark) {
            return;
        }

        const textHeight = getWordmarkTextHeight(wordmark);
        if (!textHeight) {
            return;
        }

        const part = textHeight / 3;
        const symbolHeight = part * 5;
        const gap = part;

        lockup.style.setProperty("--lockup-symbol-height", `${symbolHeight.toFixed(2)}px`);
        lockup.style.setProperty("--lockup-gap", `${gap.toFixed(2)}px`);
    });
}

const logoLockupResizeObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver(() => measureLogoLockups())
    : null;

function initLogoLockupMeasurement() {
    document.querySelectorAll(".brand, .footer-brand, .blog-brand, .photo-brand").forEach(lockup => {
        const wordmark = lockup.querySelector(".brand-wordmark, .footer-name, span");
        if (wordmark && logoLockupResizeObserver) {
            logoLockupResizeObserver.observe(wordmark);
        }
    });

    measureLogoLockups();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLogoLockupMeasurement, { once: true });
} else {
    initLogoLockupMeasurement();
}

window.addEventListener("resize", measureLogoLockups);

if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
        measureLogoLockups();
    });
}
