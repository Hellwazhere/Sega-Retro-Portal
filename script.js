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
    
    navLinks.forEach(link => {
        if (link.getAttribute("href") === currentPage) {
            link.classList.add("active-nav");
        }
    });
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
        
        // Unir todos os anos e ordenar da mais recente para a mais antiga
        const allNews = [...(data["2025"] || []), ...(data["2026"] || [])]
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const renderItem = (item, isCarousel) => {
            return `
                <div class="${isCarousel ? 'carousel-slide' : 'card'}">
                    <div style="${isCarousel ? 'height:100%' : 'height:180px; margin:-20px -20px 15px -20px; overflow:hidden;'}">
                        <img src="${item.image}" onerror="this.src='images/news.webp'" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <div class="${isCarousel ? 'carousel-overlay' : ''}">
                        <span class="archive-type">${item.type}</span>
                        <h3>${item.event}</h3>
                        <p>${item.date}</p>
                        <a href="${item.link}" target="_blank" class="source-link" style="color:var(--accent); text-decoration:none; border:1px solid var(--accent); padding:4px 8px; font-size:0.7rem; display:inline-block; margin-top:10px;">SOURCE ↗</a>
                    </div>
                </div>`;
        };

        if (carouselTrack) {
            // Pega as 3 mais recentes para o Carousel
            carouselTrack.innerHTML = allNews.slice(0, 3).map(i => renderItem(i, true)).join('');
            initCarouselLogic(); // Certifica-te que tens esta função para animar o carousel
        }
        if (gridContainer) {
            // O restante vai para a grelha (grid)
            gridContainer.innerHTML = allNews.slice(3).map(i => renderItem(i, false)).join('');
        }
    } catch (e) { console.error("Erro ao carregar notícias:", e); }
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