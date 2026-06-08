const fs = require("fs");
const path = require("path");

const blogRoot = __dirname;
const repoRoot = path.resolve(blogRoot, "..");
const outputPath = path.join(blogRoot, "articles.json");
const blogIndexPath = path.join(blogRoot, "index.html");
const sitemapPath = path.join(repoRoot, "sitemap.xml");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);
const siteUrl = "https://vinidimo.com";
const defaultLastmod = "2026-06-08";

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

function readArticleDirectory(dirName) {
    const articleDir = path.join(blogRoot, dirName);
    const metaPath = path.join(articleDir, "article.json");

    if (!fs.existsSync(metaPath)) {
        throw new Error(`Missing article.json in ${dirName}`);
    }

    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    const coverFile = fs.readdirSync(articleDir)
        .filter(fileName => imageExtensions.has(path.extname(fileName).toLowerCase()))
        .sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true }))[0];

    if (!coverFile) {
        throw new Error(`No image found in ${dirName}`);
    }

    return {
        slug: meta.slug || dirName,
        title: meta.title,
        description: meta.description,
        category: meta.category,
        intro: meta.intro,
        tag: meta.tag,
        readTime: meta.readTime,
        displayDate: meta.displayDate,
        datePublished: meta.datePublished,
        order: Number.isFinite(meta.order) ? meta.order : Number.MAX_SAFE_INTEGER,
        cover: toWebPath("blog", dirName, coverFile),
        tagColor: meta.tagColor || "#d0bb57"
    };
}

function buildCard(article) {
    const coverRelative = `./${article.slug}/${path.basename(article.cover)}`;
    return `                    <a class="blog-post-card" href="./${article.slug}/" style="--tag-color: ${article.tagColor}; --card-background: linear-gradient(180deg, rgba(7, 15, 24, 0.16), rgba(7, 15, 24, 0.8)), url('${coverRelative}');">
                        <div class="title-content">
                            <h3>${escapeHtml(article.title)}</h3>
                            <hr>
                        </div>
                        <div class="card-info">
                            ${escapeHtml(article.intro)}
                        </div>
                        <div class="card-cta">Saiba mais &rarr;</div>
                        <div class="utility-info">
                            <ul class="utility-list">
                                <li class="reading-time">${escapeHtml(article.readTime)}</li>
                                <li class="topic-tag">${escapeHtml(article.tag)}</li>
                            </ul>
                        </div>
                        <div class="gradient-overlay"></div>
                        <div class="color-overlay"></div>
                    </a>`;
}

function buildSitemap(articles) {
    const baseEntries = [
        {
            loc: `${siteUrl}/`,
            lastmod: defaultLastmod,
            changefreq: "monthly",
            priority: "1.0"
        },
        {
            loc: `${siteUrl}/blog/`,
            lastmod: defaultLastmod,
            changefreq: "weekly",
            priority: "0.8"
        }
    ];

    const articleEntries = articles.map(article => ({
        loc: `${siteUrl}/blog/${article.slug}/`,
        lastmod: article.datePublished || defaultLastmod,
        changefreq: "monthly",
        priority: "0.7"
    }));

    const entries = [...baseEntries, ...articleEntries];
    const body = entries.map(entry => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

const articles = fs.readdirSync(blogRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(dirName => fs.existsSync(path.join(blogRoot, dirName, "article.json")))
    .map(readArticleDirectory)
    .sort((a, b) => {
        if (a.order !== b.order) {
            return a.order - b.order;
        }

        return a.title.localeCompare(b.title, "pt-BR");
    });

fs.writeFileSync(outputPath, `${JSON.stringify(articles, null, 2)}\n`, "utf8");

const blogIndex = fs.readFileSync(blogIndexPath, "utf8");
const cardsMarkup = articles.map(buildCard).join("\n\n");
const updatedBlogIndex = blogIndex.replace(
    /(\s*<!-- blog-cards:start -->)[\s\S]*?(<!-- blog-cards:end -->)/,
    `$1\n${cardsMarkup}\n                    $2`
);

fs.writeFileSync(blogIndexPath, updatedBlogIndex, "utf8");
fs.writeFileSync(sitemapPath, buildSitemap(articles), "utf8");

console.log(`Updated ${path.relative(repoRoot, outputPath)}`);
console.log(`Updated ${path.relative(repoRoot, blogIndexPath)}`);
console.log(`Updated ${path.relative(repoRoot, sitemapPath)}`);
