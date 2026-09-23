/* Эмодзи-шифр — проверка ответа: терпим опечатки, порядок слов, лишние слова и «ё» */
(function (root) {
  'use strict';

  function norm(s) {
    return String(s || '').toLowerCase().replace(/ё/g, 'е')
      .replace(/[^a-zа-я0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  }

  /* Расстояние Дамерау — Левенштейна (перестановка соседних букв = 1 правка) */
  function lev(a, b) {
    var m = a.length, n = b.length, i, j;
    if (!m) return n;
    if (!n) return m;
    var d = [];
    for (i = 0; i <= m; i++) { d.push(new Array(n + 1)); d[i][0] = i; }
    for (j = 0; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) {
      for (j = 1; j <= n; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        var v = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2][j - 2] + 1);
        d[i][j] = v;
      }
    }
    return d[m][n];
  }

  /* Сколько опечаток прощаем в зависимости от длины правильного ответа */
  function tol(n) { return n <= 4 ? 0 : n <= 7 ? 1 : n <= 14 ? 2 : n <= 24 ? 3 : 4; }

  function stemOk(word, stem) {
    if (/^\d+$/.test(stem)) return word === stem;
    if (word.indexOf(stem) === 0) return true;
    if (stem.length >= 6 && word.length >= stem.length) {
      return lev(word.slice(0, stem.length), stem) <= 1;
    }
    return false;
  }
  function keyHit(words, key) {
    var alts = key.split('|');
    for (var a = 0; a < alts.length; a++) {
      for (var w = 0; w < words.length; w++) if (stemOk(words[w], alts[a])) return true;
    }
    return false;
  }
  function sorted(s) { return s.split(' ').sort().join(' '); }
  /* Слова, которые можно дописать к ответу: «мультфильм Ну погоди», «это Колобок» */
  var FILLER = ['мультфильм', 'мультик', 'мульт', 'фильм', 'кино', 'сказка', 'сказку', 'книга', 'книгу',
    'роман', 'рассказ', 'повесть', 'басня', 'басню', 'пословица', 'поговорка', 'фразеологизм', 'выражение',
    'это', 'ответ', 'наверное', 'думаю', 'кажется', 'мне', 'я', 'по', 'моему', 'точно', 'ну', 'так', 'же'];
  function onlyFiller(x, c) {
    var i = (' ' + x + ' ').indexOf(' ' + c + ' ');
    if (i < 0) return false;
    var rest = (x.slice(0, i) + ' ' + x.slice(i + c.length)).trim();
    if (!rest) return true;
    return rest.split(/\s+/).every(function (w) { return FILLER.indexOf(w) >= 0; });
  }

  function candidates(p) {
    var out = [norm(p.a)];
    (p.alt || []).forEach(function (x) { var n = norm(x); if (n && out.indexOf(n) < 0) out.push(n); });
    return out;
  }

  /* → {ok, heat 0..1}. heat — насколько близко (для «холодно / тепло / горячо») */
  function check(input, p) {
    var x = norm(input);
    if (!x) return { ok: false, heat: 0 };
    var cands = candidates(p), i, c;
    for (i = 0; i < cands.length; i++) {
      c = cands[i];
      if (x === c) return { ok: true, heat: 1 };
      var t = tol(c.replace(/ /g, '').length);
      if (lev(x, c) <= t) return { ok: true, heat: 1 };
      if (c.indexOf(' ') > 0 && lev(sorted(x), sorted(c)) <= t) return { ok: true, heat: 1 };
      if (onlyFiller(x, c)) return { ok: true, heat: 1 };
    }
    var words = x.split(' ');
    var keyRatio = 0;
    if (p.k && p.k.length) {
      var hit = 0;
      for (i = 0; i < p.k.length; i++) if (keyHit(words, p.k[i])) hit++;
      keyRatio = hit / p.k.length;
      var longest = 0;
      cands.forEach(function (q) { longest = Math.max(longest, q.length); });
      if (hit === p.k.length && x.length <= longest * 2 + 10) return { ok: true, heat: 1 };
    }
    var best = 0;
    for (i = 0; i < cands.length; i++) {
      c = cands[i];
      best = Math.max(best, 1 - lev(x, c) / Math.max(x.length, c.length));
    }
    var cw = cands[0].split(' ').filter(function (w) { return w.length > 2; });
    var wHit = 0;
    cw.forEach(function (w) {
      var st = w.slice(0, Math.max(3, Math.ceil(w.length * 0.6)));
      if (words.some(function (y) { return stemOk(y, st); })) wHit++;
    });
    var wordRatio = cw.length ? wHit / cw.length : 0;
    var heat = Math.max(best, keyRatio * 0.95, wordRatio * 0.95);
    return { ok: false, heat: Math.min(0.99, heat) };
  }

  /* Маска для подсказки «Буквы»: первая буква каждого слова открыта */
  function lettersMask(answer) {
    var out = [], first = true;
    for (var ch of String(answer)) {
      if (/[a-zA-Zа-яА-ЯёЁ0-9]/.test(ch)) { out.push({ ch: ch, show: first }); first = false; }
      else { out.push({ p: ch }); if (/[\s\-—]/.test(ch)) first = true; }
    }
    return out;
  }

  var M = { norm: norm, lev: lev, check: check, lettersMask: lettersMask };
  if (typeof module !== 'undefined' && module.exports) module.exports = M;
  else root.MATCH = M;
})(this);
