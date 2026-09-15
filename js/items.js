/* ============================================================
   Рендер каталога предметов и детальных страниц.
   ============================================================ */
(function () {
  var R = window.SiteBase || '';
  var ICON = R + 'assets/items/';
  var ITEMS = window.ITEMS || [];
  var RARITY = window.RARITY || {};
  var CATS = window.CATS || {};
  var CATS_INFO = window.CATS_INFO || {};
  var SETS = window.SETS || {};
  var CAT_ORDER = ['set', 'weapon', 'amulet', 'consumable', 'material'];

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

  function grid(list) {
    var h = '<div class="itm-grid">';
    list.forEach(function (it) {
      h += '<a class="itm" href="item.html?id=' + it.id + '">' +
             '<span class="slot">' + iconCell(it) + '</span>' +
             '<span class="nm">' + it.name + '</span>' +
             '<span class="rar" style="color:' + rarColor(it.rarity) + '">' + rarName(it.rarity) +
               (it.power ? ' · Tier ' + it.power : '') + '</span>' +
           '</a>';
    });
    return h + '</div>';
  }

  /* ---------------- Каталог: хаб категорий (items.html) ---------------- */
  var hub = document.getElementById('catalog-hub');
  if (hub) {
    var h = '<div class="grid">';
    CAT_ORDER.forEach(function (k) {
      var count = ITEMS.filter(function (x) { return x.cat === k; }).length;
      if (!count) return;
      var info = CATS_INFO[k] || {};
      h += '<a class="card" href="' + (info.page || 'items.html') + '">' +
             '<span class="ic">' + CATS[k].split(' ')[0] + '</span>' +
             '<span class="h">' + CATS[k].replace(/^\S+\s/, '') + ' · ' + count + '</span>' +
             (info.blurb || '') +
           '</a>';
    });
    hub.innerHTML = h + '</div>';
  }

  /* ---------------- Каталог: одна категория (items-*.html) ---------------- */
  var cat = document.getElementById('catalog');
  if (cat) {
    var curCat = document.body.getAttribute('data-cat');
    var list = ITEMS.filter(function (x) { return x.cat === curCat; });
    var body = '';
    if (curCat === 'set') {
      // группировка по сетам
      Object.keys(SETS).forEach(function (sid) {
        var pieces = list.filter(function (x) { return x.set === sid; });
        if (!pieces.length) return;
        var s = SETS[sid];
        body += '<h2 style="color:' + rarColor(s.rarity) + ';margin-top:1.2em">' + s.name + '</h2>' +
                '<p style="margin-top:0">' + s.blurb + '</p>' + grid(pieces);
      });
    } else {
      body = grid(list);
    }
    cat.innerHTML = body;
  }

  /* ---------------- Детальная страница ---------------- */
  var det = document.getElementById('item-detail');
  if (det) {
    var id = new URLSearchParams(location.search).get('id');
    var it = byId(id);
    if (!it) { det.innerHTML = '<div class="panel">Предмет не найден. <a href="items.html">← В каталог</a></div>'; return; }

    document.title = it.name + ' — server вики';
    var crumb = document.querySelector('.crumbs');
    var catInfo = CATS_INFO[it.cat] || {};
    var catPage = catInfo.page || 'items.html';
    var catName = (CATS[it.cat] || '').replace(/^\S+\s/, '');

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
      '<p><a href="' + catPage + '">← ' + (catName || 'Каталог предметов') + '</a></p>' +
      '<div class="item-hero">' +
        '<span class="slot">' + iconCell(it, true) + '</span>' +
        '<div style="flex:1;min-width:240px">' +
          '<span class="tagline" style="color:' + rarColor(it.rarity) + ';border-color:' + rarColor(it.rarity) + '">' + rarName(it.rarity) + '</span>' +
          ' <span class="tagline">' + (CATS[it.cat] || '') + '</span>' +
          (it.power ? ' <span class="tagline">Power Tier ' + it.power + '</span>' : '') +
          '<h1 style="margin:.2em 0 0">' + it.name + '</h1>' +
          '<p style="margin-top:.4em">' + (it.desc || '') + '</p>' +
        '</div>' +
      '</div>' +
      (stats ? '<div class="tldr">' + stats + '</div>' : '') +
      '<h3>Игровое описание</h3>' +
      '<div class="lore">' + loreHtml(it.lore) + '</div>' +
      (it.how ? '<h3>Как получить</h3><p>' + it.how + '</p>' : '') +
      setBlock;

    if (crumb) crumb.innerHTML = '<a href="' + R + 'index.html">Вики</a> / <a href="items.html">Предметы</a> / <a href="' + catPage + '">' + catName + '</a> / ' + it.name;
  }

  /* ---------------- Страница рецептов ---------------- */
  var rec = document.getElementById('recipes');
  if (rec) {
    var RECIPES = window.RECIPES || [];
    var h = '';
    RECIPES.forEach(function (c) {
      h += '<h2' + (c.id ? ' id="' + c.id + '"' : '') + ' style="margin-top:1.4em">' + c.cat + '</h2>';
      if (c.intro) h += '<p>' + c.intro + '</p>';
      (c.subs || []).forEach(function (s) {
        if (s.set && SETS[s.set]) {
          var st = SETS[s.set];
          h += '<h3 style="color:' + rarColor(st.rarity) + '">' + st.name + '</h3>' +
               '<p style="margin-top:0;color:var(--ink-faint)">' + st.blurb + '</p>';
        }
        h += '<table><tr><th>Предмет</th><th>Ванильная база</th><th>Компоненты (у Инженера)</th></tr>';
        (s.rows || []).forEach(function (r) {
          var it = byId(r[0]);
          var name = it ? '<a href="item.html?id=' + it.id + '">' + it.name + '</a>' : r[0];
          if (r[3]) name += ' <span style="color:var(--ink-faint);font-size:.85em">(' + r[3] + ')</span>';
          h += '<tr><td>' + name + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>';
        });
        h += '</table>';
        if (s.note) h += '<p style="color:var(--ink-faint);font-size:.9em">' + s.note + '</p>';
      });
    });
    rec.innerHTML = h;
  }
})();
