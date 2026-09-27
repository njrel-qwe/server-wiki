# -*- coding: utf-8 -*-
"""Генерирует js/items-gen.js из настоящих конфигов плагинов.

Источники (пути относительно монорепозитория, папка сайта лежит рядом с плагинами):
  CustomItems/src/main/resources/config.yml         — предметы, рецепты Инженера, утилизатор
  CustomItems/src/main/resources/items/*.yml        — предметы из отдельных файлов
  ServerCore/src/main/resources/loot.yml            — где кастомный предмет падает в луте
  WorldEvents/src/main/resources/squads.yml         — лут ночных отрядов

Что попадает на сайт автоматически (руками больше не правится):
  имя, редкость, сила, ветка, заряды, откаты, игровое описание (лор),
  все рецепты, «где используется», утилизация, источники лута.
Ручное остаётся в js/items-data.js: описание механики, категория, иконка, «как получить».

Дроп с самих боссов захардкожен в WorldEvents (boss/LootSystem.java), поэтому он
продублирован ниже в BOSS_DROPS — при изменении LootSystem.java поправьте и его.

Запуск:  python scripts/gen_items_data.py   (нужен PyYAML: pip install pyyaml)
"""
import datetime
import glob
import json
import os
import sys

import yaml

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(SITE)
OUT = os.path.join(SITE, 'js', 'items-gen.js')

CI_CONFIG = os.path.join(REPO, 'CustomItems', 'src', 'main', 'resources', 'config.yml')
CI_ITEMS_DIR = os.path.join(REPO, 'CustomItems', 'src', 'main', 'resources', 'items')
LOOT = os.path.join(REPO, 'ServerCore', 'src', 'main', 'resources', 'loot.yml')
SQUADS = os.path.join(REPO, 'WorldEvents', 'src', 'main', 'resources', 'squads.yml')

RARITY = {'common': 'common', 'uncommon': 'uncommon', 'rare': 'rare', 'epic': 'epic',
          'legendary': 'legend', 'mythic': 'legend'}

STAGES = ['LANDING', 'SETTLING', 'WAR', 'ESCALATION', 'ENDGAME']

BOSS_NAMES = {'warlord': 'Железный Воевода', 'time_keeper': 'Хранитель Времени', 'overlord': 'Повелитель'}

# WorldEvents boss/LootSystem.java: (id, шанс для топ-3, шанс для участника)
AMULETS = ['red_amulet', 'amulet_yellow', 'amulet_blue', 'amulet_green', 'amulet_cyan']
BOSS_DROPS = {
    'warlord': [('warlord_plate', 1, 1), ('battle_essence', .55, .25), ('harpoon', .30, 0),
                ('polarity_crusher', .20, 0), ('golem_core', .30, 0), ('mystery_enchant_book', 1, 1)]
               + [(a, .70 / 5, 0) for a in AMULETS],
    'time_keeper': [('chrono_shard', 1, 1), ('temporal_essence', .55, .25), ('echo_blade', .20, 0),
                    ('void_phase_shard', .30, 0), ('mystery_enchant_book', 1, 1)]
                   + [(a, .70 / 5, 0) for a in AMULETS],
    'overlord': [('overlord_fragment', 1, 1), ('soul_essence', .65, .20), ('dominion_core', .30, .04),
                 ('last_breath', .16, 0), ('abyssal_trident', .10, 0), ('scepter_of_dominion', .08, 0),
                 ('golem_heart', .20, 0), ('magma_welder_core', .16, 0), ('mystery_enchant_book', 1, 1)]
                + [(a, 1 / 5, 0) for a in AMULETS],
}

# Русские названия ванильных материалов, встречающихся в рецептах.
# Если в рецепт добавят новый материал — скрипт упадёт с подсказкой, какой дописать.
VANILLA = {
    'ANCIENT_DEBRIS': 'Древние обломки', 'BLACKSTONE': 'Чернокамень', 'BLAZE_POWDER': 'Огненный порошок',
    'BLAZE_ROD': 'Огненный стержень', 'BLUE_DYE': 'Синий краситель', 'BOOK': 'Книга',
    'BROWN_MUSHROOM': 'Коричневый гриб', 'CHORUS_FRUIT': 'Плод хоруса', 'COAL': 'Уголь',
    'COAL_BLOCK': 'Угольный блок', 'CYAN_DYE': 'Бирюзовый краситель', 'DIAMOND': 'Алмаз',
    'DIAMOND_BLOCK': 'Алмазный блок', 'DIAMOND_BOOTS': 'Алмазные ботинки',
    'DIAMOND_CHESTPLATE': 'Алмазный нагрудник', 'DIAMOND_HELMET': 'Алмазный шлем',
    'DIAMOND_LEGGINGS': 'Алмазные поножи', 'DIAMOND_PICKAXE': 'Алмазная кирка',
    'DIAMOND_SWORD': 'Алмазный меч', 'DRAGON_BREATH': 'Драконье дыхание', 'ENDER_EYE': 'Око Края',
    'ENDER_PEARL': 'Эндер-жемчуг', 'FERMENTED_SPIDER_EYE': 'Приготовленный паучий глаз',
    'GHAST_TEAR': 'Слеза гаста', 'GLASS_BOTTLE': 'Стеклянный пузырёк',
    'GLISTERING_MELON_SLICE': 'Сверкающий ломтик арбуза', 'GOLDEN_APPLE': 'Золотое яблоко',
    'GOLD_BLOCK': 'Золотой блок', 'GOLD_INGOT': 'Золотой слиток', 'GREEN_DYE': 'Зелёный краситель',
    'HEART_OF_THE_SEA': 'Сердце моря', 'IRON_BLOCK': 'Железный блок', 'IRON_BOOTS': 'Железные ботинки',
    'IRON_CHESTPLATE': 'Железный нагрудник', 'IRON_HELMET': 'Железный шлем',
    'IRON_INGOT': 'Железный слиток', 'IRON_LEGGINGS': 'Железные поножи', 'JUKEBOX': 'Проигрыватель',
    'LIGHTNING_ROD': 'Громоотвод', 'LIME_DYE': 'Лаймовый краситель', 'MACE': 'Булава',
    'MAGMA_BLOCK': 'Магмовый блок', 'NAUTILUS_SHELL': 'Раковина наутилуса',
    'NETHERITE_AXE': 'Незеритовый топор', 'NETHERITE_BOOTS': 'Незеритовые ботинки',
    'NETHERITE_CHESTPLATE': 'Незеритовый нагрудник', 'NETHERITE_HELMET': 'Незеритовый шлем',
    'NETHERITE_INGOT': 'Незеритовый слиток', 'NETHERITE_LEGGINGS': 'Незеритовые поножи',
    'NETHERITE_SCRAP': 'Незеритовый лом', 'NETHERITE_SWORD': 'Незеритовый меч',
    'NETHER_STAR': 'Звезда Незера', 'NOTE_BLOCK': 'Нотный блок',
    'PRISMARINE_CRYSTALS': 'Призмариновый кристалл', 'PRISMARINE_SHARD': 'Осколок призмарина',
    'REDSTONE': 'Редстоун', 'REDSTONE_BLOCK': 'Блок редстоуна', 'RED_BANNER': 'Красный флаг',
    'RED_DYE': 'Красный краситель', 'SHIELD': 'Щит', 'TOTEM_OF_UNDYING': 'Тотем бессмертия',
    'TRIDENT': 'Трезубец', 'WITHER_ROSE': 'Роза визера', 'WITHER_SKELETON_SKULL': 'Череп скелета-иссушителя',
    'YELLOW_DYE': 'Жёлтый краситель',
}


def load(path):
    with open(path, encoding='utf-8') as f:
        return yaml.safe_load(f) or {}


def seconds(v):
    """'45s' / '100ms' / '20t' / '2m' / число -> секунды (float) или None."""
    if v is None:
        return None
    s = str(v).strip().lower()
    try:
        if s.endswith('ms'):
            return float(s[:-2]) / 1000
        if s.endswith('s'):
            return float(s[:-1])
        if s.endswith('t'):
            return float(s[:-1]) / 20
        if s.endswith('m'):
            return float(s[:-1]) * 60
        return float(s)
    except ValueError:
        return None


def ref(part):
    """{material: X, amount: N} | {item: id, amount: N} -> {'m'|'i': ..., 'n': N}."""
    n = int(part.get('amount', 1))
    if 'item' in part:
        return {'i': part['item'], 'n': n}
    mat = str(part['material']).upper()
    if mat not in VANILLA:
        sys.exit('Нет русского названия для материала %s — допишите его в VANILLA' % mat)
    return {'m': mat, 'n': n}


def main():
    ci = load(CI_CONFIG)
    items_cfg = dict(ci.get('items') or {})
    for path in sorted(glob.glob(os.path.join(CI_ITEMS_DIR, '*.yml'))):
        items_cfg.update((load(path).get('items') or {}))

    items = {}
    for iid, d in items_cfg.items():
        if d.get('hidden'):
            continue
        rar = RARITY.get(str(d.get('rarity', '')).lower())
        entry = {
            'name': d.get('name', iid),
            'lore': d.get('lore') or [],
            'material': d.get('material'),
            'type': d.get('type'),
            'branch': d.get('branch'),
        }
        if rar:
            entry['rarity'] = rar
        if d.get('power-tier'):
            entry['power'] = str(d['power-tier'])
        if d.get('uses') is not None and int(d['uses']) > 0:
            entry['uses'] = int(d['uses'])
        cd = seconds(d.get('cooldown'))
        if cd:
            entry['cd'] = cd
        items[iid] = entry

    recipes = []
    for rid, r in (ci.get('engineer', {}).get('recipes') or {}).items():
        if 'input' in r:
            base = ref(r['input'])
            parts = [ref(p) for p in (r.get('ingredients') or [])]
        else:  # старый формат
            base = {'i': r['input-id'], 'n': 1}
            parts = [{'i': r['ingredient-id'], 'n': int(r.get('ingredient-amount', 1))}]
        result = r.get('result-id') or (r.get('outputs') or [{}])[0].get('id')
        recipes.append({'id': rid, 'result': result, 'base': base, 'parts': parts})

    recycle = {}
    for iid, p in (ci.get('recycler', {}).get('prices') or {}).items():
        recycle[iid] = {'i': p['shard-id'], 'n': int(p.get('amount', 1))}

    # ── Где кастомные предметы падают в луте ────────────────────────────────
    loot = load(LOOT).get('loot', {})
    pool_items = {}
    for pname, pool in (loot.get('pools') or {}).items():
        for e in pool.get('entries') or []:
            if 'custom' in e:
                pool_items.setdefault(pname.upper(), set()).add(e['custom'])

    sources = {}  # id -> {источник: индекс самого раннего этапа}

    def mark(iid, src, stage_idx):
        cur = sources.setdefault(iid, {})
        cur[src] = min(cur.get(src, 99), stage_idx)

    for src, sdef in (loot.get('sources') or {}).items():
        for stage, row in (sdef.get('matrix') or {}).items():
            if stage not in STAGES:
                continue
            for cell in (row or {}).values():
                for pname in str(cell).split('+'):
                    for iid in pool_items.get(pname.strip().upper(), ()):
                        mark(iid, src, STAGES.index(stage))
    # Бонусный ролл сундуков T3 на аванпостах (FactionsWar TieredChestManager)
    for iid in pool_items.get('CHEST_T3', ()):
        mark(iid, 'outpost', 0)

    squads = load(SQUADS).get('squads', {})
    for boss, sq in squads.items():
        lt = sq.get('loot') or {}
        ids = [x.get('id') for x in (lt.get('regular-items') or []) + (lt.get('leader-guaranteed') or [])]
        ids.append(lt.get('leader-rare-item'))
        for iid in filter(None, ids):
            sources.setdefault(iid, {}).setdefault('squads', set()).add(boss)

    for boss, drops in BOSS_DROPS.items():
        for iid, top, other in drops:
            sources.setdefault(iid, {}).setdefault('bosses', []).append(
                {'boss': boss, 'top': round(top, 3), 'all': round(other, 3)})

    for iid, src in sources.items():
        if 'squads' in src:
            src['squads'] = sorted(src['squads'])

    data = {
        'generated': datetime.date.today().isoformat(),
        'stages': STAGES,
        'bossNames': BOSS_NAMES,
        'vanilla': VANILLA,
        'items': items,
        'recipes': recipes,
        'recycle': recycle,
        'sources': sources,
    }
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        f.write('/* АВТОГЕНЕРАЦИЯ — scripts/gen_items_data.py. Не править руками:\n'
                '   данные берутся из конфигов CustomItems / ServerCore / WorldEvents. */\n')
        f.write('window.GEN = ')
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'), sort_keys=True)
        f.write(';\n')
    print('items: %d, recipes: %d, sources: %d -> %s' % (len(items), len(recipes), len(sources), OUT))


if __name__ == '__main__':
    main()
