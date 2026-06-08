const currentYear = String(new Date().getFullYear());

document.querySelectorAll("[data-current-year]").forEach(element => {
    element.textContent = currentYear;
});

const legacyYearElement = document.getElementById("year");

if (legacyYearElement && !legacyYearElement.textContent.trim()) {
    legacyYearElement.textContent = currentYear;
}
