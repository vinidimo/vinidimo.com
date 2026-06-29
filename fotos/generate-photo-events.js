const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const photosRoot = __dirname;
const eventsSourceRoot = path.join(repoRoot, "assets", "photo-events");
const homeOutputPath = path.join(photosRoot, "index.html");
const eventsJsonOutputPath = path.join(photosRoot, "events.json");
const outputAssetsRoot = path.join(photosRoot, "assets");
const outputSiteAssetsRoot = path.join(outputAssetsRoot, "site");
const outputEventAssetsRoot = path.join(outputAssetsRoot, "events");
const mainSiteUrl = "https://vinidimo.com";
const photosSiteUrl = `${mainSiteUrl}/fotos`;

function toWebPath(...parts) {
    return parts.join("/").replace(/\\/g, "/");
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function formatCountLabel(count) {
    return `${count} ${count === 1 ? "foto" : "fotos"}`;
}

function copyPublicAsset(sourceWebPath, destinationRelativePath) {
    const sourcePath = path.join(repoRoot, sourceWebPath);
    const destinationPath = path.join(photosRoot, destinationRelativePath);

    if (!fs.existsSync(sourcePath)) {
        throw new Error(`Missing asset: ${sourceWebPath}`);
    }

    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFileSync(sourcePath, destinationPath);

    return toWebPath(destinationRelativePath);
}

function prepareSharedAssets() {
    return {
        logoBlack: copyPublicAsset(toWebPath("assets", "logo-black.svg"), toWebPath("assets", "site", "logo-black.svg")),
        logoWhite: copyPublicAsset(toWebPath("assets", "logo-white.svg"), toWebPath("assets", "site", "logo-white.svg"))
    };
}

function readEventDirectory(dirName) {
    const eventDir = path.join(eventsSourceRoot, dirName);
    const eventMetaPath = path.join(eventDir, "event.json");

    if (!fs.existsSync(eventMetaPath)) {
        throw new Error(`Missing event.json in ${dirName}`);
    }

    const meta = JSON.parse(fs.readFileSync(eventMetaPath, "utf8"));
    const slug = meta.slug || dirName;
    const photos = (meta.photos || []).map((photo, index) => {
        const fileName = `${String(index + 1).padStart(3, "0")}-${path.basename(photo.src)}`;

        return {
            src: copyPublicAsset(photo.src, toWebPath("assets", "events", slug, fileName)),
            alt: photo.alt || `${meta.title} - foto ${index + 1}`,
            code: photo.code || `${meta.codePrefix || slug.toUpperCase()}-${String(index + 1).padStart(3, "0")}`
        };
    });

    if (!meta.title) {
        throw new Error(`Missing title in ${dirName}`);
    }

    if (!photos.length) {
        throw new Error(`No photos declared in ${dirName}`);
    }

    return {
        slug,
        title: meta.title,
        displayDate: meta.displayDate || meta.date || "Data a confirmar",
        date: meta.date || "",
        location: meta.location || "Local a confirmar",
        category: meta.category || "Evento",
        description: meta.description || "",
        cover: meta.cover
            ? copyPublicAsset(meta.cover, toWebPath("assets", "events", slug, `cover-${path.basename(meta.cover)}`))
            : photos[0].src,
        codePrefix: meta.codePrefix || slug.toUpperCase(),
        watermark: meta.watermark || "vinidimo preview",
        salesPhone: meta.salesPhone || "5511945144513",
        photos
    };
}

function buildHome(events, sharedAssets) {
    const cards = events.length
        ? events.map(event => `            <a class="event-card event-card--catalog" href="./${escapeHtml(event.slug)}/" data-event-search="${escapeHtml([event.title, event.category, event.displayDate].join(" ").toLowerCase())}">
                <div class="event-card-cover">
                    <img src="./${escapeHtml(event.cover)}" alt="${escapeHtml(event.title)}" loading="lazy" decoding="async">
                    <span class="event-card-pattern" aria-hidden="true"></span>
                    <span class="event-card-badge event-card-badge--top">${escapeHtml(event.category)}</span>
                    <div class="event-card-copy event-card-copy--overlay">
                        <div class="event-card-copy-main">
                            <h2>${escapeHtml(event.title)}</h2>
                        </div>
                        <div class="event-card-meta event-card-meta--overlay">
                            <span>${escapeHtml(event.displayDate)}</span>
                            <span>${formatCountLabel(event.photos.length)}</span>
                        </div>
                    </div>
                </div>
            </a>`).join("\n")
        : `            <div class="event-empty">
                <h2>Nenhum evento publicado ainda</h2>
                <p>Quando voce adicionar eventos em <code>assets/photo-events</code> e rodar o gerador, eles aparecerao aqui.</p>
            </div>`;

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Galerias de eventos com previews protegidos por marca d'agua e selecao por codigo para compra de fotos.">
    <meta name="robots" content="index,follow">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="pt_BR">
    <meta property="og:site_name" content="vinidimo fotos">
    <meta property="og:title" content="vinidimo fotos | Galerias de eventos">
    <meta property="og:description" content="Selecione as fotos do seu evento por codigo e envie seu pedido direto pelo WhatsApp.">
    <meta property="og:image" content="${escapeHtml(`${photosSiteUrl}/${events[0]?.cover || "assets/site/logo-black.svg"}`)}">
    <title>vinidimo fotos | Galerias de eventos</title>
    <link rel="canonical" href="${photosSiteUrl}/">
    <link rel="icon" type="image/svg+xml" href="./${escapeHtml(sharedAssets.logoBlack)}" media="(prefers-color-scheme: light)">
    <link rel="icon" type="image/svg+xml" href="./${escapeHtml(sharedAssets.logoWhite)}" media="(prefers-color-scheme: dark)">
    <link rel="stylesheet" href="./styles.css">
</head>
<body>
    <div class="photo-shell">
        <header class="photo-header">
            <div class="photo-header-inner">
                <a class="photo-brand" href="./">
                    <img src="./${escapeHtml(sharedAssets.logoWhite)}" alt="vinidimo">
                    <span>vinidimo</span>
                </a>
            </div>
        </header>

        <main class="photo-main">
            <section class="events-filter-bar" aria-label="Filtrar eventos">
                <div class="events-filter-group">
                    <div class="events-search">
                        <label class="events-filter-label" for="event-search-input">Buscar evento</label>
                        <input class="events-search-input" id="event-search-input" type="search" placeholder="Digite nome, categoria ou data" autocomplete="off" data-event-search-input>
                    </div>
                </div>
            </section>

            <section class="event-grid event-grid--catalog" aria-label="Galerias de eventos" data-events-grid>
${cards}
            </section>
        </main>

        <footer class="photo-footer">
            <div class="photo-footer-inner">
                <p>Copyright &copy; <span data-current-year></span> vinidimo</p>
            </div>
        </footer>
    </div>
    <script src="./main.js"></script>
</body>
</html>
`;
}

function buildPhotoCards(event) {
    return event.photos.map((photo, index) => `                <article class="photo-card">
                    <div class="photo-tile">
                        <button class="photo-preview-button" type="button" data-preview-index="${index}" aria-label="Ampliar ${escapeHtml(photo.code)}">
                            <span class="photo-frame" data-watermark="${escapeHtml(event.watermark)}">
                                <img src="../${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt)}" loading="lazy" decoding="async">
                            </span>
                        </button>
                        <span class="photo-card-overlay">
                            <button class="photo-select-button" type="button" data-photo-code="${escapeHtml(photo.code)}" aria-pressed="false" aria-label="Selecionar ${escapeHtml(photo.code)}">
                                <span class="photo-select-indicator" aria-hidden="true"></span>
                            </button>
                            <span class="photo-code-badge">${escapeHtml(photo.code)}</span>
                        </span>
                    </div>
                </article>`).join("\n");
}

function buildEventPage(event, sharedAssets) {
    const eventData = {
        slug: event.slug,
        title: event.title,
        salesPhone: event.salesPhone,
        photos: event.photos.map(photo => ({
            code: photo.code,
            alt: photo.alt,
            src: `../${photo.src}`
        }))
    };

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${escapeHtml(event.description)}">
    <meta name="robots" content="index,follow">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="pt_BR">
    <meta property="og:site_name" content="vinidimo fotos">
    <meta property="og:title" content="${escapeHtml(event.title)} | vinidimo fotos">
    <meta property="og:description" content="${escapeHtml(event.description)}">
    <meta property="og:image" content="${escapeHtml(`${photosSiteUrl}/${event.cover}`)}">
    <title>${escapeHtml(event.title)} | vinidimo fotos</title>
    <link rel="canonical" href="${photosSiteUrl}/${escapeHtml(event.slug)}/">
    <link rel="icon" type="image/svg+xml" href="../${escapeHtml(sharedAssets.logoBlack)}" media="(prefers-color-scheme: light)">
    <link rel="icon" type="image/svg+xml" href="../${escapeHtml(sharedAssets.logoWhite)}" media="(prefers-color-scheme: dark)">
    <link rel="stylesheet" href="../styles.css">
</head>
<body>
    <div class="photo-shell">
        <header class="photo-header">
            <div class="photo-header-inner">
                <a class="photo-brand" href="../">
                    <img src="../${escapeHtml(sharedAssets.logoWhite)}" alt="vinidimo">
                    <span>vinidimo</span>
                </a>
            </div>
        </header>

        <main class="event-main">
            <section class="event-grid-header">
                <div>
                    <h2>${escapeHtml(event.title)}</h2>
                </div>
            </section>

            <section class="photo-grid" aria-label="Fotos do evento">
${buildPhotoCards(event)}
            </section>

            <section class="selection-summary" data-selection-summary hidden>
                <div class="selection-summary-inner">
                    <div class="selection-summary-copy">
                        <strong><span data-selection-count>0</span> fotos selecionadas</strong>
                        <p class="selection-codes-preview" data-selection-preview>Nenhuma foto selecionada ainda.</p>
                    </div>
                    <div class="selection-summary-actions">
                        <button class="summary-button is-ghost" type="button" data-clear-selection>Deselecionar</button>
                        <button class="summary-button" type="button" data-copy-selection>Copiar codigos</button>
                        <a class="summary-button is-primary" data-whatsapp-selection href="https://wa.me/${escapeHtml(event.salesPhone)}" target="_blank" rel="noopener noreferrer">Fazer pedido</a>
                    </div>
                </div>
            </section>
        </main>

        <footer class="photo-footer">
            <div class="photo-footer-inner">
                <p>Copyright &copy; <span data-current-year></span> vinidimo</p>
            </div>
        </footer>
    </div>

    <div class="lightbox" data-lightbox hidden>
        <div class="lightbox-dialog">
            <div class="lightbox-stage">
                <img class="lightbox-image" data-lightbox-image src="" alt="">
            </div>
        </div>
    </div>

    <script id="photo-event-data" type="application/json">
${JSON.stringify(eventData, null, 2)}
    </script>
    <script src="../main.js"></script>
</body>
</html>
`;
}

const events = fs.readdirSync(eventsSourceRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => readEventDirectory(entry.name))
    .sort((first, second) => {
        if (first.date && second.date && first.date !== second.date) {
            return second.date.localeCompare(first.date);
        }

        return first.title.localeCompare(second.title, "pt-BR");
    });

fs.mkdirSync(outputAssetsRoot, { recursive: true });
fs.mkdirSync(outputSiteAssetsRoot, { recursive: true });
fs.mkdirSync(outputEventAssetsRoot, { recursive: true });

const sharedAssets = prepareSharedAssets();

fs.writeFileSync(homeOutputPath, buildHome(events, sharedAssets), "utf8");
fs.writeFileSync(eventsJsonOutputPath, `${JSON.stringify(events, null, 2)}\n`, "utf8");

events.forEach(event => {
    const eventOutputDir = path.join(photosRoot, event.slug);
    const eventOutputPath = path.join(eventOutputDir, "index.html");
    fs.mkdirSync(eventOutputDir, { recursive: true });
    fs.writeFileSync(eventOutputPath, buildEventPage(event, sharedAssets), "utf8");
});

console.log(`Updated ${path.relative(repoRoot, homeOutputPath)}`);
console.log(`Updated ${path.relative(repoRoot, eventsJsonOutputPath)}`);
events.forEach(event => {
    console.log(`Updated ${path.relative(repoRoot, path.join(photosRoot, event.slug, "index.html"))}`);
});
