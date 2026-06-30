const currentYearElements = document.querySelectorAll("[data-current-year]");
currentYearElements.forEach(element => {
    element.textContent = String(new Date().getFullYear());
});

document.querySelectorAll("img").forEach(image => {
    image.draggable = false;
    image.addEventListener("dragstart", event => event.preventDefault());
});

document.addEventListener("contextmenu", event => {
    if (event.target.closest(".photo-frame, .lightbox-stage")) {
        event.preventDefault();
    }
});

function copyText(value) {
    if (navigator.clipboard?.writeText) {
        return navigator.clipboard.writeText(value);
    }

    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "absolute";
    textArea.style.left = "-9999px";
    document.body.append(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
    return Promise.resolve();
}

function normalizeSearchValue(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
}

function initEventsIndexPage() {
    const searchInput = document.querySelector("[data-event-search-input]");
    const eventCards = [...document.querySelectorAll("[data-event-search]")];

    if (!searchInput || !eventCards.length) {
        return;
    }

    function updateEventFilters() {
        const searchTerm = normalizeSearchValue(searchInput.value);
        eventCards.forEach(card => {
            const searchValue = card.dataset.eventSearch || "";
            card.hidden = searchTerm ? !searchValue.includes(searchTerm) : false;
        });
    }

    searchInput.addEventListener("input", () => {
        updateEventFilters();
    });

    searchInput.addEventListener("search", () => {
        updateEventFilters();
    });

    searchInput.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            searchInput.value = "";
            updateEventFilters();
        }
    });

    updateEventFilters();
}

function initEventPage() {
    const eventScript = document.getElementById("photo-event-data");
    if (!eventScript) {
        return;
    }

    const eventData = JSON.parse(eventScript.textContent || "{}");
    const storageKey = `vinidimo-photo-selection:${eventData.slug}`;
    const summary = document.querySelector("[data-selection-summary]");
    const previewElement = document.querySelector("[data-selection-preview]");
    const countElement = document.querySelector("[data-selection-count]");
    const copyButton = document.querySelector("[data-copy-selection]");
    const whatsappButton = document.querySelector("[data-whatsapp-selection]");
    const clearButton = document.querySelector("[data-clear-selection]");
    const selectButtons = [...document.querySelectorAll("[data-photo-code]")];

    const lightbox = document.querySelector("[data-lightbox]");
    const lightboxImage = document.querySelector("[data-lightbox-image]");
    const previewButtons = [...document.querySelectorAll("[data-preview-index]")];

    const selected = new Set();

    if (!summary || !previewElement || !countElement || !copyButton || !whatsappButton || !clearButton || !lightbox || !lightboxImage) {
        return;
    }

    function readStoredSelection() {
        try {
            const rawValue = localStorage.getItem(storageKey);
            const savedCodes = rawValue ? JSON.parse(rawValue) : [];
            savedCodes.forEach(code => {
                if (eventData.photos.some(photo => photo.code === code)) {
                    selected.add(code);
                }
            });
        } catch (error) {
            console.warn("Nao foi possivel recuperar a selecao salva.", error);
        }
    }

    function persistSelection() {
        try {
            localStorage.setItem(storageKey, JSON.stringify([...selected]));
        } catch (error) {
            console.warn("Nao foi possivel salvar a selecao localmente.", error);
        }
    }

    function buildCodesLabel(codes) {
        if (!codes.length) {
            return "Nenhuma foto selecionada ainda.";
        }

        return codes.join(", ");
    }

    function updateSelectionUI() {
        const codes = [...selected].sort();

        selectButtons.forEach(button => {
            const code = button.dataset.photoCode;
            const isSelected = selected.has(code);
            const tile = button.closest(".photo-card");
            const checkbox = button.querySelector('input[type="checkbox"]');
            button.classList.toggle("is-selected", isSelected);
            button.classList.toggle("image-checkbox-checked", isSelected);
            button.setAttribute("aria-pressed", String(isSelected));
            button.setAttribute("aria-label", `${isSelected ? "Remover" : "Selecionar"} ${code}`);
            if (checkbox) {
                checkbox.checked = isSelected;
            }
            tile?.classList.toggle("is-selected", isSelected);
        });

        summary.hidden = codes.length === 0;
        countElement.textContent = String(codes.length);
        previewElement.textContent = buildCodesLabel(codes);

        const message = [
            `Oi! Quero comprar fotos do evento "${eventData.title}".`,
            "",
            `Codigos selecionados (${codes.length}):`,
            codes.length ? codes.join(", ") : "Nenhum codigo selecionado.",
            "",
            `Pagina do evento: ${window.location.href}`
        ].join("\n");

        whatsappButton.href = `https://wa.me/${eventData.salesPhone}?text=${encodeURIComponent(message)}`;
        persistSelection();
    }

    function toggleSelection(code) {
        if (selected.has(code)) {
            selected.delete(code);
        } else {
            selected.add(code);
        }

        updateSelectionUI();
    }

    function updateLightbox(index) {
        const photo = eventData.photos[index];
        if (!photo) {
            return;
        }

        lightboxImage.src = photo.src;
        lightboxImage.alt = photo.alt;
    }

    function openLightbox(index) {
        updateLightbox(index);
        lightbox.hidden = false;
        document.body.classList.add("photo-locked");
    }

    function closeLightbox() {
        lightbox.hidden = true;
        document.body.classList.remove("photo-locked");
    }

    readStoredSelection();
    updateSelectionUI();

    selectButtons.forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            toggleSelection(button.dataset.photoCode);
        });
    });

    previewButtons.forEach(button => {
        button.addEventListener("click", () => {
            openLightbox(Number(button.dataset.previewIndex));
        });
    });

    copyButton.addEventListener("click", async () => {
        const codes = [...selected].sort();
        await copyText(codes.join(", "));
        copyButton.textContent = "Codigos copiados";
        window.setTimeout(() => {
            copyButton.textContent = "Copiar codigos";
        }, 1800);
    });

    clearButton.addEventListener("click", () => {
        selected.clear();
        updateSelectionUI();
    });

    lightbox.addEventListener("click", event => {
        if (event.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener("keydown", event => {
        if (lightbox.hidden) {
            return;
        }

        if (event.key === "Escape") {
            closeLightbox();
        }
    });
}

initEventPage();
initEventsIndexPage();
