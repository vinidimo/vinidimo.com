const fs = require("fs");
const path = require("path");

const projectsRoot = path.join(__dirname, "assets", "projects");
const outputPath = path.join(projectsRoot, "projects.json");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

function toWebPath(...parts) {
    return parts.join("/").replace(/\\/g, "/");
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

const projects = fs.readdirSync(projectsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => readProjectDirectory(entry.name))
    .sort((a, b) => {
        if (a.order !== b.order) {
            return a.order - b.order;
        }

        return a.title.localeCompare(b.title, "pt-BR");
    });

fs.writeFileSync(outputPath, `${JSON.stringify(projects, null, 2)}\n`, "utf8");
console.log(`Updated ${path.relative(__dirname, outputPath)}`);
