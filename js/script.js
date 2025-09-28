// Loads news for the homepage (#newsGrid). It uses createNewsCard from common.js
// to ensure the DOM structure matches the CSS selectors and image wrappers.
async function loadHomeNews() {
  try {
    const res = await fetch('/api/news');
    if (!res.ok) return;
    const data = await res.json();

    const newsGrid = document.getElementById('newsGrid');
    if (!newsGrid) return; // not the homepage

    // Clear existing items
    newsGrid.innerHTML = '';

    // show only first 6
    data.slice(0, 6).forEach(item => {
      const card = createNewsCard({
        id: item.id,
        title: typeof item.title === 'object' ? item.title.ru || item.title.en || '' : (item.title || ''),
        description: typeof item.short === 'object' ? item.short.ru || item.short.en || '' : (item.short || item.content || ''),
        date: item.date,
        image: item.image || '/img/default-news.jpg'
      });
      newsGrid.appendChild(card);
    });
  } catch (err) {
    console.error('Error loading homepage news:', err);
  }
}

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  loadHomeNews();
});

// --- News page loader (filters + pagination) ---
let _filteredNews = [];
let _newsPerPage = 10;
let _currentPage = 1;

async function loadNewsPage() {
  try {
    const res = await fetch('/api/news');
    if (!res.ok) return;
    const data = await res.json();

    // initial filtered set
    _filteredNews = data.sort((a, b) => new Date(b.date) - new Date(a.date));
    _currentPage = 1;
    renderNewsPage();
    renderPagination();

    // wire up filters/search if present
    const ids = ['news-year', 'news-month', 'news-category'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', () => { _currentPage = 1; applyFiltersAndRender(); });
    });

    const search = document.getElementById('news-search');
    if (search) {
      let t;
      search.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => { _currentPage = 1; applyFiltersAndRender(); }, 300);
      });
    }

  } catch (err) {
    console.error('Error loading news page:', err);
  }
}

function applyFiltersAndRender() {
  const yearFilter = (document.getElementById('news-year') || {}).value || '';
  const monthFilter = (document.getElementById('news-month') || {}).value || '';
  const categoryFilter = (document.getElementById('news-category') || {}).value || '';
  const searchQuery = ((document.getElementById('news-search') || {}).value || '').toLowerCase();

  _filteredNews = _filteredNews.filter(item => {
    const date = new Date(item.date);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const title = ((item.title && (typeof item.title === 'object' ? item.title.ru || '' : item.title)) || '').toLowerCase();
    const content = ((item.content && (typeof item.content === 'object' ? item.content.ru || '' : item.content)) || '').toLowerCase();

    return (!yearFilter || year === yearFilter) &&
           (!monthFilter || month === monthFilter) &&
           (!categoryFilter || item.category === categoryFilter) &&
           (!searchQuery || title.includes(searchQuery) || content.includes(searchQuery));
  });

  renderNewsPage();
  renderPagination();
}

function renderNewsPage() {
  const startIndex = (_currentPage - 1) * _newsPerPage;
  const endIndex = startIndex + _newsPerPage;
  const pageNews = _filteredNews.slice(startIndex, endIndex);

  const newsContainer = document.getElementById('news-list');
  if (!newsContainer) return;

  newsContainer.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'news-grid';
  pageNews.forEach(item => {
    const card = createNewsCard({
      id: item.id,
      title: typeof item.title === 'object' ? item.title.ru || item.title.en || '' : (item.title || ''),
      description: typeof item.short === 'object' ? item.short.ru || item.short.en || '' : (item.short || item.content || ''),
      date: item.date,
      image: item.image || '/img/default-news.jpg'
    });
    grid.appendChild(card);
  });

  newsContainer.appendChild(grid);
}

function renderPagination() {
  const totalPages = Math.ceil(_filteredNews.length / _newsPerPage) || 1;
  const pagination = document.getElementById('news-pagination');
  if (!pagination) return;

  if (totalPages <= 1) { pagination.innerHTML = ''; return; }

  let html = '';
  html += `<button class="page-btn prev" ${_currentPage === 1 ? 'disabled' : ''}>Назад</button>`;
  for (let i = 1; i <= totalPages; i++) html += `<button class="page-btn ${i === _currentPage ? 'active' : ''}">${i}</button>`;
  html += `<button class="page-btn next" ${_currentPage === totalPages ? 'disabled' : ''}>Вперед</button>`;

  pagination.innerHTML = html;
  pagination.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('prev') && _currentPage > 1) _currentPage--;
      else if (btn.classList.contains('next') && _currentPage < totalPages) _currentPage++;
      else if (!isNaN(btn.textContent)) _currentPage = parseInt(btn.textContent);
      renderNewsPage();
      renderPagination();
    });
  });
}
