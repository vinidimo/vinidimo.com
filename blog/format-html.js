const fs = require("fs");
const path = require("path");

const blogRoot = __dirname;
const htmlFiles = [
    path.join(blogRoot, "index.html"),
    ...fs.readdirSync(blogRoot, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(blogRoot, entry.name, "index.html"))
        .filter(filePath => fs.existsSync(filePath))
];

const voidTags = new Set([
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr"
]);

function getTagName(line) {
    const match = line.match(/^<\/?([a-zA-Z0-9-]+)/);
    return match ? match[1].toLowerCase() : null;
}

function isOpeningTag(line) {
    return /^<[^/!][^>]*>$/.test(line);
}

function isClosingTag(line) {
    return /^<\/[^>]+>$/.test(line);
}

function isInlineSelfContained(line) {
    if (!line.startsWith("<")) {
        return false;
    }

    if (line.startsWith("<?") || line.startsWith("<!")) {
        return true;
    }

    const tagName = getTagName(line);
    if (!tagName) {
        return true;
    }

    if (voidTags.has(tagName) || line.endsWith("/>")) {
        return true;
    }

    return /^<([a-zA-Z0-9-]+)(?:\s[^>]*)?>.*<\/\1>$/.test(line);
}

function formatHtml(html) {
    const normalized = html
        .replace(/\r\n/g, "\n")
        .replace(/>\s*</g, ">\n<")
        .replace(/\n{2,}/g, "\n")
        .trim();

    const lines = normalized
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);

    let indent = 0;
    const formatted = [];

    lines.forEach(line => {
        if (isClosingTag(line)) {
            indent = Math.max(indent - 1, 0);
        }

        formatted.push(`${"    ".repeat(indent)}${line}`);

        if (isOpeningTag(line) && !isInlineSelfContained(line)) {
            indent += 1;
        }
    });

    return `${formatted.join("\n")}\n`;
}

htmlFiles.forEach(filePath => {
    const html = fs.readFileSync(filePath, "utf8");
    fs.writeFileSync(filePath, formatHtml(html), "utf8");
    console.log(`Formatted ${path.relative(blogRoot, filePath)}`);
});
