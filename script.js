document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("archive-list")) loadHistory();
    if (document.getElementById("news-grid-container")) loadNewsPage();

    const modal = document.getElementById("imageModal");
    if (modal) {
        const modalImg = document.getElementById("imgExpanded");
        document.addEventListener("click", (e) => {
            if (e.target.tagName === 'IMG' && (e.target.closest('.card') || e.target.closest('.carousel-slide'))) {
                modal.style.display = "flex";
                modalImg.src = e.target.src;
            }
        });
        document.querySelector(".close")?.addEventListener("click", () => modal.style.display = "none");
    }
});

async function loadHistory() {
    const archiveList = document.getElementById("archive-list");
    try {
        const res = await fetch('history.json');
        const data = await res.json();
        const years = Object.keys(data).sort((a, b) => b - a);
        archiveList.innerHTML = years.map(year => `
            <div class="archive-year-block">
                <div class="archive-header" onclick="this.parentElement.classList.toggle('active')">
                    <span>YEAR: ${year}</span><span>+</span>
                </div>
                <div class="archive-content">
                    <ul>${data[year].map(item => `<li><span class="archive-type">${item.type}</span><strong>${item.date}:</strong> ${item.event}</li>`).join('')}</ul>
                </div>
            </div>`).join('');
    } catch (e) { console.error("Archive error", e); }
}

async function loadNewsPage() {
    const carouselTrack = document.getElementById("carousel-track");
    const gridContainer = document.getElementById("news-grid-container");

    try {
        const res = await fetch('history.json');
        const data = await res.json();
        const news2026 = data["2026"] || [];

        const renderItem = (item, isCarousel) => {
            // This line tells the code to look for "images/YYYY-MM-DD.png"
            const imagePath = `images/${item.date}.png`;
            
            return `
                <div class="${isCarousel ? 'carousel-slide' : 'card'}">
                    <div style="${isCarousel ? 'height:100%' : 'height:180px; margin:-20px -20px 15px -20px; overflow:hidden;'}">
                        <img src="${imagePath}" onerror="this.src='images/news.png'; this.onerror='this.src=\\'images/homebanner.png\\''" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <div class="${isCarousel ? 'carousel-overlay' : ''}">
                        <span class="archive-type">${item.type}</span>
                        <h3>${item.event}</h3>
                        <p>${item.date}</p>
                    </div>
                </div>`;
        };

        if (carouselTrack) {
            carouselTrack.innerHTML = news2026.slice(0, 3).map(i => renderItem(i, true)).join('');
            initCarouselLogic();
        }
        if (gridContainer) {
            gridContainer.innerHTML = news2026.slice(3, 12).map(i => renderItem(i, false)).join('');
        }
    } catch (e) { console.error("News error", e); }
}

function initCarouselLogic() {
    let index = 0;
    const track = document.getElementById('carousel-track');
    if (!track) return;
    setInterval(() => {
        index = (index + 1) % 3;
        track.style.transform = `translateX(-${index * 100}%)`;
    }, 6000);
}