/* ============================================================
   server wiki — общий каркас (сайдбар, шапка, футер, навигация)
   Каждая страница задаёт <body data-page="id"> и кладёт контент
   в <main class="content">. Остальное строит этот скрипт.
   ============================================================ */
(function () {
  // База путей: страницы лежат в /pages/, корень — на уровень выше
  var inPages = location.pathname.replace(/\\/g, '/').indexOf('/pages/') !== -1;
  var R = inPages ? '../' : '';

  // Подключение: IP — плейсхолдер (замените), Discord — реальный
  var CONNECT = { ip: 'play.server.ru', discord: 'https://discord.gg/nCaQaXrzhx' };

  var NAV = [
    { title: 'Начало', links: [
      { id: 'home',        ic: '⌂', t: 'Главная',          h: 'index.html' },
      { id: 'philosophy',  ic: '✦', t: 'Философия сервера', h: 'pages/philosophy.html' },
      { id: 'start',       ic: '➤', t: 'С чего начать',     h: 'pages/start.html' },
    ]},
    { title: 'Мир', links: [
      { id: 'world',       ic: '⊕', t: 'Мир и исследование', h: 'pages/world.html' },
      { id: 'stages',      ic: '▲', t: 'Стадии развития',    h: 'pages/stages.html' },
      { id: 'peaceful',    ic: '☮', t: 'Мирные игроки',      h: 'pages/peaceful.html' },
      { id: 'city',        ic: '⛫', t: 'Город',              h: 'pages/city.html' },
      { id: 'court',       ic: '⚖', t: 'Суд',                h: 'pages/court.html' },
      { id: 'economy',     ic: '⇄', t: 'Экономика',          h: 'pages/economy.html' },
    ]},
    { title: 'Война', links: [
      { id: 'factions',    ic: '⚑', t: 'Фракции',            h: 'pages/factions.html' },
      { id: 'core',        ic: '⬢', t: 'Ядро фракции',       h: 'pages/core.html' },
      { id: 'war',         ic: '⚔', t: 'Войны и рейды',      h: 'pages/war.html' },
      { id: 'outposts',    ic: '⚐', t: 'Аванпосты (РТ)',     h: 'pages/outposts.html' },
    ]},
    { title: 'Контент', links: [
      { id: 'contracts',   ic: '✎', t: 'Контракты',          h: 'pages/contracts.html' },
      { id: 'airdrops',    ic: '✈', t: 'Аирдропы',           h: 'pages/airdrops.html' },
      { id: 'bosses',      ic: '☠', t: 'Мировые боссы',      h: 'pages/bosses.html' },
      { id: 'progression', ic: '↗', t: 'Прогрессия',         h: 'pages/progression.html' },
    ]},
    { title: 'Предметы', links: [
      { id: 'items',       ic: '◆', t: 'Каталог предметов',  h: 'pages/items.html' },
      { id: 'recipes',     ic: '⚒', t: 'Рецепты крафта',     h: 'pages/recipes.html' },
    ]},
    { title: 'Правила и сервис', links: [
      { id: 'fairplay',    ic: '◉', t: 'Честная игра',       h: 'pages/fairplay.html' },
      { id: 'rules',       ic: '§', t: 'Правила',            h: 'pages/rules.html' },
      { id: 'qa',          ic: '?', t: 'Вопросы и ответы',   h: 'pages/qa.html' },
    ]},
  ];

  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function abs(h) { return R + h; }

  var page = document.body.getAttribute('data-page') || '';
  var pageTitle = document.body.getAttribute('data-title') || 'server';

  // ---- Sidebar ----
  var navStored = {};
  try { navStored = JSON.parse(localStorage.getItem('navCollapsed') || '{}'); } catch (e) {}

  var navHtml = '';
  NAV.forEach(function (g) {
    var hasActive = g.links.some(function (l) { return l.id === page; });
    var collapsed = !!navStored[g.title] && !hasActive;
    navHtml += '<div class="nav-group' + (collapsed ? ' collapsed' : '') + '" data-g="' + g.title + '">' +
      '<button class="nav-title" type="button" aria-expanded="' + (collapsed ? 'false' : 'true') + '">' +
        '<span>' + g.title + '</span></button>' +
      '<div class="nav-links">';
    g.links.forEach(function (l) {
      navHtml += '<a class="nav-link' + (l.id === page ? ' active' : '') + '" href="' + abs(l.h) + '">' +
        '<span class="ic">' + l.ic + '</span><span>' + l.t + '</span></a>';
    });
    navHtml += '</div></div>';
  });

  var searchHtml =
    '<div class="sb-search">' +
      '<input type="text" class="sb-input" placeholder="Поиск по вики…" autocomplete="off" spellcheck="false" aria-label="Поиск по вики">' +
      '<div class="sb-results" role="listbox"></div>' +
    '</div>';

  var sidebar = el(
    '<aside class="sidebar">' +
      '<a class="brand" href="' + abs('index.html') + '" style="text-decoration:none">' +
        '<span class="logo">S</span>' +
        '<span class="name">server<small>вики сервера</small></span>' +
      '</a>' + searchHtml + navHtml +
    '</aside>'
  );

  // ---- Topbar ----
  var topbar = el(
    '<div class="topbar">' +
      '<button class="menu-btn" aria-label="Меню">☰</button>' +
      '<div class="crumbs"><a href="' + abs('index.html') + '">Вики</a> / ' + pageTitle + '</div>' +
      '<div class="spacer"></div>' +
      '<a class="connect-pill" href="' + CONNECT.discord + '" target="_blank" rel="noopener" title="Discord-сервер">✦ Discord</a>' +
      '<span class="connect-pill ip-pill" role="button" tabindex="0" title="Нажмите, чтобы скопировать IP">▶ ' + CONNECT.ip + '</span>' +
    '</div>'
  );

  var foot = el(
    '<footer class="foot">' +
      'Вики сервера «server» · контент описывает игровые механики · ' +
      '<a href="' + CONNECT.discord + '" target="_blank" rel="noopener">Discord</a><br>' +
      'Мир существует постоянно. История пишется игроками.' +
    '</footer>'
  );

  // ---- Assemble ----
  var content = document.querySelector('.content');
  var layout = el('<div class="layout"></div>');
  var main = el('<div class="main"></div>');
  document.body.insertBefore(layout, content);
  layout.appendChild(sidebar);
  layout.appendChild(main);
  main.appendChild(topbar);
  main.appendChild(content);
  main.appendChild(foot);

  var scrim = el('<div class="nav-scrim"></div>');
  document.body.appendChild(scrim);

  function toggle(v) { document.body.classList.toggle('nav-open', v); }
  topbar.querySelector('.menu-btn').addEventListener('click', function () {
    toggle(!document.body.classList.contains('nav-open'));
  });
  scrim.addEventListener('click', function () { toggle(false); });

  // Сворачиваемые группы навигации (состояние запоминается)
  Array.prototype.forEach.call(sidebar.querySelectorAll('.nav-title'), function (btn) {
    btn.addEventListener('click', function () {
      var g = btn.parentNode;
      var isCollapsed = g.classList.toggle('collapsed');
      btn.setAttribute('aria-expanded', String(!isCollapsed));
      try {
        var st = JSON.parse(localStorage.getItem('navCollapsed') || '{}');
        st[g.getAttribute('data-g')] = isCollapsed;
        localStorage.setItem('navCollapsed', JSON.stringify(st));
      } catch (e) {}
    });
  });

  // Копирование IP по клику (сервер в разработке — IP пока плейсхолдер)
  var ipPill = topbar.querySelector('.ip-pill');
  if (ipPill) {
    var ipCopy = function () {
      var restore = function () { ipPill.textContent = '▶ ' + CONNECT.ip; };
      var done = function () { ipPill.textContent = '✔ Скопировано'; setTimeout(restore, 1200); };
      var fallback = function () {
        var t = document.createElement('textarea');
        t.value = CONNECT.ip; t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.focus(); t.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(t); done();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(CONNECT.ip).then(done, fallback);
      } else { fallback(); }
    };
    ipPill.addEventListener('click', ipCopy);
    ipPill.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ipCopy(); }
    });
  }

  // Скриншоты: помечаем загруженные, иначе остаётся рамка-заглушка
  Array.prototype.forEach.call(document.querySelectorAll('.shot img'), function (img) {
    function ok() { if (img.naturalWidth > 1) img.classList.add('loaded'); }
    if (img.complete) ok(); else { img.addEventListener('load', ok); img.addEventListener('error', function () {}); }
  });

  // ---- Автоякоря на заголовки (чтобы поиск вёл к нужному разделу) ----
  function slugify(s) {
    return (s || '').toLowerCase().replace(/ё/g, 'е')
      .replace(/[^0-9a-zа-я]+/gi, '-').replace(/^-+|-+$/g, '') || 'section';
  }
  (function anchorHeadings() {
    var used = {};
    Array.prototype.forEach.call(content.querySelectorAll('h1,h2,h3,h4'), function (h) {
      if (h.id) { used[h.id] = 1; return; }
      var base = slugify(h.textContent), id = base, n = 2;
      while (used[id] || document.getElementById(id)) id = base + '-' + (n++);
      used[id] = 1; h.id = id;
    });
    // якорь мог быть задан до появления id — доскроллить и подсветить раздел
    if (location.hash) setTimeout(flashHash, 0);
  })();

  // Подсветка целевого заголовка на пару секунд (переход из поиска)
  function flashHash() {
    if (!location.hash) return;
    var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!el) return;
    el.scrollIntoView();
    el.classList.remove('search-flash');
    void el.offsetWidth;               // рестарт анимации
    el.classList.add('search-flash');
    setTimeout(function () { el.classList.remove('search-flash'); }, 2200);
  }
  window.addEventListener('hashchange', flashHash);

  // ---- Поиск: полнотекстовый (заголовки + текст страниц + предметы), сниппеты, переход к разделу ----
  (function initSearch() {
    var box = sidebar.querySelector('.sb-search');
    if (!box) return;
    var input = box.querySelector('.sb-input');
    var results = box.querySelector('.sb-results');

    var index = null;         // полный индекс (строится один раз)
    var building = false;
    var pendingQuery = null;  // запрос, который надо показать после сборки
    var sel = -1;

    function norm(s) { return (s || '').toLowerCase().replace(/ё/g, 'е'); }
    function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    // Разбор страницы на секции по заголовкам (id совпадают с anchorHeadings)
    function parsePage(link, html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var contentEl = doc.querySelector('.content');
      if (!contentEl) return [];
      var pageTitle = (doc.body && doc.body.getAttribute('data-title')) || link.t;
      var used = {}, sections = [], cur = null;
      function pushCur() { if (cur && (cur.body || cur.t)) sections.push(cur); }
      // обход в порядке чтения: те же заголовки и слаги, что и anchorHeadings на живой странице
      var walker = doc.createTreeWalker(contentEl, 5 /* ELEMENT|TEXT */, null);
      var node;
      while ((node = walker.nextNode())) {
        if (node.nodeType === 1 && /^H[1-4]$/.test(node.tagName)) {
          pushCur();
          var base = slugify(node.textContent), id = base, n = 2;
          while (used[id]) id = base + '-' + (n++);
          used[id] = 1;
          cur = { t: node.textContent.replace(/\s+/g, ' ').trim(), id: id, body: '' };
        } else if (node.nodeType === 3) {
          if (node.parentNode && /^H[1-4]$/.test(node.parentNode.tagName)) continue; // текст самого заголовка
          var txt = node.nodeValue.replace(/\s+/g, ' ').trim();
          if (txt) { if (!cur) cur = { t: pageTitle, id: '', body: '' }; cur.body += (cur.body ? ' ' : '') + txt; }
        }
      }
      pushCur();
      return sections.map(function (s) {
        return {
          type: 'section', ic: link.ic, htitle: s.t, page: pageTitle,
          url: link.path + (s.id ? '#' + s.id : ''), // от корня; базу подставит render
          hay: norm(s.t + ' ' + s.body), raw: s.body
        };
      });
    }

    function itemEntries() {
      if (!window.ITEMS) return [];
      return window.ITEMS.map(function (it) {
        var cat = (window.CATS && window.CATS[it.cat]) || 'Предмет';
        var lore = (it.lore || []).join(' ').replace(/&[0-9a-frlmnok]/gi, ' ');
        var body = [it.desc, it.how, lore].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
        return {
          type: 'item', ic: it.sym || '◆', htitle: it.name, page: cat,
          url: 'pages/item.html?id=' + it.id, // от корня; базу подставит render
          hay: norm(it.name + ' ' + cat + ' ' + body), raw: it.desc || body
        };
      });
    }

    function loadItems() {
      return new Promise(function (res) {
        if (window.ITEMS) return res();
        var s = document.createElement('script');
        s.src = R + 'js/items-data.js';
        s.onload = function () { res(); };
        s.onerror = function () { res(); };
        document.body.appendChild(s);
      });
    }

    function build() {
      if (index || building) return;
      // 1) Готовый статический индекс страниц (js/search-index.js) — работает и по file://;
      //    предметы добавляем в рантайме (их <script> грузится и по file://, в отличие от fetch)
      if (window.SEARCH_INDEX && window.SEARCH_INDEX.length) {
        building = true;
        loadItems().then(function () {
          index = window.SEARCH_INDEX.concat(itemEntries());
          if (pendingQuery != null) render(pendingQuery);
        });
        return;
      }
      // 2) Запасной путь: собрать на лету через fetch (только по http — на file:// fetch запрещён)
      building = true;
      if (pendingQuery != null && pendingQuery.trim()) renderBuilding();

      var pages = [];
      NAV.forEach(function (g) { g.links.forEach(function (l) { pages.push({ path: l.h, u: abs(l.h), ic: l.ic, t: l.t }); }); });

      loadItems().then(function () {
        return Promise.all(pages.map(function (p) {
          return fetch(p.u).then(function (r) { return r.text(); })
            .then(function (html) { return parsePage(p, html); })
            .catch(function () { return []; });
        }));
      }).then(function (chunks) {
        var idx = [];
        chunks.forEach(function (c) { idx = idx.concat(c); });
        idx = idx.concat(itemEntries());
        index = idx; building = false;
        if (pendingQuery != null) render(pendingQuery);
      });
    }

    function hl(text, q) {
      var n = norm(text), i = n.indexOf(q);
      if (i < 0) return esc(text);
      return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
    }
    function snippet(raw, q) {
      if (!raw) return '';
      var n = norm(raw), i = n.indexOf(q);
      if (i < 0) return '';
      var start = Math.max(0, i - 34), end = Math.min(raw.length, i + q.length + 64);
      var s = (start > 0 ? '…' : '') + raw.slice(start, end) + (end < raw.length ? '…' : '');
      return hl(s, q);
    }
    function search(q) {
      q = norm(q.trim());
      if (!q || !index) return [];
      var scored = [];
      index.forEach(function (e) {
        var ht = norm(e.htitle), score;
        if (ht.indexOf(q) === 0) score = 0;
        else if (ht.indexOf(q) > -1) score = 1;
        else if (e.hay.indexOf(q) > -1) score = 2;
        else return;
        scored.push({ e: e, s: score });
      });
      scored.sort(function (a, b) { return a.s - b.s || a.e.htitle.length - b.e.htitle.length; });
      return scored.slice(0, 10).map(function (x) { return x.e; });
    }

    function renderBuilding() {
      results.innerHTML = '<div class="sb-empty">Индексирую страницы…</div>';
      results.classList.add('open');
    }
    function render(q) {
      sel = -1;
      pendingQuery = q;
      if (!q.trim()) { results.classList.remove('open'); results.innerHTML = ''; return; }
      if (!index) { build(); renderBuilding(); return; }
      var qn = norm(q.trim());
      var list = search(q);
      if (!list.length) {
        results.innerHTML = '<div class="sb-empty">Ничего не найдено</div>';
      } else {
        results.innerHTML = list.map(function (e, i) {
          var sn = snippet(e.raw, qn);
          var sub = e.type === 'item' ? e.page : (e.page && norm(e.page) !== norm(e.htitle) ? e.page : '');
          return '<a class="sb-res" role="option" href="' + R + e.url + '" data-i="' + i + '">' +
            '<span class="r-ic">' + (e.ic || '') + '</span>' +
            '<span class="r-body">' +
              '<span class="r-t">' + hl(e.htitle, qn) + '</span>' +
              (sub ? '<span class="r-c">' + esc(sub) + '</span>' : '') +
              (sn ? '<span class="r-sn">' + sn + '</span>' : '') +
            '</span></a>';
        }).join('');
      }
      results.classList.add('open');
    }
    function move(d) {
      var rows = results.querySelectorAll('.sb-res');
      if (!rows.length) return;
      sel = (sel + d + rows.length) % rows.length;
      Array.prototype.forEach.call(rows, function (r, i) { r.classList.toggle('sel', i === sel); });
      rows[sel].scrollIntoView({ block: 'nearest' });
    }

    input.addEventListener('focus', function () { build(); if (input.value.trim()) render(input.value); });
    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') {
        var rows = results.querySelectorAll('.sb-res');
        var target = sel >= 0 ? rows[sel] : rows[0];
        if (target) { e.preventDefault(); location.href = target.getAttribute('href'); }
      } else if (e.key === 'Escape') { input.value = ''; render(''); input.blur(); }
    });
    results.addEventListener('click', function () { setTimeout(function () { results.classList.remove('open'); }, 0); });
    document.addEventListener('click', function (e) {
      if (!box.contains(e.target)) results.classList.remove('open');
    });
  })();

  // expose helpers
  window.SiteBase = R;
  window.SiteConnect = CONNECT;
})();
