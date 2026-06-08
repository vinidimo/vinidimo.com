function setupArticleProgress() {
    const progressBar = document.querySelector(".article-progress-bar");
    const article = document.querySelector(".blog-article");

    if (!progressBar || !article) {
        return;
    }

    function updateArticleProgress() {
        const articleRect = article.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const scrollTop = window.scrollY || window.pageYOffset || 0;
        const articleTop = scrollTop + articleRect.top;
        const articleHeight = article.scrollHeight;
        const articleBottom = articleTop + articleHeight;
        const maxScrollable = Math.max(articleBottom - articleTop - viewportHeight, 1);
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
