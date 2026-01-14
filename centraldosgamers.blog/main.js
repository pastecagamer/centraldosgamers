// Configuração principal e renderização
let allPosts = []; // Cache global para as postagens

document.addEventListener('DOMContentLoaded', () => {
    discoverAndRenderPosts();
    initStickyHeader();
    initCustomDropdown();
});

// Sistema de busca inteligente para as postagens
async function discoverAndRenderPosts(filterTag = 'all') {
    const grid = document.getElementById('posts-grid');
    if (!grid) return;

    // Busca as postagens apenas se o cache estiver vazio
    if (allPosts.length === 0) {
        grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: var(--secondary); padding: 50px;">Carregando o universo gamer...</p>';

        let i = 1;
        let keepSearching = true;

        while (keepSearching && i <= 30) { // Limite aumentado para 30
            try {
                const url = `posts/post${i}.html`;
                const response = await fetch(url);

                if (response.ok) {
                    const html = await response.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    // Extrai os dados usando seletores flexíveis
                    const title = doc.querySelector('h1')?.textContent || `Post ${i}`;
                    // Obtém o contêiner de metadados
                    const metaContainer = doc.querySelector('.post-meta');
                    let date = 'Sem data';
                    let tag = 'Geral';

                    if (metaContainer) {
                        // A tag sempre tem a classe .tag
                        tag = metaContainer.querySelector('.tag')?.textContent?.trim() || 'Geral';

                        // A data geralmente é o primeiro span que NÃO é a tag
                        const spans = metaContainer.querySelectorAll('span');
                        spans.forEach(span => {
                            if (!span.classList.contains('tag')) {
                                date = span.textContent.trim();
                            }
                        });
                    }
                    const excerpt = doc.querySelector('.post-content p')?.textContent?.substring(0, 150) + '...' || 'Sem resumo disponível.';

                    allPosts.push({ id: i, title, date, tag, excerpt, url });
                    i++;
                } else {
                    keepSearching = false; // Para a busca quando encontrar um erro 404
                }
            } catch (error) {
                keepSearching = false;
            }
        }

        // Após descobrir todos os posts, atualiza o dropdown com as tags reais
        updateDropdownWithRealTags();
    }

    renderGrid(allPosts, filterTag);
}

// Atualiza o dropdown de filtro com base nas tags descobertas
function updateDropdownWithRealTags() {
    const dropdownList = document.querySelector('.dropdown-list');
    if (!dropdownList) return;

    // Obtém tags únicas de todos os posts descobertos
    const uniqueTags = [...new Set(allPosts.map(post => post.tag))];

    // Ordena as tags alfabeticamente
    uniqueTags.sort();

    // Reconstrói a lista começando com "Todas as Categorias"
    let listHTML = `<li data-value="all">Todas as Categorias</li>`;

    uniqueTags.forEach(tag => {
        listHTML += `<li data-value="${tag}">${tag}</li>`;
    });

    dropdownList.innerHTML = listHTML;

    // Reanexa os eventos de clique aos novos itens da lista
    initDropdownItems();
}

function renderGrid(posts, filter = 'all') {
    const grid = document.getElementById('posts-grid');
    grid.innerHTML = '';

    const filteredPosts = posts.filter(post =>
        filter === 'all' || post.tag.toLowerCase().trim() === filter.toLowerCase().trim()
    );

    if (filteredPosts.length === 0) {
        grid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: var(--text-muted); padding: 50px;">Nenhuma postagem encontrada nesta categoria.</p>';
        return;
    }

    filteredPosts.forEach((post, index) => {
        const cardHTML = `
            <a href="${post.url}" class="card-link" style="opacity: 0; transform: translateY(30px);">
                <article class="card" data-tag="${post.tag}">
                    <h3>${post.title}</h3>
                    <p>${post.excerpt}</p>
                    <div class="post-meta-tag">
                        <span class="date">${post.date}</span>
                        <span class="tag">${post.tag}</span>
                    </div>
                </article>
            </a>
        `;
        grid.insertAdjacentHTML('beforeend', cardHTML);
    });

    // Anima a exibição
    const newCards = grid.querySelectorAll('.card-link');
    newCards.forEach((el, index) => {
        setTimeout(() => {
            el.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Lógica de Interface (UI)
function initStickyHeader() {
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(5, 5, 7, 0.95)';
            header.style.padding = '15px 0';
        } else {
            header.style.background = 'rgba(5, 5, 7, 0.8)';
            header.style.padding = '20px 0';
        }
    });
}

function initCustomDropdown() {
    const dropdown = document.getElementById('category-dropdown');
    if (!dropdown) return;

    const dropdownHeader = dropdown.querySelector('.dropdown-header');
    dropdownHeader.addEventListener('click', () => {
        dropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    initDropdownItems();
}

// Função separada para lidar com cliques nos itens (necessária para atualizações dinâmicas)
function initDropdownItems() {
    const dropdown = document.getElementById('category-dropdown');
    const dropdownList = dropdown.querySelector('.dropdown-list');
    const selectedText = document.getElementById('selected-category');

    dropdownList.querySelectorAll('li').forEach(item => {
        // Remove eventos antigos para evitar duplicidade se chamado várias vezes
        item.onclick = null;

        item.addEventListener('click', () => {
            const filterValue = item.getAttribute('data-value');
            selectedText.textContent = item.textContent;
            dropdown.classList.remove('active');

            // Usa os resultados em cache para filtrar
            renderGrid(allPosts, filterValue);
        });
    });
}
