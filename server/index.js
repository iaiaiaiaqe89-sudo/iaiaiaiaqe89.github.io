import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const newsFile = path.join(__dirname, "../data/news.json");
const documentsFile = path.join(__dirname, "../data/documents.json");

// Конфигурация приложения
app.use(bodyParser.json());

// API endpoints должны быть определены до статических файлов
// GET /api/news - получить все новости
app.get("/api/news", (req, res) => {
  try {
    let raw = "[]";
    try {
      raw = fs.readFileSync(newsFile, 'utf-8');
    } catch (err) {
      console.warn("news.json не найден, возвращаем пустой массив");
    }
    
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) {
      throw new Error("Неверный формат файла новостей");
    }
    
    res.json(data);
  } catch (err) {
    console.error("Ошибка при чтении news.json:", err);
    res.status(500).json({ error: "Ошибка при чтении файла новостей" });
  }
});

// GET /api/news/:id - получить одну новость
app.get("/api/news/:id", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(newsFile, 'utf-8'));
    const newsItem = data.find(item => item.id.toString() === req.params.id);
    
    if (!newsItem) {
      res.status(404).json({ error: 'Новость не найдена' });
      return;
    }
    
    res.json(newsItem);
  } catch (error) {
    console.error('Ошибка при получении новости:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/news - создать новость
app.post("/api/news", (req, res) => {
  try {
    const newsData = Array.isArray(req.body) ? req.body : [req.body];
    let data = [];
    
    try {
      const raw = fs.readFileSync(newsFile, 'utf-8');
      data = JSON.parse(raw);
    } catch (err) {
      console.warn("news.json не найден, создаем новый");
    }
    
    if (!Array.isArray(data)) {
      data = [];
    }
    
    // Добавляем новости
    for (const news of newsData) {
      news.id = news.id || Date.now().toString();
      data.push(news);
    }
    
    // Сохраняем файл
    fs.writeFileSync(newsFile, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ message: "Новости успешно сохранены" });
  } catch (error) {
    console.error('Ошибка при сохранении новостей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/documents - получить все документы
app.get('/api/documents', (req, res) => {
  try {
    let raw = '[]';
    try {
      raw = fs.readFileSync(documentsFile, 'utf-8');
    } catch (err) {
      console.warn('documents.json не найден, возвращаем пустой массив');
    }
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) throw new Error('Неверный формат documents.json');
    res.json(data);
  } catch (err) {
    console.error('Ошибка при чтении documents.json:', err);
    res.status(500).json({ error: 'Ошибка при чтении документов' });
  }
});

// POST /api/documents - добавить документы (поддерживает массив или один объект)
app.post('/api/documents', (req, res) => {
  try {
    const docsToAdd = Array.isArray(req.body) ? req.body : [req.body];
    let data = [];
    try { data = JSON.parse(fs.readFileSync(documentsFile, 'utf-8')); } catch (e) { data = []; }
    if (!Array.isArray(data)) data = [];
    for (const d of docsToAdd) {
      d.id = d.id || Date.now().toString();
      data.push(d);
    }
    fs.writeFileSync(documentsFile, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ message: 'Документы добавлены' });
  } catch (err) {
    console.error('Ошибка при сохранении документов:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/documents/:id - удалить документ
app.delete('/api/documents/:id', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(documentsFile, 'utf-8')) || [];
    const idx = data.findIndex(d => d.id && d.id.toString() === req.params.id.toString());
    if (idx === -1) return res.status(404).json({ error: 'Документ не найден' });
    data.splice(idx, 1);
    fs.writeFileSync(documentsFile, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ message: 'Документ удален' });
  } catch (err) {
    console.error('Ошибка при удалении документа:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/documents/:id - обновить документ
app.put('/api/documents/:id', (req, res) => {
  try {
    const id = req.params.id;
    let data = [];
    try { data = JSON.parse(fs.readFileSync(documentsFile, 'utf-8')); } catch (e) { data = []; }
    if (!Array.isArray(data)) data = [];

    const idx = data.findIndex(d => d.id && d.id.toString() === id.toString());
    if (idx === -1) return res.status(404).json({ error: 'Документ не найден' });

    // Merge existing with provided fields, keep id
    const existing = data[idx];
    const updated = Object.assign({}, existing, req.body);
    updated.id = existing.id;
    data[idx] = updated;

    fs.writeFileSync(documentsFile, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ message: 'Документ обновлён', document: updated });
  } catch (err) {
    console.error('Ошибка при обновлении документа:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/news/:id - удалить новость
app.delete("/api/news/:id", (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(newsFile, 'utf-8'));
    const index = data.findIndex(item => item.id.toString() === req.params.id);
    
    if (index === -1) {
      res.status(404).json({ error: 'Новость не найдена' });
      return;
    }
    
    data.splice(index, 1);
    fs.writeFileSync(newsFile, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ message: 'Новость успешно удалена' });
  } catch (error) {
    console.error('Ошибка при удалении новости:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Маршрут для просмотра новости
app.get("/news/view/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "../news/view.html"));
});

// Статические файлы (должны быть последними)
app.use(express.static(path.join(__dirname, "../")));

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
