const currentYear = String(new Date().getFullYear());

document.querySelectorAll("[data-current-year]").forEach(element => {
    element.textContent = currentYear;
});

const legacyYearElement = document.getElementById("year");

if (legacyYearElement && !legacyYearElement.textContent.trim()) {
    legacyYearElement.textContent = currentYear;
}

function measureLogoLockups() {
    document.querySelectorAll(".brand, .footer-brand, .blog-brand, .photo-brand").forEach(lockup => {
        const symbol = lockup.querySelector("img");
        const wordmark = lockup.querySelector(".brand-wordmark, .footer-name, span");

        if (!symbol || !wordmark) {
            return;
        }

        const textHeight = wordmark.getBoundingClientRect().height;
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
