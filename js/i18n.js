// Текущий язык (по умолчанию русский)
let currentLang = localStorage.getItem('lang') || 'ru';
let translations = null;

// Загрузка переводов
async function loadTranslations() {
    try {
        const response = await fetch('/data/translations.json');
        if (!response.ok) throw new Error('Failed to load translations');
        translations = await response.json();
        updateLanguageUI();
    } catch (error) {
        console.error('Error loading translations:', error);
    }
}

// Функция для смены языка
function switchLanguage(lang) {
    if (translations && translations[lang]) {
        currentLang = lang;
        localStorage.setItem('lang', lang);
        updateLanguageUI();
        return true;
    }
    return false;
}

// Обновление UI при смене языка
function updateLanguageUI() {
    if (!translations) return;

    // Обновляем активный класс у переключателей языка
    document.querySelectorAll('.lang-switcher a').forEach(link => {
        const linkLang = link.getAttribute('data-lang');
        if (linkLang) {
            link.classList.toggle('active', linkLang === currentLang);
        }
    });

    // Обновляем все элементы с data-i18n атрибутом
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        const text = getTranslation(key);
        if (text) {
            // Если элемент содержит HTML, сохраняем его
            if (element.innerHTML.includes('<')) {
                // Заменяем только текстовые узлы
                element.childNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        node.textContent = text;
                    }
                });
            } else {
                element.textContent = text;
            }
        }
    });

    // Обновляем title страницы
    document.title = translations[currentLang].header.title + ' - ' + translations[currentLang].header.subtitle;
}

// Получение перевода по ключу
function getTranslation(key) {
    if (!translations || !key) return '';
    
    // Разбиваем ключ на части (например, "header.title" -> ["header", "title"])
    const parts = key.split('.');
    let value = translations[currentLang];
    
    // Проходим по частям ключа
    for (const part of parts) {
        if (value && value[part]) {
            value = value[part];
        } else {
            // Если перевод не найден, возвращаем ключ
            return key;
        }
    }
    
    return value;
}

// Функция для получения локализованного текста из объекта контента
function getLocalizedContent(content, defaultText = '') {
    if (!content) return defaultText;
    if (typeof content === 'string') return content;
    if (typeof content === 'object') {
        return content[currentLang] || content['ru'] || defaultText;
    }
    return defaultText;
}

// Функция форматирования даты
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'ky-KG', options);
}

// Функция для отображения новостей
async function displayNews(containerId, limit = null) {
    try {
        const response = await fetch('/api/news');
        if (!response.ok) throw new Error('Ошибка загрузки новостей');
        
        let news = await response.json();
        const container = document.getElementById(containerId);
        if (!container) return;

        // Сортируем по полной дате/времени (новые сверху)
        news.sort((a, b) => {
            const da = new Date((b.date || '') + 'T' + (b.time || '00:00'));
            const db = new Date((a.date || '') + 'T' + (a.time || '00:00'));
            return da - db;
        });
        
        // Применяем лимит если задан
        if (limit) news = news.slice(0, limit);
        
        container.innerHTML = ''; // Очищаем контейнер

        news.forEach(item => {
            const title = getLocalizedContent(item.title, 'Без заголовка');
            const short = getLocalizedContent(item.short, '');
            const content = getLocalizedContent(item.content, '');
            const excerpt = (short || content).substring(0, 150) + '...';

            // If createNewsCard is available (from common.js), use it to ensure
            // consistent DOM and image wrappers. Otherwise fall back to previous
            // innerHTML approach.
            if (typeof createNewsCard === 'function') {
                const card = createNewsCard({
                    id: item.id,
                    title: title,
                    description: excerpt,
                    date: item.date,
                    image: item.image || '/img/default-news.jpg'
                });
                container.appendChild(card);
            } else {
                const card = document.createElement('div');
                card.className = 'news-card';
                card.innerHTML = `
                    <img src="${item.image || '/img/default-news.jpg'}" alt="${title}">
                    <div class="news-card-content">
                        <div class="news-date">${formatDate((item.date || '') + 'T' + (item.time || '00:00'))}</div>
                        <h3>${title}</h3>
                        <p class="news-excerpt">${excerpt}</p>
                        <a href="/news/view/${item.id}" class="news-link">
                            ${getTranslation('news.readMore')}
                        </a>
                    </div>
                `;
                container.appendChild(card);
            }
        });
    } catch (error) {
        console.error('Ошибка при загрузке новостей:', error);
        document.getElementById(containerId).innerHTML = 
            `<p class="error-message">${
                getTranslation('news.loadError') || 
                (currentLang === 'ru' ? 
                    'Не удалось загрузить новости' : 
                    'Жаңылыктарды жүктөө мүмкүн эмес'
                )
            }</p>`;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Загружаем переводы
    loadTranslations().then(() => {
        // Инициализируем переключатели языка
        document.querySelectorAll('.lang-switcher a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const lang = link.getAttribute('data-lang');
                if (lang) switchLanguage(lang);
            });
        });
        
        // Первичное обновление UI
        updateLanguageUI();
    });
});