// Общая функция для создания карточки новости
function createNewsCard(news) {
  const card = document.createElement('a');
  card.className = 'news-card';
  card.href = `/news/view/${news.id}`;

  const imageBox = document.createElement('div');
  imageBox.className = 'news-image-box';

  if (news.image) {
    const img = document.createElement('img');
    img.src = news.image;
    img.alt = news.title;
    // Prefer styling from CSS. Keep lazy loading enabled.
    img.loading = 'lazy';
    imageBox.appendChild(img);
  }

  const content = document.createElement('div');
  content.className = 'news-card-content';

  const title = document.createElement('h3');
  title.className = 'news-card-title';
  title.textContent = news.title;

  const description = document.createElement('p');
  description.className = 'news-card-description';
  description.textContent = news.description;

  const meta = document.createElement('div');
  meta.className = 'news-card-meta';

  const date = document.createElement('time');
  date.className = 'news-card-date';
  // Use full datetime if time is provided, otherwise fall back to date only
  const fullIso = (news.date || '') + (news.time ? ('T' + news.time) : 'T00:00');
  date.dateTime = fullIso;
  // Prefer shared formatDate if available
  if (typeof formatDate === 'function') {
    date.textContent = formatDate(fullIso);
  } else {
    date.textContent = fullIso;
  }

  meta.appendChild(date);
  content.appendChild(title);
  content.appendChild(description);
  content.appendChild(meta);

  card.appendChild(imageBox);
  card.appendChild(content);

  return card;
}