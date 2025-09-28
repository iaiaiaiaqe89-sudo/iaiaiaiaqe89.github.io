// Современная админ-панель для управления новостями
(async function(){
    const API_BASE = '/api/news';
    const out = document.getElementById('out');
    const list = document.getElementById('news-list');
    const form = document.getElementById('news-form');
    let data = [];

    // Вспомогательные функции
    function escapeHtml(s) {
        if(!s) return '';
        return s.replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#039;');
    }

    function showMessage(message, isError = false) {
        out.textContent = message;
        out.className = isError ? 'error-message' : 'success-message';
        if (!isError) {
            setTimeout(() => {
                out.textContent = '';
                out.className = '';
            }, 3000);
        }
    }

    // Загрузка данных
    async function fetchData() {
        try {
            const response = await fetch(API_BASE, {
                cache: 'no-store',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error('Ошибка загрузки новостей');
            
            const items = await response.json();
            if (!Array.isArray(items)) {
                throw new Error('Неверный формат данных');
            }
            
            data = items;
            renderList();
            showMessage('');
        } catch(e) {
            showMessage('Ошибка: ' + e.message, true);
            console.error(e);
        }
    }

    // Отображение списка новостей
    function renderList() {
        list.innerHTML = '';
        if (!data.length) {
            list.innerHTML = '<div class="empty">Нет новостей</div>';
            return;
        }

        // Sort by full datetime (date + optional time) so items within a day are ordered by time
        data.sort((a,b) => {
            const da = (a.date || '') + 'T' + (a.time || '00:00');
            const db = (b.date || '') + 'T' + (b.time || '00:00');
            return db.localeCompare(da);
        }).forEach((n) => {
            const el = document.createElement('div');
            el.className = 'admin-news-card';
            el.innerHTML = `
                <div class="admin-news-main">
                    <div>
                        <strong>${escapeHtml(n.date)} ${n.time ? escapeHtml(n.time) : ''}</strong> — 
                        <span>${escapeHtml(n.title?.ru || n.title?.ky || '')}</span>
                    </div>
                    <div class="admin-news-actions">
                        <button type="button" data-id="${n.id}" class="edit" title="Редактировать">✏️</button>
                        <button type="button" data-id="${n.id}" class="del" title="Удалить">🗑️</button>
                        <a href="/news/${n.id}" class="preview" target="_blank" title="Просмотр">👁️</a>
                    </div>
                </div>
                <div class="admin-news-short">${escapeHtml(n.short?.ru || n.short?.ky || '')}</div>
            `;
            list.appendChild(el);
        });

        // Добавляем обработчики событий
        list.querySelectorAll('.edit').forEach(btn => 
            btn.addEventListener('click', () => loadToForm(btn.dataset.id))
        );
        
        list.querySelectorAll('.del').forEach(btn => 
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                if(confirm('Удалить новость?')) {
                    await deleteNews(id);
                }
            })
        );
    }

    // Загрузка данных в форму для редактирования
    function loadToForm(id) {
        const n = data.find(item => item.id.toString() === id.toString());
        if (!n) {
            showMessage('Новость не найдена', true);
            return;
        }

        form.dataset.id = id;
    form.querySelector('[name="date"]').value = n.date || '';
    form.querySelector('[name="time"]').value = n.time || '';
        form.querySelector('[name="image"]').value = n.image || '';
        form.querySelector('[name="title_ru"]').value = n.title?.ru || '';
        form.querySelector('[name="title_ky"]').value = n.title?.ky || '';
        form.querySelector('[name="short_ru"]').value = n.short?.ru || '';
        form.querySelector('[name="short_ky"]').value = n.short?.ky || '';
        form.querySelector('[name="content_ru"]').value = n.content?.ru || '';
        form.querySelector('[name="content_ky"]').value = n.content?.ky || '';
        
        document.querySelector('#submit-btn').textContent = 'Обновить';
        form.scrollIntoView({ behavior: 'smooth' });
    }

    // Получение данных из формы
    function getFormData() {
        return {
            date: form.querySelector('[name="date"]').value.trim(),
            time: form.querySelector('[name="time"]').value ? form.querySelector('[name="time"]').value.trim() : '',
            image: form.querySelector('[name="image"]').value.trim(),
            title: {
                ru: form.querySelector('[name="title_ru"]').value.trim(),
                ky: form.querySelector('[name="title_ky"]').value.trim()
            },
            short: {
                ru: form.querySelector('[name="short_ru"]').value.trim(),
                ky: form.querySelector('[name="short_ky"]').value.trim()
            },
            content: {
                ru: form.querySelector('[name="content_ru"]').value.trim(),
                ky: form.querySelector('[name="content_ky"]').value.trim()
            }
        };
    }

    // Валидация формы
    function validateForm(newsData) {
        const errors = [];
        
        if (!newsData.date) {
            errors.push('Дата обязательна');
        }
        
        if (!newsData.title.ru && !newsData.title.ky) {
            errors.push('Заполните заголовок хотя бы на одном языке');
        }
        
        if (!newsData.short.ru && !newsData.short.ky) {
            errors.push('Заполните краткое описание хотя бы на одном языке');
        }
        
        if (!newsData.content.ru && !newsData.content.ky) {
            errors.push('Заполните текст новости хотя бы на одном языке');
        }
        
        return errors;
    }

    // Создание новости
    async function createNews(newsData) {
        const errors = validateForm(newsData);
        if (errors.length > 0) {
            showMessage('Ошибка: ' + errors.join(', '), true);
            return false;
        }

        try {
            const response = await fetch(API_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newsData)
            });

            if (!response.ok) throw new Error('Ошибка создания новости');
            
            await fetchData();
            showMessage('Новость успешно создана');
            return true;
        } catch(e) {
            showMessage('Ошибка: ' + e.message, true);
            console.error(e);
            return false;
        }
    }

    // Обновление новости
    async function updateNews(id, newsData) {
        const errors = validateForm(newsData);
        if (errors.length > 0) {
            showMessage('Ошибка: ' + errors.join(', '), true);
            return false;
        }

        try {
            const response = await fetch(`${API_BASE}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newsData)
            });

            if (!response.ok) throw new Error('Ошибка обновления новости');
            
            await fetchData();
            showMessage('Новость успешно обновлена');
            return true;
        } catch(e) {
            showMessage('Ошибка: ' + e.message, true);
            console.error(e);
            return false;
        }
    }

    // Удаление новости
    async function deleteNews(id) {
        try {
            const response = await fetch(`${API_BASE}/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Ошибка удаления новости');
            
            await fetchData();
            showMessage('Новость удалена');
            return true;
        } catch(e) {
            showMessage('Ошибка: ' + e.message, true);
            console.error(e);
            return false;
        }
    }

    // Обработчики событий формы
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newsData = getFormData();
        const id = form.dataset.id;
        let success = false;

        if (id) {
            success = await updateNews(id, newsData);
        } else {
            success = await createNews(newsData);
        }

        if (success) {
            form.reset();
            delete form.dataset.id;
            document.querySelector('#submit-btn').textContent = 'Создать';
        }
    });

    form.addEventListener('reset', () => {
        delete form.dataset.id;
        document.querySelector('#submit-btn').textContent = 'Создать';
        showMessage('');
    });

    // Инициализация
    await fetchData();
    // -------------------------------------------
    // Documents management (create, list, delete)
    // -------------------------------------------
    const DOC_API = '/api/documents';
    const docForm = document.getElementById('document-form');
    const docsListEl = document.getElementById('documents-list');

    async function fetchDocs() {
        try {
            const res = await fetch(DOC_API, { cache: 'no-store' });
            if (!res.ok) throw new Error('Не удалось загрузить документы');
            const items = await res.json();
            return Array.isArray(items) ? items : [];
        } catch (e) {
            console.warn(e);
            return [];
        }
    }

    function renderDocs(items) {
        docsListEl.innerHTML = '';
        if (!items.length) {
            docsListEl.innerHTML = '<div class="empty">Нет документов</div>';
            return;
        }

        items.sort((a,b) => (b.date||'').localeCompare(a.date||'')).forEach(d => {
            const el = document.createElement('div');
            el.className = 'admin-news-card';
            el.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div>
                        <strong>${escapeHtml(d.number||'—')}</strong>
                        <div style="color:var(--gray-700)">${escapeHtml(d.title?.ru||d.title||'Без названия')}</div>
                        <small style="color:var(--muted)">${escapeHtml(d.date||'')}</small>
                    </div>
                    <div style="display:flex;gap:8px;align-items:center">
                        <button data-id="${d.id}" class="btn edit-doc">Редактировать</button>
                        <a href="${d.viewUrl||d.fileUrl||'#'}" target="_blank" class="btn">Открыть</a>
                        <button data-id="${d.id}" class="btn del-doc">Удалить</button>
                    </div>
                </div>
            `;
            docsListEl.appendChild(el);
        });

        docsListEl.querySelectorAll('.edit-doc').forEach(btn => {
            btn.addEventListener('click', () => loadDocToForm(btn.dataset.id));
        });

        docsListEl.querySelectorAll('.del-doc').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Удалить документ?')) return;
                const id = btn.dataset.id;
                try {
                    const res = await fetch(`${DOC_API}/${id}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error('Ошибка при удалении');
                    showMessage('Документ удалён');
                    const newList = await fetchDocs();
                    renderDocs(newList);
                } catch (e) {
                    showMessage('Ошибка: ' + e.message, true);
                }
            });
        });
    }

    // Track editing state
    docForm.dataset.id = docForm.dataset.id || '';

    docForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(docForm);
        const payload = {
            number: (formData.get('number')||'').trim(),
            date: formData.get('date')||'',
            title: { ru: (formData.get('title_ru')||'').trim() },
            type: formData.get('type')||'other',
            department: formData.get('department')||'other',
            fileUrl: (formData.get('fileUrl')||'').trim(),
            viewUrl: (formData.get('viewUrl')||'').trim()
        };

        // basic validation
        if (!payload.number || !payload.date || !payload.title.ru) {
            showMessage('Заполните номер, дату и заголовок', true);
            return;
        }

        try {
            let res;
            const editingId = docForm.dataset.id;
            if (editingId) {
                res = await fetch(`${DOC_API}/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(DOC_API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            if (!res.ok) throw new Error('Ошибка при сохранении');
            showMessage(editingId ? 'Документ обновлён' : 'Документ добавлен');
            docForm.reset();
            delete docForm.dataset.id;
            document.getElementById('document-submit').textContent = 'Добавить документ';
            const newList = await fetchDocs();
            renderDocs(newList);
        } catch (e) {
            showMessage('Ошибка: ' + e.message, true);
        }
    });

    // Load document into form for editing
    async function loadDocToForm(id) {
        try {
            const res = await fetch(`${DOC_API}`);
            if (!res.ok) throw new Error('Не удалось загрузить');
            const items = await res.json();
            const d = items.find(x => x.id && x.id.toString() === id.toString());
            if (!d) { showMessage('Документ не найден', true); return; }
            docForm.querySelector('[name="number"]').value = d.number || '';
            docForm.querySelector('[name="date"]').value = d.date || '';
            docForm.querySelector('[name="title_ru"]').value = d.title?.ru || '';
            docForm.querySelector('[name="type"]').value = d.type || 'other';
            docForm.querySelector('[name="department"]').value = d.department || 'other';
            docForm.querySelector('[name="fileUrl"]').value = d.fileUrl || '';
            docForm.querySelector('[name="viewUrl"]').value = d.viewUrl || '';
            docForm.dataset.id = d.id;
            document.getElementById('document-submit').textContent = 'Сохранить изменения';
            docForm.scrollIntoView({ behavior: 'smooth' });
        } catch (e) {
            showMessage('Ошибка: ' + e.message, true);
        }
    }

    // initial load of documents
    (async () => {
        const docs = await fetchDocs();
        renderDocs(docs);
    })();
})();
