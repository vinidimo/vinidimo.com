(() => {
    function initSharedLayout() {
        const header = document.querySelector(".site-header");
        const nav = header?.querySelector("nav") ?? null;
        const hamburger = header?.querySelector(".hamburger") ?? null;
        const navLinks = nav ? [...nav.querySelectorAll("a")] : [];

        function setMenuState(isOpen) {
            if (!nav || !hamburger) return;
            nav.classList.toggle("open", isOpen);
            hamburger.classList.toggle("active", isOpen);
            hamburger.setAttribute("aria-expanded", String(isOpen));
            hamburger.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
        }

        function updateHeader() {
            header?.classList.toggle("scrolled", window.scrollY > 40);
        }

        navLinks.forEach((link, index) => {
            link.style.setProperty("--nav-item-index", String(index));
            link.addEventListener("click", () => setMenuState(false));
        });

        hamburger?.addEventListener("click", () => setMenuState(!nav?.classList.contains("open")));
        window.addEventListener("scroll", updateHeader, { passive: true });
        updateHeader();

        const currentYear = String(new Date().getFullYear());
        document.querySelectorAll("[data-current-year], #year").forEach(element => {
            element.textContent = currentYear;
        });

        const measurementCanvas = document.createElement("canvas");
        const measurementContext = measurementCanvas.getContext("2d");

        function getWordmarkTextHeight(wordmark) {
            if (!measurementContext) return wordmark.getBoundingClientRect().height;

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
            document.querySelectorAll(".site-header .brand, .site-footer .footer-brand").forEach(lockup => {
                const symbol = lockup.querySelector("img");
                const wordmark = lockup.querySelector(".brand-wordmark, .footer-name");
                if (!symbol || !wordmark) return;

                const textHeight = getWordmarkTextHeight(wordmark);
                if (!textHeight) return;

                const proportionUnit = textHeight / 3;
                lockup.style.setProperty("--lockup-symbol-height", `${(proportionUnit * 5).toFixed(2)}px`);
                lockup.style.setProperty("--lockup-gap", `${proportionUnit.toFixed(2)}px`);
            });
        }

        const logoLockupResizeObserver = typeof ResizeObserver === "function"
            ? new ResizeObserver(measureLogoLockups)
            : null;

        document.querySelectorAll(".site-header .brand-wordmark, .site-footer .footer-name").forEach(wordmark => {
            logoLockupResizeObserver?.observe(wordmark);
        });

        measureLogoLockups();
        window.addEventListener("resize", measureLogoLockups);
        document.fonts?.ready.then(measureLogoLockups);

        const footer = document.querySelector(".site-footer");
        const footerHost = footer?.parentElement ?? null;
        const content = footerHost?.querySelector(":scope > main") ?? null;
        if (!footer || !content) return;

        content.classList.add("footer-reveal-surface");
        footer.classList.add("footer-reveal-footer");
        document.body.style.setProperty("--footer-page-background", getComputedStyle(document.body).background);

        const spacer = document.createElement("div");
        spacer.className = "footer-reveal-spacer";
        spacer.setAttribute("aria-hidden", "true");
        footer.before(spacer);

        function updateFooterSpace() {
            const footerHeight = Math.ceil(footer.getBoundingClientRect().height);
            const headerHeight = Math.ceil(header?.getBoundingClientRect().height || 0);
            document.body.style.setProperty("--footer-reveal-height", `${footerHeight}px`);
            document.body.classList.toggle("footer-reveal", footerHeight + headerHeight + 16 <= window.innerHeight);
        }

        updateFooterSpace();
        if (typeof ResizeObserver === "function") {
            new ResizeObserver(updateFooterSpace).observe(footer);
        }
        window.addEventListener("resize", updateFooterSpace);

        footer.addEventListener("focusin", () => {
            if (document.body.classList.contains("footer-reveal")) {
                window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initSharedLayout, { once: true });
    } else {
        initSharedLayout();
    }
})();
