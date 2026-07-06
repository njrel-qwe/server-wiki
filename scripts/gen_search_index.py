# -*- coding: utf-8 -*-
"""Генерирует js/search-index.js — статический индекс СЕКЦИЙ страниц вики.
Повторяет slugify() и обход заголовков из site.js, чтобы якоря совпадали.
Предметы в файл НЕ кладём — они добавляются в рантайме из window.ITEMS."""
import re, json, os
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # scripts/.. = корень сайта

# id страницы -> (иконка навигации, root-relative href). Порядок = как в NAV site.js
PAGES = [
    ("⌂", "index.html"),
    ("✦", "pages/philosophy.html"),
    ("➤", "pages/start.html"),
    ("⊕", "pages/world.html"),
    ("▲", "pages/stages.html"),
    ("☮", "pages/peaceful.html"),
    ("⛫", "pages/city.html"),
    ("⚖", "pages/court.html"),
    ("⇄", "pages/economy.html"),
    ("⚑", "pages/factions.html"),
    ("⬢", "pages/core.html"),
    ("⚔", "pages/war.html"),
    ("⚐", "pages/outposts.html"),
    ("✎", "pages/contracts.html"),
    ("✈", "pages/airdrops.html"),
    ("☠", "pages/bosses.html"),
    ("↗", "pages/progression.html"),
    ("◆", "pages/items.html"),
    ("⚒", "pages/recipes.html"),
    ("◉", "pages/fairplay.html"),
    ("§", "pages/rules.html"),
    ("?", "pages/qa.html"),
]

def slugify(s):
    s = (s or "").lower().replace("ё", "е")  # ё -> е
    s = re.sub(r"[^0-9a-zа-я]+", "-", s)
    s = s.strip("-")
    return s or "section"

def norm(s):
    return (s or "").lower().replace("ё", "е")

def collapse(s):
    return re.sub(r"\s+", " ", s or "").strip()

class ContentParser(HTMLParser):
    def __init__(self, page_title):
        super().__init__(convert_charrefs=True)
        self.page_title = page_title
        self.sections = []
        self.cur = None
        self.used = {}
        self.in_head = 0        # глубина вложенности заголовка
        self.head_text = ""

    def push(self):
        if self.cur and (self.cur["body"] or self.cur["t"]):
            self.sections.append(self.cur)

    def handle_starttag(self, tag, attrs):
        if re.match(r"h[1-4]$", tag):
            if self.in_head == 0:
                self.head_text = ""
            self.in_head += 1

    def handle_endtag(self, tag):
        if re.match(r"h[1-4]$", tag) and self.in_head > 0:
            self.in_head -= 1
            if self.in_head == 0:
                self.push()
                t = collapse(self.head_text)
                base = slugify(t)
                sid = base
                n = 2
                while sid in self.used:
                    sid = base + "-" + str(n)
                    n += 1
                self.used[sid] = 1
                self.cur = {"t": t, "id": sid, "body": ""}

    def handle_data(self, data):
        if self.in_head > 0:
            self.head_text += data
        else:
            if data.strip():
                if self.cur is None:
                    self.cur = {"t": self.page_title, "id": "", "body": ""}
                self.cur["body"] += data

def build_page(icon, href):
    path = os.path.join(ROOT, href.replace("/", os.sep))
    with open(path, encoding="utf-8") as f:
        text = f.read()
    m = re.search(r'data-title="([^"]*)"', text)
    page_title = m.group(1) if m else href
    cm = re.search(r'<main class="content">(.*?)</main>', text, re.S)
    if not cm:
        return []
    inner = cm.group(1)
    p = ContentParser(page_title)
    p.feed(inner)
    p.push()
    out = []
    for s in p.sections:
        t = s["t"]
        body = collapse(s["body"])
        url = href + ("#" + s["id"] if s["id"] else "")
        out.append({
            "type": "section", "ic": icon, "htitle": t, "page": page_title,
            "url": url, "hay": norm(t + " " + body), "raw": body,
        })
    return out

index = []
for icon, href in PAGES:
    index.extend(build_page(icon, href))

payload = json.dumps(index, ensure_ascii=False, separators=(",", ":"))
out_path = os.path.join(ROOT, "js", "search-index.js")
with open(out_path, "w", encoding="utf-8") as f:
    f.write("/* АВТОГЕНЕРАЦИЯ (scripts/gen_search_index) — не редактировать вручную.\n")
    f.write("   Полнотекстовый индекс СЕКЦИЙ страниц для поиска. Предметы добавляются в рантайме. */\n")
    f.write("window.SEARCH_INDEX = " + payload + ";\n")

print("sections:", len(index))
print("bytes:", os.path.getsize(out_path))
# показать пример по core
for e in index:
    if "содержание ядра" in e["hay"][:40]:
        print("SAMPLE:", e["htitle"], "->", e["url"])
