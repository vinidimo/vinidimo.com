function setupArticleProgress() {
    const progressBar = document.querySelector(".article-progress-bar");
    const article = document.querySelector(".blog-article");

    if (!progressBar || !article) {
        return;
    }

    function updateArticleProgress() {
        const articleTop = article.offsetTop;
        const articleHeight = article.offsetHeight;
        const viewportHeight = window.innerHeight;
        const maxScrollable = Math.max(articleHeight - viewportHeight, 1);
        const scrollTop = window.scrollY || window.pageYOffset || 0;
        const rawProgress = (scrollTop - articleTop) / maxScrollable;
        const progress = Math.min(Math.max(rawProgress, 0), 1);

        progressBar.style.width = `${progress * 100}%`;
    }

    window.addEventListener("scroll", updateArticleProgress, { passive: true });
    window.addEventListener("resize", updateArticleProgress);
    updateArticleProgress();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupArticleProgress);
} else {
    setupArticleProgress();
}
