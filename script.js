document.addEventListener("DOMContentLoaded", () => {
    // 1. Injetar o Modal automaticamente em todas as páginas
    injectModal();

    // 2. Destacar o link ativo na navegação
    highlightActivePage();

    // Logics existentes
    if (document.getElementById("archive-list")) loadHistory();
    if (document.getElementById("news-grid-container")) loadNewsPage();
    
    // Lógica do Modal (agora funciona para o elemento injetado)
    setupModalEvents();
});

async function getHistoryData() {
    if (window.historyData && typeof window.historyData === "object") {
        return window.historyData;
    }

    const res = await fetch("history.json", { cache: "no-store" });
    if (!res.ok) {
        throw new Error(`History fetch failed: ${res.status}`);
    }

    return res.json();
}

function injectModal() {
    const modalHTML = `
        <div id="imageModal" class="modal">
            <span class="close">&times;</span>
            <img class="modal-content" id="imgExpanded">
            <div id="caption"></div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function highlightActivePage() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const navLinks = document.querySelectorAll("nav a");
    const consolePages = ["megadrive.html", "saturn.html", "dreamcast.html"];
    const dropdownButton = document.querySelector(".nav-dropbtn");
    
    navLinks.forEach(link => {
        if (link.getAttribute("href") === currentPage) {
            link.classList.add("active-nav");
        }
    });

    if (dropdownButton && consolePages.includes(currentPage)) {
        dropdownButton.classList.add("active-nav");
    }
}

function setupModalEvents() {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("imgExpanded");

    document.addEventListener("click", (e) => {
        // Deteta cliques em imagens dentro de cards ou na galeria
        if (e.target.tagName === 'IMG' && (e.target.closest('.card') || e.target.closest('.carousel-slide') || e.target.closest('.gallery-item'))) {
            modal.style.display = "flex";
            modalImg.src = e.target.src;
            const caption = document.getElementById("caption");
            if(caption) caption.innerText = e.target.alt || "";
        }
    });

    document.querySelector(".close")?.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // Fechar ao clicar fora da imagem
    modal?.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
    });
}

async function loadHistory() {
    const archiveList = document.getElementById("archive-list");
    try {
        const data = await getHistoryData();
        const years = Object.keys(data).sort((a, b) => b - a);
        archiveList.innerHTML = years.map(year => `
            <div class="archive-year-block">
                <div class="archive-header" onclick="this.parentElement.classList.toggle('active')">
                    <span>NEWS: ${year}</span><span>+</span>
                </div>
                <div class="archive-content">
                    <ul>${data[year].map(item => `
                        <li>
                            <span class="archive-type">${item.type}</span>
                            <strong>${item.date}:</strong> ${item.event}
                            ${item.link ? `<a href="${item.link}" target="_blank" rel="noopener noreferrer" class="source-link">SOURCE ↗</a>` : ''}
                        </li>
                    `).join('')}</ul>
                </div>
            </div>`).join('');
    } catch (e) {
        console.error("Archive error", e);
        if (archiveList) {
            archiveList.textContent = "Archive data could not be loaded. If you opened this page directly from disk, run a local server.";
        }
    }
}

async function loadNewsPage() {
    const carouselTrack = document.getElementById("carousel-track");
    const gridContainer = document.getElementById("news-grid-container");

    const fetchOgImage = async (url) => {
        try {
            const res = await fetch(`/.netlify/functions/og-proxy?url=${encodeURIComponent(url)}`);
            if (!res.ok) return null;
            const data = await res.json();
            return data.image || null;
        } catch (e) {
            return null;
        }
    };

    try {
        const data = await getHistoryData();
        
        // Collector todos os entries de todos os anos e ordenar da mais recente para a mais antiga
        let allNews = Object.keys(data)
            .flatMap(year => data[year] || [])
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 50); // Pega os últimos 50 recentes

        // Fetch images from Wikipedia or Open Graph sources
        allNews = await Promise.all(
            allNews.map(async (item) => {
                if (!item.link) return item;
                let enrichedItem = { ...item };

                const ogImage = await fetchOgImage(item.link);
                if (ogImage) {
                    enrichedItem.fetchedImage = ogImage;
                }

                return enrichedItem;
            })
        );

        const segaUpdatesFallbackImage = "images/segageneric.webp";
        const typeFallbackImages = {
            Game: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Sonic_the_Hedgehog_logo.svg",
            Arcade: "https://upload.wikimedia.org/wikipedia/commons/1/11/Sega_Logo.svg",
            Hardware: "https://upload.wikimedia.org/wikipedia/commons/5/57/Sega_Dreamcast_logo.svg",
            Business: "https://upload.wikimedia.org/wikipedia/commons/3/33/Sega_logo.png",
            Service: "https://upload.wikimedia.org/wikipedia/commons/3/33/Sega_logo.png",
            Media: "https://upload.wikimedia.org/wikipedia/commons/3/33/Sega_logo.png",
            Milestone: "https://upload.wikimedia.org/wikipedia/commons/3/33/Sega_logo.png",
            Intel: "https://upload.wikimedia.org/wikipedia/commons/3/33/Sega_logo.png",
            Tech: "https://upload.wikimedia.org/wikipedia/commons/3/33/Sega_logo.png",
            Rumor: "https://upload.wikimedia.org/wikipedia/commons/3/33/Sega_logo.png"
        };
        const getTypeFallbackImage = (itemType) => typeFallbackImages[itemType] || segaUpdatesFallbackImage;
        const keywordImageMap = [
            { keywords: ["sonic"], url: "https://upload.wikimedia.org/wikipedia/commons/f/f0/Sonic_the_Hedgehog_logo.svg" },
            { keywords: ["yakuza", "like a dragon"], url: "https://upload.wikimedia.org/wikipedia/commons/c/c9/Yakuza_franchise_logo.png" },
            { keywords: ["dreamcast"], url: "https://upload.wikimedia.org/wikipedia/commons/5/57/Sega_Dreamcast_logo.svg" },
            { keywords: ["saturn"], url: "https://upload.wikimedia.org/wikipedia/commons/6/6c/Sega_Saturn_logo.svg" }
        ];
        const getKeywordFallbackImage = (eventTitle) => {
            const title = (eventTitle || "").toLowerCase();
            const match = keywordImageMap.find(entry => entry.keywords.some(keyword => title.includes(keyword)));
            return match ? match.url : null;
        };
        const isLocalImage = (src) => typeof src === 'string' && src.startsWith('images/');
        const isSegaGenericPlaceholder = (src) => src === 'images/segageneric.webp';
        const isMini2Placeholder = (src) => src === 'images/mini2.webp';
        const isJudgePlaceholder = (src) => src === 'images/judge.webp';
        const isAtlusPlaceholder = (src) => src === 'images/atlus.webp';
        const isCloudPlaceholder = (src) => src === 'images/cloud.webp';
        const isCrossPlaceholder = (src) => src === 'images/cross.webp';
        const isOutrun2Placeholder = (src) => src === 'images/outrun2.webp';
        const isPjcPlaceholder = (src) => src === 'images/pjc.webp';
        const isStorePlaceholder = (src) => src === 'images/store.webp';
        const isStrategyPlaceholder = (src) => src === 'images/strategy.webp';
        const isGrowthPlaceholder = (src) => src === 'images/growth.webp';
        const isAtlus2Placeholder = (src) => src === 'images/atlus2.webp';
        const isRovioPlaceholder = (src) => src === 'images/rovio.webp';
        const isMiniArcadePlaceholder = (src) => src === 'images/miniarcade.webp';
        const isExpandPlaceholder = (src) => src === 'images/expand.webp';
        const isOldRetroPlaceholder = (src) => src === 'images/oldretro.webp';
        const isSoftwareUpdatePlaceholder = (src) => src === 'images/softwareupdate.webp';
        const isAllowedLocalImage = (src) => isSegaGenericPlaceholder(src)
            || isMini2Placeholder(src)
            || isJudgePlaceholder(src)
            || isAtlusPlaceholder(src)
            || isCloudPlaceholder(src)
            || isCrossPlaceholder(src)
            || isOutrun2Placeholder(src)
            || isPjcPlaceholder(src)
            || isStorePlaceholder(src)
            || isStrategyPlaceholder(src)
            || isGrowthPlaceholder(src)
            || isAtlus2Placeholder(src)
            || isRovioPlaceholder(src)
            || isMiniArcadePlaceholder(src)
            || isExpandPlaceholder(src)
            || isOldRetroPlaceholder(src)
            || isSoftwareUpdatePlaceholder(src);

        const renderItem = (item, isCarousel) => {
            const sourceLink = item.link || '#';
            const fallbackImage = isCarousel
                ? 'images/segageneric.webp'
                : (getKeywordFallbackImage(item.event) || getTypeFallbackImage(item.type));
            const displayImage = isCarousel
                ? (item.image || item.fetchedImage || 'images/segageneric.webp')
                : (isAllowedLocalImage(item.image)
                    ? item.image
                    : (item.wikiImage || (!isLocalImage(item.image) ? item.image : null) || item.fetchedImage || fallbackImage));
            const errorAttr = isCarousel
                ? "this.src='images/segageneric.webp'"
                : `this.onerror=null; this.src='${fallbackImage}'`;
            return `
                <div class="${isCarousel ? 'carousel-slide' : 'card'}" data-link="${sourceLink}">
                    <div style="${isCarousel ? 'height:100%' : 'height:180px; margin:-20px -20px 15px -20px; overflow:hidden;'}">
                        <img src="${displayImage}" onerror="${errorAttr}" style="width:100%; height:100%; object-fit:cover;" loading="lazy">
                    </div>
                    <div class="${isCarousel ? 'carousel-overlay' : ''}">
                       
                        <h3>${item.event}</h3>
                        <p>${item.date}</p>
                        ${sourceLink !== '#' ? `<a href="${sourceLink}" target="_blank" rel="noopener noreferrer" class="source-link">SOURCE ↗</a>` : ''}
                    </div>
                </div>`;
        };

        if (carouselTrack) {
            // Pega as 3 mais recentes para o Carousel
            carouselTrack.innerHTML = allNews.slice(0, 3).map(i => renderItem(i, true)).join('');
            initCarouselLogic();
        }
        if (gridContainer) {
            // O restante vai para a grelha (grid)
            gridContainer.innerHTML = allNews.slice(3).map(i => renderItem(i, false)).join('');
        }
    } catch (e) {
        console.error("Erro ao carregar notícias:", e);
        if (carouselTrack) {
            carouselTrack.innerHTML = "<div class=\"carousel-slide\"><div class=\"carousel-overlay\"><h3>News feed unavailable</h3><p>Run a local server or check your data file.</p></div></div>";
        }
        if (gridContainer) {
            gridContainer.textContent = "News could not be loaded. If you opened this page directly from disk, run a local server.";
        }
    }
}

function initCarouselLogic() {
    let index = 0;
    const track = document.getElementById('carousel-track');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (!track) return;
    
    const totalSlides = 3;
    let autoPlayInterval;

    const updateCarousel = () => {
        track.style.transform = `translateX(-${index * 100}%)`;
    };

    const nextSlide = () => {
        index = (index + 1) % totalSlides;
        updateCarousel();
    };

    const prevSlide = () => {
        index = (index - 1 + totalSlides) % totalSlides;
        updateCarousel();
    };

    const startAutoPlay = () => {
        clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(nextSlide, 6000);
    };

    const resetAutoPlay = () => {
        startAutoPlay();
    };

    // Event Listeners for Buttons
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            resetAutoPlay();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            resetAutoPlay();
        });
    }

    // Start Autoplay
    startAutoPlay();
}

