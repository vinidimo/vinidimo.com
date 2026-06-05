document.getElementById('year').textContent = new Date().getFullYear();

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
const originalSlides = [...viewport.children];
const prevButton = document.querySelector(".carousel-control-previous");
const nextButton = document.querySelector(".carousel-control-next");
const lightbox = document.getElementById("projectLightbox");
const lightboxImage = document.getElementById("projectImg");
const lightboxTitle = document.getElementById("projectTitle");
const lightboxCaption = document.getElementById("projectCaption");
const bgImages = [...document.querySelectorAll(".bg-img")];
const currentScales = new WeakMap();
const visibleBackgrounds = new Set();
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
        const current = currentScales.get(element) ?? 1;
        const next = current + (target - current) * 0.12;

        currentScales.set(element, next);
        element.style.transform = `scale(${next})`;
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

let heroCurrent = 0;
let heroTimer;

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

heroSlides.forEach(slide => {
    slide.draggable = false;
    slide.addEventListener("dragstart", event => event.preventDefault());
});

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

originalSlides.forEach(slide => {
    const clone = slide.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("img").forEach(image => {
        image.loading = "lazy";
        image.decoding = "async";
    });
    viewport.append(clone);
});

let current = 0;
let slideWidth = 0;
let visibleSlides = 3;
let autoPlayTimer;
let carouselMeasureFrame = 0;

function moveTo(index, animate = true) {
    viewport.style.transition = animate ? "transform 0.6s ease" : "none";
    viewport.style.transform = `translateX(${-index * slideWidth}px)`;
}

function calculateCarousel() {
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
    moveTo(current, false);
}

function scheduleCarouselMeasure() {
    window.cancelAnimationFrame(carouselMeasureFrame);
    carouselMeasureFrame = window.requestAnimationFrame(calculateCarousel);
}

function normalizeCarousel() {
    const max = originalSlides.length;
    if (current >= max) {
        current -= max;
        moveTo(current, false);
    }
    if (current < 0) {
        current += max;
        moveTo(current, false);
    }
}

function nextCarousel() {
    current += 1;
    moveTo(current, true);
    window.setTimeout(normalizeCarousel, 600);
}

function prevCarousel() {
    current -= 1;
    moveTo(current, true);
    window.setTimeout(normalizeCarousel, 600);
}

function startCarouselAuto() {
    window.clearTimeout(autoPlayTimer);
    if (!reducedMotion) {
        autoPlayTimer = window.setTimeout(() => {
            nextCarousel();
            startCarouselAuto();
        }, 4000);
    }
}

function stopCarouselAuto() {
    window.clearTimeout(autoPlayTimer);
}

nextButton.addEventListener("click", () => {
    nextCarousel();
    startCarouselAuto();
});

prevButton.addEventListener("click", () => {
    prevCarousel();
    startCarouselAuto();
});

window.addEventListener("resize", scheduleCarouselMeasure);
window.addEventListener("load", scheduleCarouselMeasure);
carousel.addEventListener("mouseenter", stopCarouselAuto);
carousel.addEventListener("mouseleave", startCarouselAuto);
enableSwipe(carousel, () => {
    nextCarousel();
    startCarouselAuto();
}, () => {
    prevCarousel();
    startCarouselAuto();
});

const carouselResizeObserver = new ResizeObserver(() => {
    scheduleCarouselMeasure();
});

carouselResizeObserver.observe(carousel);
carouselResizeObserver.observe(originalSlides[0]);

if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
        scheduleCarouselMeasure();
    });
}

scheduleCarouselMeasure();
startCarouselAuto();

let currentProject = { images: [], index: 0 };

function openLightbox(images, title, caption) {
    currentProject = { images, index: 0 };
    lightboxTitle.textContent = title;
    lightboxCaption.textContent = caption;
    lightboxImage.src = images[0];
    lightboxImage.alt = title;
    lightbox.hidden = false;
}

function closeLightbox() {
    lightbox.hidden = true;
}

function showProjectImage(index) {
    currentProject.index = (index + currentProject.images.length) % currentProject.images.length;
    lightboxImage.src = currentProject.images[currentProject.index];
    lightboxImage.alt = lightboxTitle.textContent;
}

viewport.addEventListener("click", event => {
    const slide = event.target.closest(".slide");
    if (!slide || !viewport.contains(slide)) {
        return;
    }

    const images = JSON.parse(slide.getAttribute("data-images") || "[]");
    if (!images.length) {
        return;
    }

    openLightbox(images, slide.dataset.title || "", slide.dataset.caption || "");
});

document.querySelector(".proj-next").addEventListener("click", event => {
    event.stopPropagation();
    showProjectImage(currentProject.index + 1);
});

document.querySelector(".proj-prev").addEventListener("click", event => {
    event.stopPropagation();
    showProjectImage(currentProject.index - 1);
});

lightbox.addEventListener("click", event => {
    if (event.target === lightbox) {
        closeLightbox();
    }
});

document.querySelectorAll("#projectLightbox img, #projectLightbox .lightbox-text, #projectLightbox .proj-control")
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
onScrollHeader();
setActiveNavLink();
