const { execFileSync } = require("child_process");
const path = require("path");

const repoRoot = __dirname;
const generators = [
    "generate-projects.js",
    path.join("blog", "generate-articles.js"),
    path.join("fotos", "generate-photo-events.js"),
    "generate-layout.js"
];

generators.forEach(generator => {
    execFileSync(process.execPath, [path.join(repoRoot, generator)], {
        cwd: repoRoot,
        stdio: "inherit"
    });
});
