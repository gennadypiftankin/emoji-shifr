/* Эмодзи-шифр — банк шифровок.
   Формат: P(id, категория, уровень 1..3, 'эмодзи группы через пробел', 'Ответ', {alt:[варианты], k:[ключевые основы], h:[подсказки]})
   Подсказки: S(фон, 'эмодзи@x,y,размер,анимация|…') — картинка-сценка; D — описание; R — другими словами;
   L(язык, текст) — на другом языке; F — перевёртыш; W — автор/источник; Q — цитата; Z — загадка.
   Ключевые основы k: все должны встретиться в ответе игрока (варианты через «|»). */
(function () {
  'use strict';
  var list = [];
  function P(id, c, l, e, a, o) {
    o = o || {};
    list.push({ id: id, c: c, l: l, e: e, a: a, alt: o.alt || [], k: o.k || null, h: o.h || [] });
  }
  function S(bg, items) { return { t: 'scene', bg: bg, items: items }; }
  function D(v) { return { t: 'desc', v: v }; }
  function R(v) { return { t: 'para', v: v }; }
  function L(l, v) { return { t: 'lang', l: l, v: v }; }
  function F(v) { return { t: 'flip', v: v }; }
  function W(v) { return { t: 'who', v: v }; }
  function Q(v) { return { t: 'quote', v: v }; }
  function Z(v) { return { t: 'riddle', v: v }; }

  window.PUZZLES = list;
  window.PZ = { P: P, S: S, D: D, R: R, L: L, F: F, W: W, Q: Q, Z: Z };

  window.CATS = {
    tale:    { name: 'Сказки и басни',  one: 'Сказка',       icon: '🧚' },
    cartoon: { name: 'Мультфильмы',     one: 'Мультфильм',   icon: '📺' },
    film:    { name: 'Фильмы',          one: 'Фильм',        icon: '🎬' },
    book:    { name: 'Книги',           one: 'Книга',        icon: '📚' },
    proverb: { name: 'Пословицы',       one: 'Пословица',    icon: '💬' },
    idiom:   { name: 'Фразеологизмы',   one: 'Фразеологизм', icon: '🎭' }
  };
  window.LEVELS = {
    1: { name: 'Лёгкая',  coins: 10 },
    2: { name: 'Средняя', coins: 20 },
    3: { name: 'Сложная', coins: 30 }
  };
  window.HINT_META = {
    scene:   { icon: '🖼️', name: 'Картинка' },
    desc:    { icon: '🔍', name: 'Описание' },
    para:    { icon: '🔄', name: 'Другими словами' },
    lang:    { icon: '🌍', name: 'На другом языке' },
    flip:    { icon: '🙃', name: 'Перевёртыш' },
    who:     { icon: '✍️', name: 'Откуда это' },
    quote:   { icon: '💬', name: 'Цитата' },
    riddle:  { icon: '🧩', name: 'Загадка' },
    letters: { icon: '🔤', name: 'Буквы' }
  };
  window.LANGS = {
    en: 'По-английски', de: 'По-немецки', fr: 'По-французски', it: 'По-итальянски',
    sv: 'По-шведски', da: 'По-датски', la: 'На латыни', es: 'По-испански'
  };
})();
