const fs = require("fs");
const path = require("path");

const repoRoot = __dirname;
const partialsRoot = path.join(repoRoot, "partials");
const headerPartial = fs.readFileSync(path.join(partialsRoot, "header.html"), "utf8").trim();
const footerPartial = fs.readFileSync(path.join(partialsRoot, "footer.html"), "utf8").trim();
const sharedStyle = "<link rel=\"stylesheet\" href=\"/shared-layout.css?v=20260923-15\">";
const sharedScript = "<script src=\"/shared-layout.js?v=20260923-15\"></script>";

function listHtmlFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        if ([".git", "node_modules", "partials"].includes(entry.name)) return [];
        const absolutePath = path.join(directory, entry.name);
        if (entry.isDirectory()) return listHtmlFiles(absolutePath);
        return entry.isFile() && entry.name.endsWith(".html") ? [absolutePath] : [];
    });
}

function replaceComponent(html, name, markup) {
    const markedPattern = new RegExp(`<!-- shared-${name}:start -->[\\s\\S]*?<!-- shared-${name}:end -->`);
    const componentPattern = new RegExp(`<${name}\\b[^>]*>[\\s\\S]*?<\\/${name}>`);
    const generated = `<!-- shared-${name}:start -->\n${markup}\n<!-- shared-${name}:end -->`;

    if (markedPattern.test(html)) return html.replace(markedPattern, generated);
    if (!componentPattern.test(html)) throw new Error(`Missing ${name} in page`);
    return html.replace(componentPattern, generated);
}

function ensureSharedAssets(html) {
    const withoutOldStyle = html.replace(/\s*<link rel="stylesheet" href="\/shared-layout\.css[^\"]*">/g, "");
    const withoutOldScript = withoutOldStyle.replace(/\s*<script src="\/shared-layout\.js[^\"]*"><\/script>/g, "");
    const withoutLegacyYear = withoutOldScript.replace(/\s*<script src="(?:\.\.\/)*year\.js">\s*<\/script>/g, "");
    return withoutLegacyYear
        .replace(/<html(?![^>]*data-shared-layout)([^>]*)>/, "<html data-shared-layout$1>")
        .replace("</head>", `    ${sharedStyle}\n</head>`)
        .replace("</body>", `    ${sharedScript}\n</body>`);
}

function applySharedLayout() {
    const pages = listHtmlFiles(repoRoot);

    pages.forEach(filePath => {
        let html = fs.readFileSync(filePath, "utf8");
        html = replaceComponent(html, "header", headerPartial);
        if (path.basename(filePath) !== "404.html") {
            html = replaceComponent(html, "footer", footerPartial);
        }
        html = ensureSharedAssets(html);
        fs.writeFileSync(filePath, html, "utf8");
    });

    return pages;
}

if (require.main === module) {
    const pages = applySharedLayout();
    console.log(`Updated shared layout in ${pages.length} pages.`);
}

module.exports = { applySharedLayout };
