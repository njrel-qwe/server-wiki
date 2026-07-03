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
      { id: 'world',       ic: '◴', t: 'Мир и исследование', h: 'pages/world.html' },
      { id: 'stages',      ic: '◔', t: 'Стадии развития',    h: 'pages/stages.html' },
      { id: 'peaceful',    ic: '☮', t: 'Мирные игроки',      h: 'pages/peaceful.html' },
      { id: 'city',        ic: '⌂', t: 'Город',              h: 'pages/city.html' },
      { id: 'court',       ic: '§', t: 'Суд',                h: 'pages/court.html' },
      { id: 'economy',     ic: '⚖', t: 'Экономика',          h: 'pages/economy.html' },
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
      { id: 'progression', ic: '⚒', t: 'Прогрессия',         h: 'pages/progression.html' },
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
  var navHtml = '';
  NAV.forEach(function (g) {
    navHtml += '<div class="nav-group"><div class="nav-title">' + g.title + '</div>';
    g.links.forEach(function (l) {
      navHtml += '<a class="nav-link' + (l.id === page ? ' active' : '') + '" href="' + abs(l.h) + '">' +
        '<span class="ic">' + l.ic + '</span><span>' + l.t + '</span></a>';
    });
    navHtml += '</div>';
  });

  var sidebar = el(
    '<aside class="sidebar">' +
      '<a class="brand" href="' + abs('index.html') + '" style="text-decoration:none">' +
        '<span class="logo">S</span>' +
        '<span class="name">server<small>вики сервера</small></span>' +
      '</a>' + navHtml +
    '</aside>'
  );

  // ---- Topbar ----
  var topbar = el(
    '<div class="topbar">' +
      '<button class="menu-btn" aria-label="Меню">☰</button>' +
      '<div class="crumbs"><a href="' + abs('index.html') + '">Вики</a> / ' + pageTitle + '</div>' +
      '<div class="spacer"></div>' +
      '<a class="connect-pill" href="' + CONNECT.discord + '" target="_blank" rel="noopener" title="Discord-сервер">✦ Discord</a>' +
      '<span class="connect-pill" title="IP сервера (плейсхолдер)">▶ ' + CONNECT.ip + '</span>' +
    '</div>'
  );

  var foot = el(
    '<footer class="foot">' +
      'Вики сервера «server» · контент описывает игровые механики · ' +
      '<a href="' + CONNECT.discord + '" target="_blank" rel="noopener">Discord</a> · ' +
      'IP — плейсхолдер, замените в <code>js/site.js</code><br>' +
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

  // Скриншоты: помечаем загруженные, иначе остаётся рамка-заглушка
  Array.prototype.forEach.call(document.querySelectorAll('.shot img'), function (img) {
    function ok() { if (img.naturalWidth > 1) img.classList.add('loaded'); }
    if (img.complete) ok(); else { img.addEventListener('load', ok); img.addEventListener('error', function () {}); }
  });

  // expose helpers
  window.SiteBase = R;
  window.SiteConnect = CONNECT;
})();
