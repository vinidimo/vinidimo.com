document.getElementById("year").textContent = new Date().getFullYear();

// Header and navigation
const header = document.querySelector("header");
const nav = document.querySelector("header nav");
const hamburger = document.getElementById("hamburger");
const navLinks = [...document.querySelectorAll("header nav a")];
const sections = navLinks
    .map(link => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
const heroSlides = [...document.querySelectorAll(".hero-slideshow img")];
const carousel = document.querySelector(".infinite-carousel");
const viewport = carousel.querySelector(".carousel-viewport");
const prevButton = document.querySelector(".carousel-control-previous");
const nextButton = document.querySelector(".carousel-control-next");
const lightbox = document.getElementById("projectLightbox");
const lightboxImage = document.getElementById("projectImg");
const lightboxTitle = document.getElementById("projectTitle");
const lightboxCaption = document.getElementById("projectCaption");
const lightboxCloseButton = document.querySelector(".lightbox-close");
const lightboxIndicators = document.querySelector(".lightbox-indicators");
const bgImages = [...document.querySelectorAll(".bg-img")];
const heroUnderlineWord = document.querySelector(".hero-underline-word");
const heroUnderlinePath = document.querySelector(".hero-underline-stroke");
const portfolioLogoTrack = document.querySelector(".portfolio-logo-track");
const currentScales = new WeakMap();
const visibleBackgrounds = new Set();
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let projects = [];
let originalSlides = [];
let observedSlide = null;
let current = 0;
let currentPosition = 0;
let targetPosition = 0;
let slideWidth = 0;
let visibleSlides = 3;
let autoPlayTimer;
let carouselMeasureFrame = 0;
let carouselAnimationFrame = 0;
let carouselLastFrameTime = 0;
let currentProject = { images: [], index: 0 };
let heroCurrent = 0;
let heroTimer;
const carouselStepDurationMs = 220;

function setMenuState(isOpen) {
    nav.classList.toggle("open", isOpen);
    hamburger.classList.toggle("active", isOpen);
    hamburger.setAttribute("aria-expanded", String(isOpen));
    hamburger.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
}

function onScrollHeader() {
    header.classList.toggle("scrolled", window.scrollY > 40);
}

const fadeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            fadeObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.2 });

document.querySelectorAll(".fade-in").forEach(element => fadeObserver.observe(element));

navLinks.forEach((link, index) => {
    link.style.setProperty("--nav-item-index", String(index));
});

hamburger.addEventListener("click", () => {
    setMenuState(!nav.classList.contains("open"));
});

navLinks.forEach(link => {
    link.addEventListener("click", () => setMenuState(false));
});

function setActiveNavLink() {
    const headerHeight = header.offsetHeight;
    const position = window.scrollY + headerHeight + 5;
    let currentSection = sections[0];

    for (const section of sections) {
        const top = section.offsetTop;
        const bottom = top + section.offsetHeight;
        if (position >= top && position < bottom) {
            currentSection = section;
            break;
        }
    }

    navLinks.forEach(link => {
        link.classList.toggle("active", link.getAttribute("href") === `#${currentSection.id}`);
    });
}

document.getElementById("whatsForm").addEventListener("submit", event => {
    event.preventDefault();
    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const mensagem = document.getElementById("mensagem").value.trim();
    const texto = encodeURIComponent(`Olá, meu nome é ${nome} (${email}).\n${mensagem}`);
    window.open(`https://wa.me/5511945144513?text=${texto}`, "_blank", "noopener");
});

function updateBgZoom() {
    if (reducedMotion) {
        return;
    }

    visibleBackgrounds.forEach(element => {
        const rect = element.getBoundingClientRect();
        const scrollPercent = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
        const target = 1 + Math.max(0, Math.min(scrollPercent, 1)) * 0.25;
        const currentScale = currentScales.get(element) ?? 1;
        const nextScale = currentScale + (target - currentScale) * 0.12;

        currentScales.set(element, nextScale);
        element.style.transform = `scale(${nextScale})`;
    });
}

const backgroundObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            visibleBackgrounds.add(entry.target);
        } else {
            visibleBackgrounds.delete(entry.target);
        }
    });
}, { threshold: 0 });

bgImages.forEach(element => backgroundObserver.observe(element));
if (!reducedMotion) {
    window.addEventListener("scroll", updateBgZoom, { passive: true });
    window.addEventListener("resize", updateBgZoom);
    updateBgZoom();
}

// Shared interactions
function enableSwipe(element, onSwipeLeft, onSwipeRight) {
    let startX = 0;
    let startY = 0;
    let isDragging = false;

    function onStart(event) {
        isDragging = true;
        const point = event.touches ? event.touches[0] : event;
        startX = point.pageX;
        startY = point.pageY;
    }

    function onMove(event) {
        if (!isDragging || !event.touches) {
            return;
        }

        const point = event.touches[0];
        const diffX = point.pageX - startX;
        const diffY = point.pageY - startY;

        if (Math.abs(diffX) > Math.abs(diffY)) {
            event.preventDefault();
        }
    }

    function onEnd(event) {
        if (!isDragging) {
            return;
        }

        isDragging = false;
        const point = event.changedTouches ? event.changedTouches[0] : event;
        const diff = point.pageX - startX;

        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                onSwipeRight();
            } else {
                onSwipeLeft();
            }
        }
    }

    element.addEventListener("touchstart", onStart, { passive: true });
    element.addEventListener("touchmove", onMove, { passive: false });
    element.addEventListener("touchend", onEnd);
    element.addEventListener("mousedown", onStart);
    element.addEventListener("mouseup", onEnd);
}

function showHero(index) {
    heroSlides.forEach(slide => slide.classList.remove("active"));
    heroCurrent = (index + heroSlides.length) % heroSlides.length;
    heroSlides[heroCurrent].classList.add("active");
}

function heroNext() {
    showHero(heroCurrent + 1);
}

function heroPrev() {
    showHero(heroCurrent - 1);
}

function startHeroAuto() {
    clearInterval(heroTimer);
    if (!reducedMotion && heroSlides.length > 1) {
        heroTimer = window.setInterval(heroNext, 8000);
    }
}

function updateHeroUnderlineTiming() {
    if (!heroUnderlineWord || !heroUnderlinePath) {
        return;
    }

    const svg = heroUnderlinePath.ownerSVGElement;
    if (!svg?.viewBox?.baseVal?.width) {
        return;
    }

    const pathLength = heroUnderlinePath.getTotalLength();
    const renderedSvgWidth = svg.getBoundingClientRect().width;
    const scale = renderedSvgWidth / svg.viewBox.baseVal.width;
    const renderedPathLength = pathLength * scale;
    const isMobileViewport = window.innerWidth <= 768;

    // Keep a near-constant drawing speed in px/s across screen sizes.
    const pixelsPerSecond = isMobileViewport ? 42 : 92;
    const duration = clamp(renderedPathLength / pixelsPerSecond, isMobileViewport ? 3.4 : 1.9, isMobileViewport ? 5.6 : 3.4);
    heroUnderlineWord.style.setProperty("--hero-underline-duration", `${duration.toFixed(2)}s`);
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getPortfolioLogos() {
    return [...document.querySelectorAll(".portfolio-logo-list img")];
}

function setupPortfolioMarquee() {
    if (!portfolioLogoTrack) {
        return;
    }

    const logoLists = portfolioLogoTrack.querySelectorAll(".portfolio-logo-list");
    if (logoLists.length > 1) {
        return;
    }

    const clone = logoLists[0].cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("img").forEach(image => {
        image.alt = "";
    });

    portfolioLogoTrack.append(clone);
}

function bindPortfolioLogoListeners() {
    getPortfolioLogos().forEach(logo => {
        if (logo.dataset.balanceBound === "true" || logo.complete) {
            return;
        }

        logo.addEventListener("load", balancePortfolioLogos, { once: true });
        logo.dataset.balanceBound = "true";
    });

    document.querySelectorAll(".portfolio-logo-list li").forEach(item => {
        if (item.dataset.contextBound === "true") {
            return;
        }

        item.addEventListener("contextmenu", event => event.preventDefault());
        item.dataset.contextBound = "true";
    });
}

function balancePortfolioLogos() {
    const portfolioLogos = getPortfolioLogos();
    if (!portfolioLogos.length) {
        return;
    }

    const measuredLogos = portfolioLogos
        .map(logo => {
            const width = logo.naturalWidth || Number(logo.getAttribute("width")) || 0;
            const height = logo.naturalHeight || Number(logo.getAttribute("height")) || 0;

            if (!width || !height) {
                return null;
            }

            return {
                logo,
                aspectRatio: width / height
            };
        })
        .filter(Boolean);

    if (!measuredLogos.length) {
        return;
    }

    const sortedRatios = measuredLogos
        .map(item => item.aspectRatio)
        .sort((first, second) => first - second);
    const medianIndex = Math.floor(sortedRatios.length / 2);
    const medianAspectRatio = sortedRatios.length % 2 === 0
        ? (sortedRatios[medianIndex - 1] + sortedRatios[medianIndex]) / 2
        : sortedRatios[medianIndex];

    measuredLogos.forEach(({ logo, aspectRatio }) => {
        // Keep the perceived visual area closer between narrow and wide wordmarks.
        const balanceFactor = clamp(Math.sqrt(medianAspectRatio / aspectRatio), 0.68, 1.32);
        logo.style.setProperty("--logo-balance-factor", balanceFactor.toFixed(3));
    });
}

heroSlides.forEach(slide => {
    slide.draggable = false;
    slide.addEventListener("dragstart", event => event.preventDefault());
});

setupPortfolioMarquee();
bindPortfolioLogoListeners();
balancePortfolioLogos();
updateHeroUnderlineTiming();

if (heroSlides.length > 1) {
    enableSwipe(document.querySelector(".hero-slideshow"), () => {
        heroNext();
        startHeroAuto();
    }, () => {
        heroPrev();
        startHeroAuto();
    });
    startHeroAuto();
}

// Portfolio carousel
function setCarouselControlsDisabled(disabled) {
    prevButton.disabled = disabled;
    nextButton.disabled = disabled;
}

function createProjectSlide(project, projectIndex) {
    const slide = document.createElement("div");
    slide.className = "slide";
    slide.dataset.projectIndex = String(projectIndex);

    const image = document.createElement("img");
    image.src = project.cover;
    image.alt = project.title;
    image.loading = "lazy";
    image.decoding = "async";
    image.width = 900;
    image.height = 670;

    const overlay = document.createElement("div");
    overlay.className = "slide-hover";

    const eyebrow = document.createElement("span");
    eyebrow.className = "slide-hover-eyebrow";
    eyebrow.textContent = "Ver projeto";

    const label = document.createElement("span");
    label.className = "slide-hover-title";
    label.textContent = project.title;

    overlay.append(eyebrow, label);
    slide.append(image, overlay);
    return slide;
}

function renderProjects(projectList) {
    viewport.innerHTML = "";

    if (!projectList.length) {
        const status = document.createElement("p");
        status.className = "carousel-status";
        status.textContent = "Nenhum projeto disponível no momento.";
        viewport.append(status);
        setCarouselControlsDisabled(true);
        return;
    }

    const fragment = document.createDocumentFragment();
    projectList.forEach((project, index) => {
        fragment.append(createProjectSlide(project, index));
    });
    viewport.append(fragment);
}

function hydrateCarouselSlides() {
    viewport.querySelectorAll(".slide-clone").forEach(slide => slide.remove());
    originalSlides = [...viewport.querySelectorAll(".slide")];
    current = originalSlides.length;
    currentPosition = current;
    targetPosition = current;

    if (!originalSlides.length) {
        stopCarouselAuto();
        return;
    }

    const leadingClones = document.createDocumentFragment();
    const trailingClones = document.createDocumentFragment();

    originalSlides.forEach(slide => {
        const clone = slide.cloneNode(true);
        clone.classList.add("slide-clone");
        clone.setAttribute("aria-hidden", "true");
        trailingClones.append(clone);
    });

    originalSlides.forEach(slide => {
        const clone = slide.cloneNode(true);
        clone.classList.add("slide-clone");
        clone.setAttribute("aria-hidden", "true");
        leadingClones.append(clone);
    });

    viewport.prepend(leadingClones);
    viewport.append(trailingClones);

    setCarouselControlsDisabled(originalSlides.length <= 1);
}

function moveTo(position) {
    viewport.style.transition = "none";
    viewport.style.transform = `translateX(${-position * slideWidth}px)`;
}

function stopCarouselAnimation() {
    window.cancelAnimationFrame(carouselAnimationFrame);
    carouselAnimationFrame = 0;
    carouselLastFrameTime = 0;
}

function calculateCarousel() {
    if (!originalSlides.length) {
        viewport.style.transform = "translateX(0)";
        return;
    }

    const width = window.innerWidth;

    if (width <= 600) {
        visibleSlides = 1;
    } else if (width <= 900) {
        visibleSlides = 2;
    } else {
        visibleSlides = 3;
    }

    carousel.style.setProperty("--carousel-slides-per-view", String(visibleSlides));
    slideWidth = originalSlides[0].getBoundingClientRect().width;
    stopCarouselAnimation();
    moveTo(currentPosition);
}

function scheduleCarouselMeasure() {
    window.cancelAnimationFrame(carouselMeasureFrame);
    carouselMeasureFrame = window.requestAnimationFrame(calculateCarousel);
}

function normalizeCarousel() {
    const max = originalSlides.length;
    if (!max) {
        return;
    }

    while (currentPosition >= max * 2) {
        currentPosition -= max;
        targetPosition -= max;
    }

    while (currentPosition < max) {
        currentPosition += max;
        targetPosition += max;
    }

    current = Math.round(targetPosition);
    moveTo(currentPosition);
}

function animateCarousel(timestamp) {
    if (!slideWidth || !originalSlides.length) {
        stopCarouselAnimation();
        return;
    }

    if (!carouselLastFrameTime) {
        carouselLastFrameTime = timestamp;
    }

    const delta = timestamp - carouselLastFrameTime;
    carouselLastFrameTime = timestamp;

    const maxStep = delta / carouselStepDurationMs;
    const distance = targetPosition - currentPosition;

    if (Math.abs(distance) <= maxStep) {
        currentPosition = targetPosition;
    } else {
        currentPosition += Math.sign(distance) * maxStep;
    }

    normalizeCarousel();
    moveTo(currentPosition);

    if (Math.abs(targetPosition - currentPosition) > 0.0001) {
        carouselAnimationFrame = window.requestAnimationFrame(animateCarousel);
        return;
    }

    currentPosition = targetPosition;
    current = Math.round(targetPosition);
    moveTo(currentPosition);
    stopCarouselAnimation();
}

function ensureCarouselAnimation() {
    if (carouselAnimationFrame) {
        return;
    }

    carouselAnimationFrame = window.requestAnimationFrame(animateCarousel);
}

function stepCarousel(direction) {
    if (originalSlides.length <= 1 || !slideWidth) {
        return;
    }

    targetPosition += direction;
    current = Math.round(targetPosition);
    normalizeCarousel();
    ensureCarouselAnimation();
}

function nextCarousel() {
    stepCarousel(1);
}

function prevCarousel() {
    stepCarousel(-1);
}

function startCarouselAuto() {
    window.clearTimeout(autoPlayTimer);
    if (!reducedMotion && originalSlides.length > 1) {
        autoPlayTimer = window.setTimeout(() => {
            nextCarousel();
            startCarouselAuto();
        }, 4000);
    }
}

function stopCarouselAuto() {
    window.clearTimeout(autoPlayTimer);
}

const carouselResizeObserver = new ResizeObserver(() => {
    scheduleCarouselMeasure();
});

// Lightbox
function observeCarouselSlides() {
    if (observedSlide) {
        carouselResizeObserver.unobserve(observedSlide);
    }

    observedSlide = originalSlides[0] ?? null;

    if (observedSlide) {
        carouselResizeObserver.observe(observedSlide);
    }
}

function openLightbox(projectIndex) {
    const project = projects[projectIndex];
    if (!project) {
        return;
    }

    currentProject = {
        images: project.images,
        index: 0,
        title: project.title,
        description: project.description
    };
    renderLightboxIndicators();
    lightboxTitle.textContent = project.title;
    lightboxCaption.textContent = project.description;
    lightboxImage.src = project.images[0];
    lightboxImage.alt = project.title;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
}

function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
}

function showProjectImage(index) {
    if (!currentProject.images.length) {
        return;
    }

    currentProject.index = (index + currentProject.images.length) % currentProject.images.length;
    lightboxImage.src = currentProject.images[currentProject.index];
    lightboxImage.alt = currentProject.title;
    lightboxTitle.textContent = currentProject.title;
    lightboxCaption.textContent = currentProject.description;
    syncLightboxIndicators();
}

function renderLightboxIndicators() {
    lightboxIndicators.innerHTML = "";

    currentProject.images.forEach((_, index) => {
        const indicator = document.createElement("button");
        indicator.type = "button";
        indicator.setAttribute("aria-label", `Slide ${index + 1}`);
        indicator.className = index === currentProject.index ? "active" : "";
        indicator.addEventListener("click", event => {
            event.stopPropagation();
            showProjectImage(index);
        });
        lightboxIndicators.append(indicator);
    });
}

function syncLightboxIndicators() {
    [...lightboxIndicators.children].forEach((indicator, index) => {
        indicator.classList.toggle("active", index === currentProject.index);
        indicator.toggleAttribute("aria-current", index === currentProject.index);
    });
}

// Project loading
async function loadProjects() {
    const response = await fetch("assets/projects/projects.json");
    if (!response.ok) {
        throw new Error(`Failed to load projects.json: ${response.status}`);
    }

    projects = await response.json();
    renderProjects(projects);
    hydrateCarouselSlides();
    observeCarouselSlides();
    scheduleCarouselMeasure();
    startCarouselAuto();
}

prevButton.addEventListener("click", () => {
    prevCarousel();
    startCarouselAuto();
});

nextButton.addEventListener("click", () => {
    nextCarousel();
    startCarouselAuto();
});

window.addEventListener("resize", scheduleCarouselMeasure);
window.addEventListener("load", scheduleCarouselMeasure);
window.addEventListener("resize", updateHeroUnderlineTiming);
window.addEventListener("load", balancePortfolioLogos);
window.addEventListener("load", updateHeroUnderlineTiming);
carousel.addEventListener("mouseenter", stopCarouselAuto);
carousel.addEventListener("mouseleave", startCarouselAuto);
enableSwipe(carousel, () => {
    nextCarousel();
    startCarouselAuto();
}, () => {
    prevCarousel();
    startCarouselAuto();
});

viewport.addEventListener("click", event => {
    const slide = event.target.closest(".slide");
    if (!slide) {
        return;
    }

    openLightbox(Number(slide.dataset.projectIndex));
});

document.querySelector(".proj-next").addEventListener("click", event => {
    event.stopPropagation();
    showProjectImage(currentProject.index + 1);
});

document.querySelector(".proj-prev").addEventListener("click", event => {
    event.stopPropagation();
    showProjectImage(currentProject.index - 1);
});

lightboxCloseButton.addEventListener("click", event => {
    event.stopPropagation();
    closeLightbox();
});

lightbox.addEventListener("click", event => {
    if (event.target === lightbox) {
        closeLightbox();
    }
});

document.querySelectorAll("#projectLightbox .lightbox-dialog, #projectLightbox img, #projectLightbox .lightbox-caption, #projectLightbox .lightbox-indicators, #projectLightbox .proj-control, #projectLightbox .lightbox-close")
    .forEach(element => {
        element.addEventListener("click", event => event.stopPropagation());
    });

document.addEventListener("keydown", event => {
    if (lightbox.hidden) {
        return;
    }

    if (event.key === "Escape") {
        closeLightbox();
    }

    if (event.key === "ArrowRight") {
        showProjectImage(currentProject.index + 1);
    }

    if (event.key === "ArrowLeft") {
        showProjectImage(currentProject.index - 1);
    }
});

enableSwipe(lightbox, () => showProjectImage(currentProject.index + 1), () => showProjectImage(currentProject.index - 1));

window.addEventListener("scroll", onScrollHeader, { passive: true });
window.addEventListener("scroll", setActiveNavLink, { passive: true });
window.addEventListener("load", setActiveNavLink);

if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
        scheduleCarouselMeasure();
        updateHeroUnderlineTiming();
    });
}

loadProjects().catch(error => {
    console.error(error);
    viewport.innerHTML = '<p class="carousel-status">Não foi possível carregar os projetos agora.</p>';
    setCarouselControlsDisabled(true);
});

onScrollHeader();
setActiveNavLink();
