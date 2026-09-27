/* ============================================================
   Каталог предметов, карточки, материалы и рецепты.
   Данные: window.ITEMS (ручные, js/items-data.js) + window.GEN
   (автогенерация из конфигов плагинов, js/items-gen.js).
   ============================================================ */
(function () {
  var R = window.SiteBase || '';
  var ICON = R + 'assets/items/';
  var ITEMS = window.ITEMS || [];
  var GEN = window.GEN || { items: {}, recipes: [], recycle: {}, sources: {}, vanilla: {}, bossNames: {} };
  var RARITY = window.RARITY || {};
  var CATS = window.CATS || {};
  var CATS_INFO = window.CATS_INFO || {};
  var SETS = window.SETS || {};
  var BRANCHES = window.BRANCHES || {};
  var SOURCES = window.SOURCES || {};
  var STAGE_NAMES = window.STAGE_NAMES || {};
  var CAT_ORDER = ['set', 'weapon', 'amulet', 'consumable', 'material'];
  var RAR_ORDER = ['legend', 'epic', 'rare', 'uncommon', 'common'];

  var BY_ID = {};
  ITEMS.forEach(function (it) { BY_ID[it.id] = it; });

  // ── Индексы рецептов: что из чего собирается и где что используется ──────
  var RECIPE_OF = {};   // id результата → рецепт
  var USED_IN = {};     // id кастомного предмета или MATERIAL → [{r, role, n}]
  (GEN.recipes || []).forEach(function (r) {
    RECIPE_OF[r.result] = r;
    [{ ref: r.base, role: 'base' }].concat(r.parts.map(function (p) { return { ref: p, role: 'part' }; }))
      .forEach(function (x) {
        var key = x.ref.i || x.ref.m;
        (USED_IN[key] = USED_IN[key] || []).push({ r: r, role: x.role, n: x.ref.n });
      });
  });

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function rarColor(r) { return (RARITY[r] && RARITY[r].c) || 'var(--ink)'; }
  function rarName(r) { return (RARITY[r] && RARITY[r].t) || ''; }
  function byId(id) { return BY_ID[id] || BY_ID[(window.ID_ALIASES || {})[id]] || null; }
  function norm(s) { return (s || '').toLowerCase().replace(/ё/g, 'е'); }
  function itemUrl(id) { return 'item.html?id=' + encodeURIComponent(id); }
  function vanName(m) { return (GEN.vanilla && GEN.vanilla[m]) || m; }
  function refName(ref) { var it = ref.i && byId(ref.i); return it ? it.name : (ref.i || vanName(ref.m)); }
  function secs(s) { return s >= 60 && s % 60 === 0 ? (s / 60) + ' мин' : (s % 1 ? s.toFixed(1) : s) + ' с'; }

  // &-коды Minecraft → html
  function mc(line) {
    var out = '', cls = '', bold = false;
    for (var i = 0; i < line.length; i++) {
      if (line[i] === '&' && i + 1 < line.length) {
        var code = line[++i].toLowerCase();
        if (code === 'l') { bold = true; continue; }
        if (code === 'r') { cls = ''; bold = false; continue; }
        if (/[0-9a-f]/.test(code)) { cls = 'c' + code; bold = false; continue; }
        continue;
      }
      var ch = line[i] === '\t' ? '&#9;' : esc(line[i]);
      out += '<span class="' + cls + '"' + (bold ? ' style="font-weight:bold"' : '') + '>' + ch + '</span>';
    }
    return out || '&nbsp;';
  }
  function loreHtml(lore) { return (lore || []).map(mc).join('\n'); }

  function iconCell(it) {
    if (it && it.icon) return '<img src="' + ICON + it.icon + '" alt="" loading="lazy">';
    return '<span class="ph" style="color:' + rarColor(it && it.rarity) + '">' + ((it && it.sym) || '▪') + '</span>';
  }

  // Ингредиент: кастомный — ссылка с иконкой, ванильный — плашка с названием.
  function ingChip(ref, opts) {
    opts = opts || {};
    var n = ref.n > 1 || opts.showOne ? '<b>×' + ref.n + '</b>' : '';
    if (ref.i) {
      var it = byId(ref.i);
      return '<a class="ing" href="' + itemUrl(ref.i) + '" title="' + esc(refName(ref)) + '">' +
        '<span class="slot sm">' + iconCell(it) + '</span><span class="ing-t">' + esc(refName(ref)) + '</span>' + n + '</a>';
    }
    return '<a class="ing van" href="recipes.html?ing=' + ref.m + '" title="Ванильный предмет — все рецепты с ним">' +
      '<span class="slot sm"><span class="ph">▫</span></span><span class="ing-t">' + esc(vanName(ref.m)) + '</span>' + n + '</a>';
  }

  function recipeRow(r, highlight) {
    var res = byId(r.result);
    var parts = r.parts.map(function (p) { return ingChip(p); }).join('<span class="plus">+</span>');
    var baseIt = r.base.i && byId(r.base.i);
    var isUpgrade = !!baseIt && (baseIt.cat === 'set' || baseIt.cat === 'weapon');
    return '<div class="recipe' + (highlight ? ' hl' : '') + '">' +
      '<div class="r-in">' +
        '<span class="r-lbl">' + (isUpgrade ? 'улучшаемый предмет' : 'база') + '</span>' + ingChip(r.base) +
      '</div>' +
      '<span class="plus">+</span>' +
      '<div class="r-parts">' + (parts || '<span class="ing-t" style="opacity:.6">—</span>') + '</div>' +
      '<span class="arrow">➜</span>' +
      '<div class="r-out">' + ingChip({ i: r.result, n: 1 }) + '</div>' +
    '</div>';
  }

  // Сумма ресурсов на все части сета (без улучшений вроде Абсолютной короны):
  // сначала боссовые материалы, затем ванильные компоненты, в конце базовая броня.
  function setTotals(setId) {
    var tot = {}, order = [];
    function add(p, group) {
      var k = p.i || p.m;
      if (!(k in tot)) { tot[k] = { g: group, ref: { i: p.i, m: p.m, n: 0 } }; order.push(k); }
      tot[k].ref.n += p.n;
    }
    ITEMS.forEach(function (it) {
      if (it.set !== setId) return;
      var r = RECIPE_OF[it.id];
      if (!r || r.base.i) return;
      r.parts.forEach(function (p) { add(p, p.i ? 0 : 1); });
      add(r.base, 2);
    });
    return order.sort(function (a, b) { return tot[a].g - tot[b].g; }).map(function (k) { return tot[k].ref; });
  }

  function sourcesHtml(id) {
    var s = GEN.sources && GEN.sources[id];
    if (!s) return '';
    var rows = [];
    ['bosses', 'squads', 'airdrop', 'outpost', 'contract'].forEach(function (k) {
      if (!(k in s)) return;
      var src = SOURCES[k] || { t: k };
      var detail = '';
      if (k === 'bosses') {
        detail = s.bosses.map(function (b) {
          var name = GEN.bossNames[b.boss] || b.boss;
          var pct = function (v) { return v >= 1 ? 'всегда' : Math.round(v * 100) + '%'; };
          return name + ': топ-3 — ' + pct(b.top) + (b.all ? ', остальным — ' + pct(b.all) : '');
        }).join('; ');
      } else if (k === 'squads') {
        detail = 'отряд: ' + s.squads.map(function (b) { return GEN.bossNames[b] || b; }).join(', ');
      } else {
        var st = GEN.stages[s[k]];
        detail = 'с этапа «' + (STAGE_NAMES[st] || st) + '»';
      }
      rows.push('<li><a href="' + src.page + '">' + src.t + '</a> <span class="sub">— ' + detail + '</span></li>');
    });
    return rows.length ? '<ul class="clean src-list">' + rows.join('') + '</ul>' : '';
  }

  function usedInHtml(key) {
    var uses = USED_IN[key];
    if (!uses || !uses.length) return '';
    return '<div class="used-in">' + uses.map(function (u) {
      var res = byId(u.r.result);
      return '<a class="use" href="' + itemUrl(u.r.result) + '">' +
        '<span class="slot sm">' + iconCell(res) + '</span>' +
        '<span class="ing-t">' + esc(res ? res.name : u.r.result) + '</span>' +
        '<b>×' + u.n + '</b>' + (u.role === 'base' ? '<i>база</i>' : '') + '</a>';
    }).join('') + '</div>';
  }

  function badges(it) {
    var b = [];
    if (RECIPE_OF[it.id]) b.push('<span class="bdg">крафт</span>');
    if (GEN.sources[it.id] && (GEN.sources[it.id].bosses || GEN.sources[it.id].squads)) b.push('<span class="bdg">боссы</span>');
    if (USED_IN[it.id]) b.push('<span class="bdg alt">компонент</span>');
    return b.join('');
  }

  function card(it) {
    return '<a class="itm" href="' + itemUrl(it.id) + '" data-id="' + it.id + '">' +
      '<span class="slot">' + iconCell(it) + '</span>' +
      '<span class="nm">' + esc(it.name) + '</span>' +
      '<span class="rar" style="color:' + rarColor(it.rarity) + '">' + rarName(it.rarity) +
        (it.power ? ' · Tier ' + it.power : '') + '</span>' +
      '<span class="bdgs">' + badges(it) + '</span>' +
    '</a>';
  }
  function grid(list) { return '<div class="itm-grid">' + list.map(card).join('') + '</div>'; }

  function setBonusTable(sid) {
    var s = SETS[sid];
    if (!s || !s.bonus) return '';
    return '<table class="bonus"><tr><th>Надето</th><th>Бонус</th></tr>' +
      s.bonus.map(function (b) { return '<tr><td>' + b[0] + '</td><td>' + b[1] + '</td></tr>'; }).join('') +
      '</table>' + (s.note ? '<p class="sub">' + s.note + '</p>' : '');
  }
  function setTotalsHtml(sid) {
    var tot = setTotals(sid);
    if (!tot.length) return '';
    return '<div class="totals"><span class="r-lbl">Весь сет у Инженера:</span>' +
      tot.map(function (p) { return ingChip(p, { showOne: true }); }).join('') + '</div>';
  }

  /* ---------------- Каталог с поиском и фильтрами (items.html) ---------------- */
  var app = document.getElementById('catalog-app');
  if (app) {
    var state = { q: '', cat: '', branch: '', craft: false };
    try { var saved = JSON.parse(sessionStorage.getItem('catalogState') || 'null'); if (saved) state = saved; } catch (e) {}

    var chips = function (group, list, cur) {
      return list.map(function (x) {
        return '<button type="button" class="chip' + (cur === x[0] ? ' active' : '') + '" data-' + group + '="' + x[0] + '">' + x[1] + '</button>';
      }).join('');
    };
    app.innerHTML =
      '<div class="toolbar">' +
        '<input type="search" class="tb-input" placeholder="Найти предмет, эффект или материал…" value="' + esc(state.q) + '" aria-label="Поиск по предметам">' +
        '<div class="filters" data-g="cat">' + chips('cat', [['', 'Все']].concat(CAT_ORDER.map(function (k) { return [k, CATS[k]]; })), state.cat) + '</div>' +
        '<div class="filters" data-g="branch">' + chips('branch', [['', 'Любая ветка']].concat(Object.keys(BRANCHES).map(function (k) { return [k, BRANCHES[k].t]; })), state.branch) +
          '<label class="tb-check"><input type="checkbox"' + (state.craft ? ' checked' : '') + '> только крафтящиеся</label></div>' +
      '</div>' +
      '<div class="tb-count"></div><div class="tb-results"></div>';

    var input = app.querySelector('.tb-input');
    var results = app.querySelector('.tb-results');
    var count = app.querySelector('.tb-count');
    var hay = {};
    ITEMS.forEach(function (it) {
      var r = RECIPE_OF[it.id];
      var ing = r ? [r.base].concat(r.parts).map(refName).join(' ') : '';
      hay[it.id] = norm([it.name, it.desc, (it.stats || []).map(function (s) { return s.join(' '); }).join(' '),
        (it.lore || []).join(' ').replace(/&[0-9a-fk-or]/gi, ''), ing, CATS[it.cat],
        it.set && SETS[it.set] ? SETS[it.set].name : ''].join(' '));
    });

    var render = function () {
      try { sessionStorage.setItem('catalogState', JSON.stringify(state)); } catch (e) {}
      var q = norm(state.q.trim());
      var list = ITEMS.filter(function (it) {
        if (state.cat && it.cat !== state.cat) return false;
        if (state.branch && (it.branch || 'neutral') !== state.branch) return false;
        if (state.craft && !RECIPE_OF[it.id]) return false;
        return !q || hay[it.id].indexOf(q) > -1;
      });
      count.textContent = list.length ? 'Найдено: ' + list.length : '';
      if (!list.length) { results.innerHTML = '<div class="panel">Ничего не найдено. Сбросьте фильтры или измените запрос.</div>'; return; }
      var h = '';
      CAT_ORDER.forEach(function (k) {
        var part = list.filter(function (x) { return x.cat === k; });
        if (!part.length) return;
        h += '<h2 class="cat-h"><a href="' + (CATS_INFO[k] || {}).page + '">' + CATS[k] + '</a> <span class="sub">' + part.length + '</span></h2>' + grid(part);
      });
      results.innerHTML = h;
    };
    input.addEventListener('input', function () { state.q = input.value; render(); });
    app.addEventListener('click', function (e) {
      var b = e.target.closest('button.chip');
      if (!b) return;
      var g = b.parentNode.getAttribute('data-g');
      state[g] = b.getAttribute('data-' + g);
      Array.prototype.forEach.call(b.parentNode.querySelectorAll('button.chip'), function (x) { x.classList.toggle('active', x === b); });
      render();
    });
    app.querySelector('.tb-check input').addEventListener('change', function (e) { state.craft = e.target.checked; render(); });
    render();
  }

  /* ---------------- Одна категория (items-*.html) ---------------- */
  var cat = document.getElementById('catalog');
  if (cat) {
    var curCat = document.body.getAttribute('data-cat');
    var list = ITEMS.filter(function (x) { return x.cat === curCat; });
    var body = '';
    if (curCat === 'set') {
      Object.keys(SETS).forEach(function (sid) {
        var pieces = list.filter(function (x) { return x.set === sid; });
        if (!pieces.length) return;
        var s = SETS[sid];
        body += '<h2 style="color:' + rarColor(s.rarity) + '">' + s.name + '</h2>' +
                '<p>' + s.blurb + '</p>' + grid(pieces) + setBonusTable(sid) + setTotalsHtml(sid);
      });
    } else if (curCat === 'material') {
      var mats = list.filter(function (x) { return !/^seal_/.test(x.id); });
      var seals = list.filter(function (x) { return /^seal_/.test(x.id); });
      body = grid(mats) +
        '<h2>Для каких крафтов нужен материал</h2>' +
        '<p>Каждая строка — материал и все предметы, которые из него собираются у Инженера (с количеством на одну штуку).</p>' +
        '<table class="mat-table"><tr><th>Материал</th><th>Где добыть</th><th>Нужен для</th></tr>' +
        mats.map(function (it) {
          return '<tr><td><a class="ing" href="' + itemUrl(it.id) + '"><span class="slot sm">' + iconCell(it) + '</span><span class="ing-t">' + esc(it.name) + '</span></a></td>' +
            '<td>' + (sourcesHtml(it.id) || (RECIPE_OF[it.id] ? 'крафт у Инженера' : '—')) + '</td>' +
            '<td>' + (usedInHtml(it.id) || '<span class="sub">сам по себе (не компонент)</span>') + '</td></tr>';
        }).join('') + '</table>' +
        '<h2>Ванильные ресурсы для крафтов</h2>' +
        '<p>Обычные материалы и снаряжение, которые Инженер берёт как базу или компонент.</p>' +
        '<table class="mat-table"><tr><th>Ресурс</th><th>Нужен для</th></tr>' +
        Object.keys(USED_IN).filter(function (k) { return k === k.toUpperCase(); })
          .sort(function (a, b) { return vanName(a).localeCompare(vanName(b), 'ru'); })
          .map(function (m) {
            return '<tr><td>' + ingChip({ m: m, n: 1 }) + '</td><td>' + usedInHtml(m) + '</td></tr>';
          }).join('') + '</table>' +
        '<h2>Печати призыва боссов</h2>' + grid(seals);
    } else {
      body = grid(list);
    }
    cat.innerHTML = body;
  }

  /* ---------------- Карточка предмета (item.html) ---------------- */
  var det = document.getElementById('item-detail');
  if (det) {
    var qid = new URLSearchParams(location.search).get('id');
    var it = byId(qid);
    if (!it) { det.innerHTML = '<div class="panel">Предмет не найден. <a href="items.html">← В каталог</a></div>'; return; }

    document.title = it.name + ' — server вики';
    var crumb = document.querySelector('.crumbs');
    var catInfo = CATS_INFO[it.cat] || {};
    var catPage = catInfo.page || 'items.html';
    var catName = (CATS[it.cat] || '').replace(/^\S+\s/, '');
    var br = BRANCHES[it.branch || 'neutral'];

    var stats = [];
    if (it.uses) stats.push(['Заряды', it.uses]);
    if (it.cd) stats.push(['Откат', secs(it.cd)]);
    stats = stats.concat(it.stats || []);
    var statsHtml = stats.map(function (kv) { return '<div class="kv"><b>' + kv[0] + '</b>' + kv[1] + '</div>'; }).join('');

    var recipe = RECIPE_OF[it.id];
    var recipeHtml = recipe
      ? '<h3>Крафт у Инженера</h3>' + recipeRow(recipe) +
        (recipe.base.i && byId(recipe.base.i) && /^(set|weapon)$/.test(byId(recipe.base.i).cat)
          ? '<p class="sub">Улучшение: зачарования базового предмета переносятся на результат.</p>' : '')
      : '';
    var usedHtml = usedInHtml(it.id);
    var srcHtml = sourcesHtml(it.id);
    var rec = GEN.recycle && GEN.recycle[it.id];

    var setBlock = '';
    if (it.set && SETS[it.set]) {
      var s = SETS[it.set];
      var pieces = ITEMS.filter(function (x) { return x.set === it.set; });
      setBlock = '<h3>Сет: ' + s.name + '</h3><p>' + s.blurb + '</p>' + setBonusTable(it.set) +
        '<div class="itm-grid">' + pieces.map(function (p) {
          var act = p.id === it.id ? ' style="border-color:' + rarColor(p.rarity) + '"' : '';
          return '<a class="itm" href="' + itemUrl(p.id) + '"' + act + '><span class="slot">' + iconCell(p) +
                 '</span><span class="nm">' + esc(p.name) + '</span></a>';
        }).join('') + '</div>' + setTotalsHtml(it.set);
    }

    det.innerHTML =
      '<p><a href="' + catPage + '">← ' + (catName || 'Каталог предметов') + '</a></p>' +
      '<div class="item-hero">' +
        '<span class="slot">' + iconCell(it) + '</span>' +
        '<div style="flex:1;min-width:240px">' +
          '<span class="tagline" style="color:' + rarColor(it.rarity) + ';border-color:' + rarColor(it.rarity) + '">' + rarName(it.rarity) + '</span>' +
          ' <span class="tagline">' + (CATS[it.cat] || '') + '</span>' +
          (br && it.branch && it.branch !== 'neutral' ? ' <span class="tagline" style="color:' + br.c + '">Ветка: ' + br.t + '</span>' : '') +
          (it.power ? ' <span class="tagline">Power Tier ' + it.power + '</span>' : '') +
          '<h1 style="margin:.2em 0 0">' + esc(it.name) + '</h1>' +
          '<p style="margin-top:.4em">' + (it.desc || '') + '</p>' +
        '</div>' +
      '</div>' +
      (statsHtml ? '<div class="tldr">' + statsHtml + '</div>' : '') +
      recipeHtml +
      (usedHtml ? '<h3>Используется в крафтах</h3>' + usedHtml : '') +
      ((srcHtml || it.how) ? '<h3>Где добыть</h3>' + (srcHtml || '') + (it.how ? '<p>' + it.how + '</p>' : '') : '') +
      (rec ? '<h3>Утилизация</h3><p>В Утилизаторе даёт ' + ingChip(rec, { showOne: true }) + '</p>' : '') +
      '<h3>Игровое описание</h3>' +
      '<div class="lore">' + loreHtml(it.lore) + '</div>' +
      setBlock;

    if (crumb) crumb.innerHTML = '<a href="' + R + 'index.html">Вики</a> / <a href="items.html">Предметы</a> / <a href="' + catPage + '">' + catName + '</a> / ' + esc(it.name);
  }

  /* ---------------- Добыча с боссов (bosses.html) ---------------- */
  var bossEl = document.getElementById('boss-loot');
  if (bossEl) {
    var pct = function (v) { return !v ? '—' : v >= 1 ? 'всегда' : Math.round(v * 100) + '%'; };
    bossEl.innerHTML = Object.keys(GEN.bossNames || {}).map(function (boss) {
      var rows = [];
      Object.keys(GEN.sources || {}).forEach(function (id) {
        (GEN.sources[id].bosses || []).forEach(function (b) {
          if (b.boss === boss) rows.push({ id: id, top: b.top, all: b.all });
        });
      });
      rows.sort(function (a, b) { return b.top - a.top || b.all - a.all; });
      return '<h3>' + GEN.bossNames[boss] + '</h3><table class="mat-table"><tr><th>Предмет</th><th>Топ-3</th><th>Остальным</th></tr>' +
        rows.map(function (r) {
          return '<tr><td>' + ingChip({ i: r.id, n: 1 }) + '</td><td>' + pct(r.top) + '</td><td>' + pct(r.all) + '</td></tr>';
        }).join('') + '</table>';
    }).join('') + '<p class="sub">Амулет выпадает один случайный из пяти — шанс в таблице указан на каждый конкретный.</p>';
  }

  /* ---------------- Рецепты (recipes.html) ---------------- */
  var recEl = document.getElementById('recipes');
  if (recEl) {
    var ingParam = new URLSearchParams(location.search).get('ing') || '';
    recEl.innerHTML =
      '<div class="toolbar">' +
        '<input type="search" class="tb-input" placeholder="Предмет или ингредиент: «алмаз», «эссенция души»…" aria-label="Поиск по рецептам">' +
        '<div class="tb-count"></div>' +
      '</div><div class="rec-body"></div>';
    var rInput = recEl.querySelector('.tb-input');
    var rBody = recEl.querySelector('.rec-body');
    var rCount = recEl.querySelector('.tb-count');
    if (ingParam) rInput.value = refName(ingParam === ingParam.toUpperCase() ? { m: ingParam } : { i: ingParam });

    var recHay = function (r) {
      return norm([refName({ i: r.result })].concat([r.base].concat(r.parts).map(refName)).join(' '));
    };
    var groups = CAT_ORDER.map(function (k) {
      return { k: k, list: (GEN.recipes || []).filter(function (r) { var x = byId(r.result); return x && x.cat === k; }) };
    });

    var renderRec = function () {
      var q = norm(rInput.value.trim());
      var total = 0, h = '';
      groups.forEach(function (g) {
        var list = g.list.filter(function (r) { return !q || recHay(r).indexOf(q) > -1; });
        if (!list.length) return;
        total += list.length;
        h += '<h2' + (g.k === 'material' ? ' id="seals"' : '') + '>' + CATS[g.k] + '</h2>';
        if (g.k === 'set') {
          Object.keys(SETS).forEach(function (sid) {
            var part = list.filter(function (r) { return byId(r.result).set === sid; });
            if (!part.length) return;
            h += '<h3 style="color:' + rarColor(SETS[sid].rarity) + '">' + SETS[sid].name + '</h3>' +
                 part.map(function (r) { return recipeRow(r); }).join('') + (q ? '' : setTotalsHtml(sid));
          });
        } else {
          h += list.map(function (r) { return recipeRow(r); }).join('');
        }
      });
      rCount.textContent = q ? 'Рецептов: ' + total : 'Всего рецептов: ' + total;
      rBody.innerHTML = h || '<div class="panel">Нет рецептов с таким предметом или ингредиентом.</div>';
    };
    rInput.addEventListener('input', renderRec);
    renderRec();
  }
})();
