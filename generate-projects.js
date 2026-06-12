const fs = require("fs");
const path = require("path");

const projectsRoot = path.join(__dirname, "assets", "projects");
const outputPath = path.join(projectsRoot, "projects.json");
const indexPath = path.join(__dirname, "index.html");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

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

function readProjectDirectory(projectDirName) {
    const projectDirPath = path.join(projectsRoot, projectDirName);
    const metaPath = path.join(projectDirPath, "project.json");

    if (!fs.existsSync(metaPath)) {
        throw new Error(`Missing project.json in ${projectDirName}`);
    }

    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    const images = fs.readdirSync(projectDirPath)
        .filter(fileName => imageExtensions.has(path.extname(fileName).toLowerCase()))
        .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }))
        .map(fileName => toWebPath("assets", "projects", projectDirName, fileName));

    if (!images.length) {
        throw new Error(`No images found in ${projectDirName}`);
    }

    return {
        slug: projectDirName,
        title: meta.title,
        description: meta.description,
        order: Number.isFinite(meta.order) ? meta.order : Number.MAX_SAFE_INTEGER,
        cover: images[0],
        images
    };
}

function normalizeProjectOrders(projects) {
    let nextAvailableOrder = 1;

    return projects.map(project => {
        const requestedOrder = project.order;
        const order = requestedOrder === Number.MAX_SAFE_INTEGER
            ? nextAvailableOrder
            : Math.max(requestedOrder, nextAvailableOrder);

        nextAvailableOrder = order + 1;
        return { ...project, order };
    });
}

function buildProjectSlides(projects) {
    return projects.map((project, index) => `                    <div class="slide" data-project-index="${index}">
                        <img src="${escapeHtml(project.cover)}" alt="${escapeHtml(project.title)}" loading="lazy" decoding="async" width="900" height="670">
                        <div class="slide-hover">
                            <span class="slide-hover-eyebrow">Ver projeto</span>
                            <span class="slide-hover-title">${escapeHtml(project.title)}</span>
                        </div>
                    </div>`).join("\n");
}

function buildProjectsScript(projects) {
    return `    <script id="portfolio-projects-data" type="application/json">
${JSON.stringify(projects, null, 2)}
    </script>`;
}

const projects = normalizeProjectOrders(fs.readdirSync(projectsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => readProjectDirectory(entry.name))
    .sort((a, b) => {
        if (a.order !== b.order) {
            return a.order - b.order;
        }

        return a.title.localeCompare(b.title, "pt-BR");
    }));

fs.writeFileSync(outputPath, `${JSON.stringify(projects, null, 2)}\n`, "utf8");

const indexHtml = fs.readFileSync(indexPath, "utf8");
const updatedIndexWithSlides = indexHtml.replace(
    /(\s*<!-- portfolio-slides:start -->)[\s\S]*?(<!-- portfolio-slides:end -->)/,
    `$1\n${buildProjectSlides(projects)}\n                    $2`
);
const updatedIndex = updatedIndexWithSlides.replace(
    /[ \t]*<script id="portfolio-projects-data" type="application\/json">[\s\S]*?<\/script>/,
    buildProjectsScript(projects)
);

fs.writeFileSync(indexPath, updatedIndex, "utf8");
console.log(`Updated ${path.relative(__dirname, outputPath)}`);
console.log(`Updated ${path.relative(__dirname, indexPath)}`);
