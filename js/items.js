/* ============================================================
   Рендер каталога предметов и детальных страниц.
   ============================================================ */
(function () {
  var R = window.SiteBase || '';
  var ICON = R + 'assets/items/';
  var ITEMS = window.ITEMS || [];
  var RARITY = window.RARITY || {};
  var CATS = window.CATS || {};
  var SETS = window.SETS || {};

  function rarColor(r) { return (RARITY[r] && RARITY[r].c) || 'var(--ink)'; }
  function rarName(r) { return (RARITY[r] && RARITY[r].t) || ''; }
  function byId(id) { for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) return ITEMS[i]; return null; }

  // &-коды Minecraft → html
  function mc(line) {
    var out = '', cls = '', bold = false;
    for (var i = 0; i < line.length; i++) {
      if (line[i] === '&' && i + 1 < line.length) {
        var code = line[++i].toLowerCase();
        if (code === 'l') { bold = true; continue; }
        if (code === 'r') { cls = ''; bold = false; continue; }
        if (/[0-9a-f]/.test(code)) { cls = 'c' + code; continue; }
        continue;
      }
      var ch = line[i] === '\t' ? '&#9;' : (line[i] === '<' ? '&lt;' : (line[i] === '>' ? '&gt;' : line[i]));
      out += '<span class="' + cls + '"' + (bold ? ' style="font-weight:bold"' : '') + '>' + ch + '</span>';
    }
    return out || '&nbsp;';
  }
  function loreHtml(lore) { return (lore || []).map(mc).join('\n'); }

  function iconCell(it, big) {
    if (it.icon) return '<img src="' + ICON + it.icon + '" alt="">';
    return '<span class="ph" style="color:' + rarColor(it.rarity) + '">' + (it.sym || '?') + '</span>';
  }

  /* ---------------- Каталог ---------------- */
  var cat = document.getElementById('catalog');
  if (cat) {
    var order = ['set', 'weapon', 'amulet', 'consumable', 'material'];

    var filters = '<div class="filters"><span class="chip active" data-f="all">Все</span>';
    order.forEach(function (k) { filters += '<span class="chip" data-f="' + k + '">' + CATS[k] + '</span>'; });
    filters += '</div>';

    var body = '';
    order.forEach(function (k) {
      var list = ITEMS.filter(function (x) { return x.cat === k; });
      if (!list.length) return;
      body += '<div class="cat-block" data-cat="' + k + '"><h2 style="margin-top:1.2em">' + CATS[k] + '</h2>';
      if (k === 'set') {
        // группировка по сетам
        Object.keys(SETS).forEach(function (sid) {
          var pieces = list.filter(function (x) { return x.set === sid; });
          if (!pieces.length) return;
          var s = SETS[sid];
          body += '<h3 style="color:' + rarColor(s.rarity) + '">' + s.name + '</h3>' +
                  '<p style="margin-top:0">' + s.blurb + '</p>' + grid(pieces);
        });
      } else {
        body += grid(list);
      }
      body += '</div>';
    });

    cat.innerHTML = filters + body;

    function grid(list) {
      var h = '<div class="itm-grid">';
      list.forEach(function (it) {
        h += '<a class="itm" href="item.html?id=' + it.id + '">' +
               '<span class="slot">' + iconCell(it) + '</span>' +
               '<span class="nm">' + it.name + '</span>' +
               '<span class="rar" style="color:' + rarColor(it.rarity) + '">' + rarName(it.rarity) + '</span>' +
             '</a>';
      });
      return h + '</div>';
    }

    cat.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        cat.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        var f = chip.getAttribute('data-f');
        cat.querySelectorAll('.cat-block').forEach(function (b) {
          b.style.display = (f === 'all' || b.getAttribute('data-cat') === f) ? '' : 'none';
        });
      });
    });
  }

  /* ---------------- Детальная страница ---------------- */
  var det = document.getElementById('item-detail');
  if (det) {
    var id = new URLSearchParams(location.search).get('id');
    var it = byId(id);
    if (!it) { det.innerHTML = '<div class="panel">Предмет не найден. <a href="items.html">← В каталог</a></div>'; return; }

    document.title = it.name + ' — server вики';
    var crumb = document.querySelector('.crumbs');

    var stats = (it.stats || []).map(function (kv) {
      return '<div class="kv"><b>' + kv[0] + '</b>' + kv[1] + '</div>';
    }).join('');

    var setBlock = '';
    if (it.set && SETS[it.set]) {
      var s = SETS[it.set];
      var pieces = ITEMS.filter(function (x) { return x.set === it.set; });
      setBlock = '<h3>Сет: ' + s.name + '</h3><p>' + s.blurb + '</p>' +
        '<p style="color:var(--ink-faint)">Сет-бонусы растут с числом надетых частей (2 / 3 / 4). Полный комплект открывает фирменную способность.</p>' +
        '<div class="itm-grid">' + pieces.map(function (p) {
          var act = p.id === it.id ? ' style="border-color:' + rarColor(p.rarity) + '"' : '';
          return '<a class="itm" href="item.html?id=' + p.id + '"' + act + '><span class="slot">' + iconCell(p) +
                 '</span><span class="nm">' + p.name + '</span></a>';
        }).join('') + '</div>';
    }

    det.innerHTML =
      '<p><a href="items.html">← Каталог предметов</a></p>' +
      '<div class="item-hero">' +
        '<span class="slot">' + iconCell(it, true) + '</span>' +
        '<div style="flex:1;min-width:240px">' +
          '<span class="tagline" style="color:' + rarColor(it.rarity) + ';border-color:' + rarColor(it.rarity) + '">' + rarName(it.rarity) + '</span>' +
          ' <span class="tagline">' + (CATS[it.cat] || '') + '</span>' +
          '<h1 style="margin:.2em 0 0">' + it.name + '</h1>' +
          '<p style="margin-top:.4em">' + (it.desc || '') + '</p>' +
        '</div>' +
      '</div>' +
      (stats ? '<div class="tldr">' + stats + '</div>' : '') +
      '<h3>Игровое описание</h3>' +
      '<div class="lore">' + loreHtml(it.lore) + '</div>' +
      (it.how ? '<h3>Как получить</h3><p>' + it.how + '</p>' : '') +
      setBlock;

    if (crumb) crumb.innerHTML = '<a href="' + R + 'index.html">Вики</a> / <a href="items.html">Предметы</a> / ' + it.name;
  }
})();
