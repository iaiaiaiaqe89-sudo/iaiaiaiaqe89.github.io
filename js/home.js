// home.js - populate homepage: featured news, photo strip, weather and AQ

(async function(){
  const NEWS_SRC = '/api/news';
  const newsGrid = document.getElementById('newsGrid');
  const photoStrip = document.getElementById('photo-strip');
  const bannerStrip = document.getElementById('banner-strip');
  const servicesGrid = document.getElementById('services-grid');
  const decisionsGrid = document.getElementById('decisions-grid');
  const eventsGrid = document.getElementById('events-grid');
  const quickLinksEl = document.getElementById('quick-links');
  const heroStatsEl = document.getElementById('hero-stats');

  // static photos for homepage gallery (do NOT use news images)
  const STATIC_PHOTOS = [
    '/assets/photos/photo1.svg',
    '/assets/photos/photo2.svg',
    '/assets/photos/photo3.svg',
    '/assets/photos/photo4.svg',
    '/assets/photos/photo5.svg',
    '/assets/photos/photo6.svg'
  ];

  function createFeaturedCard(item, photoSrc){
    const a = document.createElement('a');
    a.className = 'featured-card';
    a.href = `/news/view/${item.id}`;

    const imgBox = document.createElement('div');
    imgBox.className = 'featured-image';
    // Use curated static photo for homepage visuals (do NOT use news images here)
    const img = document.createElement('img');
    img.src = photoSrc || STATIC_PHOTOS[0];
    img.alt = item.title?.ru || item.title?.ky || '';
    img.loading = 'lazy';
    imgBox.appendChild(img);

    const body = document.createElement('div');
    body.className = 'featured-body';

    const meta = document.createElement('div');
    meta.className = 'featured-meta';
    const dt = (item.date||'') + 'T' + (item.time||'00:00');
    const timeEl = document.createElement('time');
    timeEl.dateTime = dt;
    timeEl.textContent = (typeof formatDate === 'function') ? formatDate(dt) : dt;
    meta.appendChild(timeEl);

    const h = document.createElement('h3');
    h.className = 'featured-title';
    h.textContent = item.title?.ru || item.title?.ky || 'Без названия';

    const p = document.createElement('p');
    p.className = 'featured-excerpt';
    p.textContent = (item.short?.ru || item.short?.ky || '').substring(0, 200);

    body.appendChild(meta);
    body.appendChild(h);
    body.appendChild(p);

    a.appendChild(imgBox);
    a.appendChild(body);
    return a;
  }

  async function loadNews(){
    // Prefer local cached snapshot from official site to avoid CORS; fallback to /api/news
    try{
      const local = await fetch('/data/bishkek_home.json');
      if(local.ok){
        const json = await local.json();
        // map to expected shape
        return json.map(item => ({ id:item.id, title:{ru:item.title_ru}, date:item.date, image:item.image, link:item.link }));
      }
    }catch(e){ /* ignore */ }
    try{
      const res = await fetch(NEWS_SRC, { cache: 'no-store' });
      if(!res.ok) throw new Error('No news');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }catch(e){
      console.warn('Cannot load news for homepage', e);
      return [];
    }
  }

  async function render(){
    const items = await loadNews();
    // items may be empty; still render layout
    if(!Array.isArray(items)) return;

    // Sort by datetime (newest first)
    items.sort((a,b) => new Date((b.date||'')+'T'+(b.time||'00:00')) - new Date((a.date||'')+'T'+(a.time||'00:00')));

    // Featured: first 3 large cards (use curated photos)
    const featured = items.slice(0,3);
    const rest = items.slice(3,9);

    if(newsGrid){
      newsGrid.innerHTML = '';
      const featWrap = document.createElement('div');
      featWrap.className = 'featured-row';
      featured.forEach((item, i) => featWrap.appendChild(createFeaturedCard(item, STATIC_PHOTOS[i % STATIC_PHOTOS.length])));
      newsGrid.appendChild(featWrap);

      // Smaller grid below
      if(rest.length){
        const grid = document.createElement('div');
        grid.className = 'mini-grid';
        rest.forEach((it, idx) => {
          const c = document.createElement('a');
          c.className = 'mini-card';
          c.href = `/news/view/${it.id}`;
          const thumbSrc = STATIC_PHOTOS[(3 + idx) % STATIC_PHOTOS.length];
          c.innerHTML = `
            <div class="mini-thumb"><img src="${thumbSrc}" alt=""></div>
            <div class="mini-body">
              <time>${(typeof formatDate==='function')?formatDate((it.date||'')+'T'+(it.time||'00:00')):((it.date||'')+' '+(it.time||''))}</time>
              <h4>${(it.title?.ru||it.title?.ky||'Без названия')}</h4>
            </div>
          `;
          grid.appendChild(c);
        });
        newsGrid.appendChild(grid);
      }
    }

    // Announcements ticker (top headlines)
    const announcementsEl = document.getElementById('announcements');
    if(announcementsEl){
      announcementsEl.innerHTML = '';
      const headlines = items.slice(0,8).map(it => ({ id: it.id, title: it.title?.ru || it.title?.ky || 'Без названия' }));
      const ul = document.createElement('div'); ul.className='ann-list';
      headlines.forEach(h => {
        const a = document.createElement('a'); a.href = `/news/view/${h.id}`; a.className='ann-item'; a.textContent = h.title;
        ul.appendChild(a);
      });
      announcementsEl.appendChild(ul);
    }

    // Quick links (common actions)
    const QUICK_LINKS = [
      { href:'/documents.html', title:'Документы' },
      { href:'/news.html', title:'Новости' },
      { href:'/structure.html', title:'Структура' },
      { href:'/contacts.html', title:'Контакты' },
      { href:'/services.html', title:'Электронные услуги' },
      { href:'/projects.html', title:'Городские проекты' }
    ];
    if(quickLinksEl){ quickLinksEl.innerHTML=''; QUICK_LINKS.forEach(q=>{ const a=document.createElement('a'); a.className='ql'; a.href=q.href; a.textContent=q.title; quickLinksEl.appendChild(a); }); }

    // Hero stats (example values)
    const STATS = [ {v:'+120', t:'Услуг онлайн'}, {v:'8', t:'Проектов'}, {v:'24/7', t:'Поддержка'}, {v:'1M+', t:'Посетителей/мес'} ];
    if(heroStatsEl){ heroStatsEl.innerHTML=''; STATS.forEach(s=>{ const c=document.createElement('div'); c.className='stat-card'; c.innerHTML=`<div class="stat-value">${s.v}</div><div class="stat-label">${s.t}</div>`; heroStatsEl.appendChild(c); }); }

    // Services grid
    if(servicesGrid){ servicesGrid.innerHTML=''; QUICK_LINKS.forEach(s=>{ const card=document.createElement('a'); card.className='service-card'; card.href=s.href; card.innerHTML=`<strong>${s.title}</strong><span>Перейти</span>`; servicesGrid.appendChild(card); }); }

    // Decisions & latest documents (from /api/documents)
    try{
      const docsRes = await fetch('/api/documents');
      const docs = await docsRes.json();
      if(decisionsGrid){ decisionsGrid.innerHTML=''; (docs||[]).slice(0,6).forEach(d => { const a=document.createElement('a'); a.className='decision-card'; a.href=d.url||'#'; a.innerHTML=`<strong>${d.title?.ru||d.title?.ky||d.name||'Документ'}</strong><small>${d.date||''}</small>`; decisionsGrid.appendChild(a); }); }
    }catch(e){ console.warn('Documents fetch failed', e); }

    // Events grid (use news items)
    if(eventsGrid){ eventsGrid.innerHTML=''; items.slice(0,6).forEach(it=>{ const ev=document.createElement('a'); ev.className='event-card'; ev.href=`/news/view/${it.id}`; ev.innerHTML=`<div class="ev-date">${(it.date||'')}</div><div class="ev-title">${it.title?.ru||it.title?.ky||'Событие'}</div>`; eventsGrid.appendChild(ev); }); }

    // Banner strip with internet photos (Unsplash source)
    if(bannerStrip){ bannerStrip.innerHTML=''; for(let i=0;i<8;i++){ const div=document.createElement('div'); div.className='banner-item'; const img=document.createElement('img'); img.src=`https://source.unsplash.com/collection/190727/1200x600?sig=${i}`; img.alt='Фото города'; img.loading='lazy'; div.appendChild(img); bannerStrip.appendChild(div); } }

    // subtle reveal animations for featured & mini cards
    const observer = new IntersectionObserver((entries)=>{
      entries.forEach(ent => {
        if(ent.isIntersecting){
          ent.target.classList.add('in-view');
          observer.unobserve(ent.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.featured-card, .mini-card').forEach(n => observer.observe(n));
  }

  // Weather + AQ (Open-Meteo) - using Bishkek coordinates
  async function loadWeather(){
    try{
      const lat = 43.238949; const lon = 76.889709; // Bishkek
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m`);
      const weather = await weatherRes.json();
      const temp = weather.current_weather?.temperature;
      const wind = weather.current_weather?.windspeed;
      document.getElementById('weather-temp').textContent = temp ? Math.round(temp)+'°C' : '--';
      document.getElementById('weather-wind').textContent = wind ? wind+' м/с' : '--';
      document.getElementById('weather-desc').textContent = weather.current_weather?.weathercode || '—';

      // Air quality via Open-Meteo's air-quality API (no key)
      const aqRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}`);
      const aq = await aqRes.json();
      const aqi = aq.hourly?.us_aqi?.[0];
      const aqiEl = document.getElementById('weather-aqi');
      aqiEl.textContent = aqi ? aqi : '--';
      // color coding for AQ index
      if(typeof aqi === 'number'){
        let cls = 'aq-good';
        if(aqi > 150) cls = 'aq-bad';
        else if(aqi > 100) cls = 'aq-poor';
        else if(aqi > 50) cls = 'aq-moderate';
        else cls = 'aq-good';
        aqiEl.className = cls;
      }

    }catch(e){
      console.warn('Weather API failed', e);
    }
  }

  // Kick off
  render();
  loadWeather();

})();
