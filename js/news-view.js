// Функция для получения параметров URL
function getUrlParams() {
    const params = {};
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    for (const [key, value] of urlParams) {
        params[key] = value;
    }
    return params;
}

// Функция форматирования даты
function formatDate(dateString) {
    const date = new Date(dateString);
    const months = [
        "января", "февраля", "марта", "апреля", "мая", "июня",
        "июля", "августа", "сентября", "октября", "ноября", "декабря"
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day} ${month} ${year} • ${hours}:${minutes}`;
}

// Функция получения названия категории
function getCategoryName(category) {
    const categories = {
        'city': 'Городское хозяйство',
        'social': 'Социальная сфера',
        'culture': 'Культура',
        'sport': 'Спорт',
        'education': 'Образование'
    };
    return categories[category] || category;
}

// Функция для загрузки и отображения новости
async function loadAndDisplayNews() {
    try {
        // Получаем ID новости из URL
        const params = getUrlParams();
        const newsId = params.id;
        
        if (!newsId) {
            throw new Error('ID новости не указан');
        }

        // Загружаем данные новости
        const response = await fetch('/data/news.json');
        const news = await response.json();
        
        // Находим нужную новость
        const newsItem = news.find(item => item.id === newsId);
        
        if (!newsItem) {
            throw new Error('Новость не найдена');
        }

        // Заполняем мета-информацию
        document.title = `${newsItem.title.ru} | Мэрия города Бишкек`;
        
        // Заполняем контент
        document.querySelector('.article-date').textContent = formatDate(newsItem.date);
        document.querySelector('.article-category').textContent = getCategoryName(newsItem.category);
        document.querySelector('.article-views').textContent = `${newsItem.views || 0} просмотров`;
        document.querySelector('.article-title').textContent = newsItem.title.ru;
        document.querySelector('.article-lead').textContent = newsItem.short.ru;
        
        // Если есть изображение
        if (newsItem.image) {
            const figure = document.createElement('figure');
            figure.className = 'article-image';
            figure.innerHTML = `
                <img src="${newsItem.image}" alt="${newsItem.title.ru}" loading="lazy">
                ${newsItem.imageCaption ? `<figcaption>${newsItem.imageCaption}</figcaption>` : ''}
            `;
            document.querySelector('.article-content').insertBefore(
                figure,
                document.querySelector('.article-text')
            );
        }
        
        // Заполняем основной контент
        document.querySelector('.article-text').innerHTML = newsItem.content.ru;

        // Заполняем теги
        if (newsItem.tags && newsItem.tags.length > 0) {
            document.querySelector('.article-tags').innerHTML = newsItem.tags
                .map(tag => `<a href="/news.html?tag=${tag}" class="tag">${tag}</a>`)
                .join('');
        }

        // Загружаем связанные новости
        const relatedNews = news
            .filter(item => item.id !== newsId && item.category === newsItem.category)
            .slice(0, 3);

        document.querySelector('.related-list').innerHTML = relatedNews
            .map(item => `
                <a href="/templates/news-view.html?id=${item.id}" class="related-item">
                    <div class="related-image">
                        <img src="${item.image || '/images/news-placeholder.jpg'}" alt="${item.title.ru}" loading="lazy">
                    </div>
                    <div class="related-content">
                        <time class="related-date">${formatDate(item.date)}</time>
                        <h4 class="related-title">${item.title.ru}</h4>
                    </div>
                </a>
            `)
            .join('');

    } catch (error) {
        console.error('Ошибка при загрузке новости:', error);
        document.querySelector('.article-content').innerHTML = `
            <div class="error-message">
                <h2>Произошла ошибка</h2>
                <p>К сожалению, не удалось загрузить новость. Пожалуйста, попробуйте позже.</p>
                <a href="/news.html" class="btn btn-primary">Вернуться к списку новостей</a>
            </div>
        `;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', loadAndDisplayNews);

// Обработка кнопок шеринга
document.querySelectorAll('.share-button').forEach(button => {
    button.addEventListener('click', () => {
        const network = button.dataset.network;
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.title);
        
        const shareUrls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
            telegram: `https://t.me/share/url?url=${url}&text=${title}`
        };
        
        window.open(shareUrls[network], '_blank', 'width=600,height=400');
    });
});