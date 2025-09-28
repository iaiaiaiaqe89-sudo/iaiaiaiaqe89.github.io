// admin.js - Управление новостями с правильной валидацией и сортировкой
const newsApiUrl = "/data/news.json";
let currentNews = [];

// DOM элементы
const newsForm = document.getElementById("news-form");
const newsList = document.getElementById("news-list");
const messageBox = document.getElementById("out");
const submitBtn = document.getElementById("submit-btn");

// Вспомогательные функции
function showMessage(message, isError = false) {
  messageBox.innerHTML = `<div class="message ${isError ? "error" : "success"}">${message}</div>`;
  setTimeout(() => (messageBox.innerHTML = ""), 3000);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function validateNewsData(formData) {
  // Проверка даты
  if (!formData.get("date")) {
    throw new Error("Укажите дату публикации");
  }

  // Проверка валидности даты
  const date = new Date(formData.get("date"));
  if (isNaN(date.getTime())) {
    throw new Error("Неверный формат даты");
  }

  // Проверка наличия хотя бы одной языковой версии
  const hasRussian = formData.get("title_ru")?.trim() && formData.get("content_ru")?.trim();
  const hasKyrgyz = formData.get("title_ky")?.trim() && formData.get("content_ky")?.trim();

  if (!hasRussian && !hasKyrgyz) {
    throw new Error("Заполните данные (заголовок и содержание) хотя бы на одном языке");
  }

  // Проверка URL изображения
  const imageUrl = formData.get("image")?.trim();
  if (imageUrl) {
    try {
      new URL(imageUrl);
    } catch (e) {
      throw new Error("Некорректный URL изображения");
    }
  }

  return true;
}

// Загрузка новостей
async function loadNews() {
  try {
    const response = await fetch(newsApiUrl);
    if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);

    currentNews = await response.json();
    sortNews();
    renderNewsList();
    return true;
  } catch (error) {
    console.error("Ошибка при загрузке новостей:", error);
    showMessage("Ошибка при загрузке новостей", true);
    return false;
  }
}

// Сортировка новостей
function sortNews() {
  if (!Array.isArray(currentNews)) return;
  
  currentNews.sort((a, b) => {
    if (!a || !b) return 0;

    // Сначала по дате (новые сверху)
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    const dateComparison = dateB - dateA;
    if (dateComparison !== 0) return dateComparison;

    // При одинаковой дате - по заголовку
    const titleA = a.title?.ru || a.title?.ky || "";
    const titleB = b.title?.ru || b.title?.ky || "";
    return titleA.toLowerCase().localeCompare(titleB.toLowerCase());
  });
}

// Рендер списка новостей
function renderNewsList() {
  if (!newsList) return;

  if (currentNews.length === 0) {
    newsList.innerHTML = '<div class="no-news">Нет добавленных новостей</div>';
    return;
  }

  const newsHtml = currentNews
    .map(
      (news, index) => `
        <article class="news-item-admin">
            <div class="news-item-header">
                <span class="news-date">${formatDate(news.date)}</span>
                <div class="news-actions">
                    <button onclick="moveNews(${index}, -1)" class="btn-icon" title="Переместить выше" ${index === 0 ? "disabled" : ""}>↑</button>
                    <button onclick="moveNews(${index}, 1)" class="btn-icon" title="Переместить ниже" ${index === currentNews.length - 1 ? "disabled" : ""}>↓</button>
                    <button onclick="editNews(${index})" class="btn-icon" title="Редактировать">✏️</button>
                    <button onclick="deleteNews(${index})" class="btn-icon" title="Удалить">🗑️</button>
                </div>
            </div>
            
            <div class="news-content-preview">
                ${
                  news.image
                    ? `
                    <div class="news-image-preview">
                        <img src="${news.image}" alt="${news.title?.ru || news.title?.ky || "Новость"}" 
                             onerror="this.onerror=null;this.src='/images/no-image.png';">
                    </div>
                `
                    : ""
                }
                
                <div class="news-text-preview">
                    ${
                      news.title?.ru
                        ? `
                        <div class="news-lang-block">
                            <span class="lang-label">RU</span>
                            <h3>${news.title.ru}</h3>
                            <p>${news.short?.ru || ""}</p>
                        </div>
                    `
                        : ""
                    }
                    
                    ${
                      news.title?.ky
                        ? `
                        <div class="news-lang-block">
                            <span class="lang-label">KG</span>
                            <h3>${news.title.ky}</h3>
                            <p>${news.short?.ky || ""}</p>
                        </div>
                    `
                        : ""
                    }
                </div>
            </div>
        </article>
    `,
    )
    .join("");

  newsList.innerHTML = newsHtml;
}

// Управление новостями
async function deleteNews(index) {
  if (!Array.isArray(currentNews) || index < 0 || index >= currentNews.length) {
    showMessage("Ошибка: новость не найдена", true);
    return;
  }

  if (!confirm("Вы действительно хотите удалить эту новость?")) {
    return;
  }

  try {
    const newsId = currentNews[index].id;
    const response = await fetch(`/api/news/${newsId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    await response.json();
    
    currentNews.splice(index, 1);
    renderNewsList();
    
    showMessage("Новость успешно удалена");
    
    // Если была открыта форма редактирования этой новости, очищаем её
    if (newsForm.dataset.editIndex === index.toString()) {
      resetForm();
    }
  } catch (error) {
    console.error("Ошибка при удалении новости:", error);
    showMessage("Ошибка при удалении новости", true);
  }
}

async function moveNews(index, direction) {
  if (!Array.isArray(currentNews) || index < 0 || index >= currentNews.length) {
    showMessage("Ошибка: неверный индекс новости", true);
    return;
  }

  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= currentNews.length) return;

  const item = currentNews[index];
  currentNews.splice(index, 1);
  currentNews.splice(newIndex, 0, item);
  renderNewsList();
  
  // Сохраняем изменения порядка
  try {
    await saveNews();
  } catch (error) {
    console.error("Ошибка при сохранении порядка новостей:", error);
    showMessage("Ошибка при сохранении порядка", true);
  }
}

function editNews(index) {
  const news = currentNews[index];

  // Заполняем форму данными новости
  document.getElementById("date").value = news.date;
  document.getElementById("image").value = news.image || "";

  // Заполняем языковые поля
  ["ru", "ky"].forEach((lang) => {
    if (news.title?.[lang]) {
      document.querySelector(`[name="title_${lang}"]`).value = news.title[lang];
    }
    if (news.short?.[lang]) {
      document.querySelector(`[name="short_${lang}"]`).value = news.short[lang];
    }
    if (news.content?.[lang]) {
      document.querySelector(`[name="content_${lang}"]`).value =
        news.content[lang];
    }
  });

  // Меняем текст кнопки и добавляем data-attribute для идентификации режима редактирования
  submitBtn.textContent = "Сохранить изменения";
  newsForm.dataset.editIndex = index;

  // Скроллим к форме
  newsForm.scrollIntoView({ behavior: "smooth" });
}

// Сохранение новостей
async function saveNews() {
  try {
    const response = await fetch(newsApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(currentNews),
    });

    if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);

    showMessage("Новости успешно сохранены");
    renderNewsList();
    return true;
  } catch (error) {
    console.error("Ошибка при сохранении:", error);
    showMessage("Ошибка при сохранении новостей", true);
    return false;
  }
}

// Функция сброса формы
function resetForm() {
  newsForm.reset();
  delete newsForm.dataset.editIndex;
  submitBtn.textContent = "Создать";
  // Очищаем все текстовые поля
  newsForm.querySelectorAll('input[type="text"], textarea').forEach(field => {
    field.value = "";
  });
}

// Обработка формы
newsForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const formData = new FormData(event.target);
    validateNewsData(formData);

    const newsItem = {
      id: Date.now().toString(),
      date: formData.get("date"),
      image: formData.get("image")?.trim() || "",
      title: {},
      short: {},
      content: {},
    };

    // Обработка языковых версий
    ["ru", "ky"].forEach((lang) => {
      const title = formData.get(`title_${lang}`)?.trim();
      if (title) {
        newsItem.title[lang] = title;
        newsItem.short[lang] = formData.get(`short_${lang}`)?.trim() || "";
        newsItem.content[lang] = formData.get(`content_${lang}`)?.trim() || "";
      }
    });

    const editIndex = parseInt(newsForm.dataset.editIndex);
    if (!isNaN(editIndex) && editIndex >= 0 && editIndex < currentNews.length) {
      // Режим редактирования
      currentNews[editIndex] = {
        ...currentNews[editIndex],
        ...newsItem,
      };
    } else {
      // Режим создания
      currentNews.unshift(newsItem);
    }

    if (await saveNews()) {
      resetForm();
      sortNews();
      renderNewsList();
      showMessage(editIndex >= 0 ? "Новость успешно обновлена" : "Новость успешно создана");
    }
  } catch (error) {
    showMessage(error.message, true);
  }
});

// Инициализация
document.addEventListener("DOMContentLoaded", loadNews);
