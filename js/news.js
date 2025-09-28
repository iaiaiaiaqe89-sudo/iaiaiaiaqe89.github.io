// news.js - Modern news system with filtering, pagination and error handling
let currentNews = [];
let itemsPerPage = 10;
let currentPage = 1;

async function loadNews() {
  try {
    const response = await fetch("/data/news.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const news = await response.json();
    // Sort by full datetime: date + optional time (HH:MM)
    currentNews = news.sort((a, b) => {
      const da = new Date((b.date || '') + 'T' + (b.time || '00:00'));
      const db = new Date((a.date || '') + 'T' + (a.time || '00:00'));
      return da - db;
    });
    return currentNews;
  } catch (error) {
    console.error("Ошибка при загрузке новостей:", error);
    throw error;
  }
}

function filterNews(news) {
  const searchQuery = document
    .getElementById("news-search")
    ?.value.toLowerCase();
  const yearFilter = document.getElementById("news-year")?.value;
  const monthFilter = document.getElementById("news-month")?.value;
  const categoryFilter = document.getElementById("news-category")?.value;

  return news.filter((item) => {
    const date = new Date(item.date);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");

    const matchesSearch = !searchQuery || (
    (item.title?.ru?.toLowerCase().includes(searchQuery) ||
     item.title?.ky?.toLowerCase().includes(searchQuery) ||
     item.content?.ru?.toLowerCase().includes(searchQuery) ||
     item.content?.ky?.toLowerCase().includes(searchQuery) ||
     item.short?.ru?.toLowerCase().includes(searchQuery) ||
     item.short?.ky?.toLowerCase().includes(searchQuery))
  );

    const matchesYear = !yearFilter || year === yearFilter;
    const matchesMonth = !monthFilter || month === monthFilter;
    const matchesCategory = !categoryFilter || item.category === categoryFilter;

    return matchesSearch && matchesYear && matchesMonth && matchesCategory;
  });
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const months = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
  const day = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${hh}:${mm}`;
}

function createPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginationContainer = document.getElementById("news-pagination");

  if (!paginationContainer || totalPages <= 1) return;

  let html = '<div class="pagination-controls">';

  // Кнопка "Назад"
  html += `<button ${currentPage === 1 ? "disabled" : ""} onclick="changePage(${currentPage - 1})">
        ← Назад
    </button>`;

  // Номера страниц
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 2 && i <= currentPage + 2)
    ) {
      html += `<button class="${i === currentPage ? "active" : ""}" onclick="changePage(${i})">
                ${i}
            </button>`;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += '<span class="pagination-dots">...</span>';
    }
  }

  // Кнопка "Вперед"
  html += `<button ${currentPage === totalPages ? "disabled" : ""} onclick="changePage(${currentPage + 1})">
        Вперед →
    </button>`;

  html += "</div>";
  paginationContainer.innerHTML = html;
}

function changePage(page) {
  currentPage = page;
  renderAllNews("#news-list");
}

async function renderAllNews(selector) {
  const container = document.querySelector(selector);
  if (!container) return;

  try {
    const news = await loadNews();
    const filteredNews = filterNews(news);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageNews = filteredNews.slice(start, end);

    if (pageNews.length === 0) {
      container.innerHTML = '<div class="no-results">Новости не найдены</div>';
      document.getElementById("news-pagination").innerHTML = "";
      return;
    }

  const userLang = navigator.language.startsWith('ky') ? 'ky' : 'ru';
  // Prefer using the shared createNewsCard factory if available so markup is consistent.
  if (typeof createNewsCard === 'function') {
    container.innerHTML = '';
    pageNews.forEach(item => {
    const card = createNewsCard(item);
    container.appendChild(card);
    });
  } else {
    const newsHtml = pageNews.map(news => `
    <a class="news-card" href="/news/view/${news.id}">
      ${news.image ? `
        <div class="news-image-box">
          <img src="${news.image}" alt="${getPreviewTitle(news, userLang)}">
        </div>
      ` : ''}
      <div class="news-card-content">
        <div class="news-card-meta">
          <time class="news-date">${formatDate((news.date || '') + 'T' + (news.time || '00:00'))}</time>
        </div>
        <h3 class="news-card-title">${getPreviewTitle(news, userLang)}</h3>
        <p class="news-card-description">${getPreviewDescription(news, userLang)}</p>
      </div>
    </a>
  `).join('');    container.innerHTML = newsHtml;
  }
    createPagination(filteredNews.length);
  } catch (error) {
    container.innerHTML = `
            <div class="error-message">
                <p>Произошла ошибка при загрузке новостей</p>
                <button onclick="renderAllNews('${selector}')">Попробовать снова</button>
            </div>
        `;
  }
}

// Функция переключения языка новости
function switchNewsLanguage(lang) {
    const container = document.querySelector('.news-full');
    if (!container) return;

    const title = document.querySelector('.news-full h1');
    const content = document.querySelector('.news-full .news-content');
    const newsId = window.location.pathname.split('/').pop().replace('.html', '');
    
    // Находим новость в текущих данных
    const newsItem = currentNews.find(item => item.id === newsId);
    if (!newsItem) return;

    // Обновляем содержимое
    title.textContent = newsItem.title[lang] || newsItem.title.ru || newsItem.title.ky;
    content.innerHTML = newsItem.content[lang] || newsItem.content.ru || newsItem.content.ky;

    // Обновляем классы активных кнопок
    document.querySelectorAll('.news-language-switch button').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(lang));
    });
}

// Функция получения заголовка для предварительного просмотра
function getPreviewTitle(newsItem, userLang = 'ru') {
    return newsItem.title[userLang] || newsItem.title.ru || newsItem.title.ky || 'Без заголовка';
}

// Функция получения краткого описания
function getPreviewDescription(newsItem, userLang = 'ru') {
    return newsItem.short?.[userLang] || newsItem.short?.ru || newsItem.short?.ky || 
           (newsItem.content?.[userLang] || newsItem.content?.ru || newsItem.content?.ky || '').substring(0, 150) + '...';
}

async function renderNewsItem(selector) {
  const container = document.querySelector(selector);
  if (!container) return;

  try {
    const urlParts = window.location.pathname.split("/");
    const newsId = urlParts[urlParts.length - 1].replace(".html", "");
    await loadNews(); // Загружаем все новости в currentNews
    const newsItem = currentNews.find((item) => item.id.toString() === newsId);

    if (!newsItem) {
      container.innerHTML = `
                <div class="error-message">
                    <h2>Новость не найдена</h2>
                    <p>Запрашиваемая новость не существует или была удалена</p>
                    <a href="/news.html" class="button">Вернуться к списку новостей</a>
                </div>
            `;
      return;
    }

    // Обновляем заголовок страницы
    document.title = `${newsItem.title} | Мэрия города Бишкек`;

    const userLang = navigator.language.startsWith('ky') ? 'ky' : 'ru';
    const title = newsItem.title[userLang] || newsItem.title.ru || newsItem.title.ky;
    const content = newsItem.content[userLang] || newsItem.content.ru || newsItem.content.ky;
    
    container.innerHTML = `
            <article class="news-full">
                ${
                  newsItem.image
                    ? `
                    <div class="news-image-full">
                        <img src="${newsItem.image}" alt="${title}">
                    </div>
                `
                    : ""
                }
        <div class="news-meta">
          <span class="news-date">${formatDate((newsItem.date || '') + 'T' + (newsItem.time || '00:00'))}</span>
        </div>
                <h1>${title}</h1>
                <div class="news-content">${content}</div>

                ${newsItem.title.ru && newsItem.title.ky ? `
                    <div class="news-language-switch">
                        <button onclick="switchNewsLanguage('ru')" class="${userLang === 'ru' ? 'active' : ''}">Русский</button>
                        <button onclick="switchNewsLanguage('ky')" class="${userLang === 'ky' ? 'active' : ''}">Кыргызча</button>
                    </div>
                ` : ''}
                
                <div class="news-share">
                    <h3>Поделиться новостью:</h3>
                    <div class="share-buttons">
                        <button onclick="shareNews('facebook')">Facebook</button>
                        <button onclick="shareNews('twitter')">Twitter</button>
                        <button onclick="shareNews('telegram')">Telegram</button>
                    </div>
                </div>
            </article>
        `;
  } catch (error) {
    console.error("Ошибка при загрузке новости:", error);
    container.innerHTML = `
            <div class="error-message">
                <h2>Ошибка загрузки</h2>
                <p>Произошла ошибка при загрузке новости. Пожалуйста, попробуйте позже.</p>
                <button onclick="renderNewsItem('${selector}')">Попробовать снова</button>
            </div>
        `;
  }
}

// Обработчик клика по новости
function handleNewsClick(event, newsId) {
    event.preventDefault();
    window.location.href = `/news/${newsId}.html`;
    return false;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    // Определяем, какую страницу загружать
    if (path.includes('/news.html')) {
        renderAllNews('#news-list');
    } else if (path.startsWith('/news/') && path.endsWith('.html')) {
        renderNewsItem('#news-content');
    }
});

function shareNews(platform) {
    const url = window.location.href;
    const title = document.title;

    const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    };

  window.open(shareUrls[platform], "_blank", "width=600,height=400");
}
