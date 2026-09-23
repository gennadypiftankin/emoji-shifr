/* Эмодзи-шифр — приложение: экраны, одиночная игра, гардероб, комнаты с друзьями */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = EMO.esc, E = EMO.img, T = EMO.parse;
  var BY_ID = {};
  PUZZLES.forEach(function (p) { BY_ID[p.id] = p; });
  var CAT_KEYS = Object.keys(CATS);
  var app = $('#app'), topbar = $('#topbar'), modalRoot = $('#modal'), toastWrap = $('#toasts');
  var isTouch = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  var reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var REACTS = ['😂', '👏', '😱', '🔥', '❤️', '🤯'];
  var REVEAL_MS = 7000, COUNT_MS = 3500;

  function rnd(n) { return Math.floor(Math.random() * n); }
  function pick(a) { return a[rnd(a.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function uid(n) { var s = '', ch = 'abcdefghijkmnpqrstuvwxyz23456789'; for (var i = 0; i < (n || 8); i++) s += ch[rnd(ch.length)]; return s; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function plural(n, one, few, many) { var a = Math.abs(n) % 100, b = a % 10; if (a > 10 && a < 20) return many; if (b > 1 && b < 5) return few; if (b === 1) return one; return many; }

  /* ——— Хранилище (прогресс живёт в браузере игрока) ——— */
  var KEY = 'emojishifr.v1';
  var D = null;
  function freeOwned() {
    var out = [];
    AV.SLOTS.forEach(function (s) { AV.C[s].forEach(function (it) { if (!it.price) out.push(s + ':' + it.id); }); });
    return out;
  }
  function freshData() {
    var look = Object.assign({}, AV.DEFAULT, { color: pick(['sun', 'mint', 'sky', 'coral']) });
    return { v: 1, name: '', look: look, owned: freeOwned(), coins: 60, solved: {}, streak: 0, recent: [],
      stats: { solved: 0, best: 0, games: 0, wins: 0, hints: 0 }, settings: { lvl: 0 }, roomSet: null };
  }
  function normalize(d) {
    var f = freshData();
    for (var k in f) if (!(k in d)) d[k] = f[k];
    if (typeof d.coins !== 'number' || d.coins < 0 || !isFinite(d.coins)) d.coins = 0;
    if (!Array.isArray(d.owned)) d.owned = [];
    freeOwned().forEach(function (x) { if (d.owned.indexOf(x) < 0) d.owned.push(x); });
    d.look = AV.clean(d.look);
    AV.SLOTS.forEach(function (s) { if (d.owned.indexOf(s + ':' + d.look[s]) < 0) d.look[s] = AV.DEFAULT[s]; });
    if (!d.stats) d.stats = f.stats;
    ['solved', 'best', 'games', 'wins', 'hints'].forEach(function (k) { if (typeof d.stats[k] !== 'number') d.stats[k] = 0; });
    if (!d.solved || typeof d.solved !== 'object') d.solved = {};
    if (!d.settings) d.settings = { lvl: 0 };
    return d;
  }
  function load() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
    if (!d || d.v !== 1) d = freshData();
    return normalize(d);
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) { /* приватный режим */ } }
  function owns(slot, id) { return D.owned.indexOf(slot + ':' + id) >= 0; }

  /* ——— Имена ——— */
  var ADJ = ['Хитрый', 'Весёлый', 'Быстрый', 'Смелый', 'Тайный', 'Мудрый', 'Ловкий', 'Звёздный', 'Храбрый', 'Шустрый'];
  var NOUN = ['Енот', 'Лис', 'Кот', 'Пингвин', 'Сыщик', 'Ёжик', 'Дракон', 'Пельмень', 'Кактус', 'Барсук', 'Тигр', 'Бобёр'];
  function randomName() { return pick(ADJ) + ' ' + pick(NOUN); }
  var BAD = /(ху[йеёиюя]|пизд|бля|[её]б[аул]|сука|суки|мудак|пидор|залуп|гандон|шлюх|дроч|говн|сран|fuck|shit|bitch)/i;
  function cleanName(s) {
    s = String(s || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
    if (!s) return '';
    if (BAD.test(s.replace(/[^a-zа-яё]/gi, ''))) return null;
    return s;
  }
  var RANKS = [[0, 'Новичок'], [5, 'Стажёр'], [15, 'Агент'], [30, 'Старший агент'], [60, 'Мастер шифра'], [100, 'Гроссмейстер'], [160, 'Легенда']];
  function rankOf(n) { var r = RANKS[0][1]; RANKS.forEach(function (x) { if (n >= x[0]) r = x[1]; }); return r; }

  /* ——— Экономика ——— */
  var MULT = [1, 0.75, 0.5, 0.35, 0.2];
  function base(p) { return LEVELS[p.l].coins; }
  function reward(p, hints, repeat) { var r = Math.round(base(p) * MULT[Math.min(hints, 4)]); if (repeat) r = Math.round(r * 0.3); return Math.max(1, r); }
  function streakBonus(s) { return s >= 10 ? 15 : s >= 5 ? 10 : s >= 3 ? 5 : 0; }
  function placeBonus(place, p) { var k = [0, 0.5, 0.3, 0.15][place] || 0; return Math.round(base(p) * k); }

  /* ——— Общие элементы интерфейса ——— */
  var topBack = null;
  function setTop(o) {
    o = o || {};
    topBack = o.back || null;
    topbar.innerHTML = (o.back ? '<button class="iconbtn" data-act="back" aria-label="Назад">' + E('⬅️') + '</button>'
      : '<button class="iconbtn" data-act="settings" aria-label="Настройки">' + E('⚙️') + '</button>') +
      '<div class="crumb">' + (o.crumb || '') + '</div><div class="spacer"></div>' + (o.extra || '') +
      '<span class="coins" id="coins" title="Монеты">' + E('🪙') + '<span id="coinsN">' + D.coins + '</span></span>' +
      '<button class="iconbtn" data-act="sound" aria-label="Звук">' + E(SND.isOn() ? '🔊' : '🔇') + '</button>';
  }
  function updateCoins(bump) {
    var n = $('#coinsN'); if (n) n.textContent = D.coins;
    if (bump) { var c = $('#coins'); if (c) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); } }
  }
  function flyCoins(fromEl, count, done) {
    var to = $('#coins');
    if (!to || !fromEl || reduceMotion) { if (done) done(); return; }
    var a = fromEl.getBoundingClientRect(), b = to.getBoundingClientRect();
    for (var i = 0; i < count; i++) (function (i) {
      var img = document.createElement('img');
      img.src = EMO.src('🪙'); img.className = 'fly-coin'; img.alt = '';
      var sx = a.left + a.width / 2 - 15 + (Math.random() * 70 - 35), sy = a.top + a.height / 2 - 15 + (Math.random() * 30 - 15);
      img.style.left = sx + 'px'; img.style.top = sy + 'px';
      document.body.appendChild(img);
      setTimeout(function () { img.style.transform = 'translate(' + (b.left + 8 - sx) + 'px,' + (b.top + 2 - sy) + 'px) scale(.7)'; img.style.opacity = '0'; }, 30 + i * 70);
      setTimeout(function () { img.remove(); if (i === count - 1) { SND.play('coin'); if (done) done(); } }, 820 + i * 70);
    })(i);
  }
  function toast(html, ms) {
    var t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = html;
    toastWrap.appendChild(t);
    setTimeout(function () { t.style.transition = 'opacity .3s, transform .3s'; t.style.opacity = '0'; t.style.transform = 'translateY(-10px)'; setTimeout(function () { t.remove(); }, 320); }, ms || 2300);
  }
  var MACT = {};
  function openModal(html, actions, dismiss) {
    modalRoot.innerHTML = '<div class="modal" role="dialog" aria-modal="true"><div class="card">' + html + '</div></div>';
    modalRoot.hidden = false;
    document.body.classList.add('modal-open');
    MACT = actions || {};
    var m = $('.modal', modalRoot);
    if (dismiss) m.addEventListener('click', function (e) { if (e.target === m) closeModal(); });
    var f = $('[autofocus]', modalRoot); if (f && !isTouch) setTimeout(function () { f.focus(); }, 60);
    return $('.card', modalRoot);
  }
  function closeModal() { modalRoot.innerHTML = ''; modalRoot.hidden = true; MACT = {}; document.body.classList.remove('modal-open'); }

  /* ——— Конфетти ——— */
  var cv = $('#fx'), cx = cv.getContext('2d'), parts = [], raf = 0;
  var CONF = ['#FFC933', '#FF5A6E', '#2ED3C6', '#7BE36A', '#A58BFF', '#62C9FF', '#FFFFFF'];
  function confetti(x, y, n) {
    if (reduceMotion) return;
    var dpr = window.devicePixelRatio || 1;
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (x == null) { x = innerWidth / 2; y = innerHeight / 3; }
    for (var i = 0; i < (n || 120); i++) {
      var a = Math.random() * Math.PI * 2, sp = 4 + Math.random() * 9;
      parts.push({ x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 6, g: 0.28 + Math.random() * 0.1, w: 6 + Math.random() * 7, h: 4 + Math.random() * 6,
        r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: pick(CONF), life: 110 + rnd(60), round: Math.random() < 0.3 });
    }
    if (!raf) raf = requestAnimationFrame(stepConf);
  }
  function stepConf() {
    cx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(function (p) { return p.life > 0 && p.y < innerHeight + 40; });
    parts.forEach(function (p) {
      p.vy += p.g; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--;
      cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.globalAlpha = Math.min(1, p.life / 30); cx.fillStyle = p.c;
      if (p.round) { cx.beginPath(); cx.arc(0, 0, p.w / 2.4, 0, 7); cx.fill(); } else cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 1.7)) + 1);
      cx.restore();
    });
    if (parts.length) raf = requestAnimationFrame(stepConf); else { raf = 0; cx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  function confettiAt(el, n) { if (!el) return confetti(null, null, n); var r = el.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 3, n); }

  /* ——— Маршрутизация и действия ——— */
  var SCREENS = {}, ACT = {}, cleanups = [], current = null;
  function acts(map) { ACT = map || {}; }
  function go(name, arg) {
    cleanups.forEach(function (f) { try { f(); } catch (e) { /* ок */ } });
    cleanups = [];
    closeModal();
    current = name;
    window.scrollTo(0, 0);
    SCREENS[name](arg);
  }
  var GLOBAL = {
    back: function () { SND.play('click'); if (typeof topBack === 'function') topBack(); else if (topBack) go(topBack); },
    settings: function () { openSettings(); },
    sound: function (el) { var on = SND.toggle(); el.innerHTML = E(on ? '🔊' : '🔇'); },
    close: function () { closeModal(); }
  };
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    var a = el.getAttribute('data-act');
    var fn = MACT[a] || ACT[a] || GLOBAL[a];
    if (fn) { e.preventDefault(); fn(el, e); }
  });

  /* ——— Табло, подсказки, сценки ——— */
  function levelStars(l) { var s = ''; for (var i = 1; i <= 3; i++) s += E('⭐', i <= l ? '' : 'dim'); return '<span class="lvl" title="' + LEVELS[l].name + '">' + s + '</span>'; }
  function boardHTML(p, o) {
    o = o || {};
    var cat = CATS[p.c], k = 0;
    var row = p.e.trim().split(/\s+/).map(function (g) {
      return '<span class="eg">' + EMO.split(g).map(function (em) { return E(em, '', 'style="animation-delay:' + (0.08 * k++).toFixed(2) + 's"'); }).join('') + '</span>';
    }).join('');
    return '<div class="marquee"><div class="board" id="board">' +
      '<div class="board-head"><span class="chip">' + E(cat.icon) + ' ' + cat.one + '</span>' + levelStars(p.l) +
      '<span class="spacer"></span>' + (o.reward != null ? '<span class="reward" id="reward">' + E('🪙') + '<span id="rewardN">' + o.reward + '</span></span>' : '') + '</div>' +
      '<div class="emo-row" id="emoRow"' + (o.hidden ? ' hidden' : '') + ' role="img" aria-label="Зашифрованная фраза из эмодзи">' + row + '</div>' +
      (o.answer ? '<div class="answer-reveal">' + esc(o.answer) + '</div>' : '') +
      (o.count ? '<div class="count" id="count"><b>' + o.count + '</b></div>' : '') +
      '</div></div>';
  }
  function wobbleLater() { setTimeout(function () { var r = $('#emoRow'); if (r) r.classList.add('wobble'); }, 1400); }
  function popSounds(p) { var n = EMO.split(p.e).length; for (var i = 0; i < n; i++) (function (i) { setTimeout(function () { SND.play('pop', i % 6); }, 80 * i); })(i); }

  function hintDefs(p) { return p.h.concat([{ t: 'letters' }]); }
  function hintLabel(h) { return h.t === 'lang' ? (LANGS[h.l] || 'На другом языке') : HINT_META[h.t].name; }
  function hintsHTML(p, opened, cost) {
    return hintDefs(p).map(function (h, i) {
      var open = opened.indexOf(i) >= 0;
      return '<button class="hint-btn' + (open ? ' open' : '') + '" data-act="hint" data-i="' + i + '"' + (open ? ' aria-pressed="true"' : '') + '>' +
        '<span class="ic">' + E(HINT_META[h.t].icon) + '</span><b>' + hintLabel(h) + '</b>' +
        '<span class="cost">' + (open ? 'открыто' : '−' + cost + ' ' + E('🪙')) + '</span></button>';
    }).join('');
  }
  function sceneHTML(h) {
    var out = '<div class="scene sc-' + h.bg + '" role="img" aria-label="Картинка-подсказка">';
    h.items.split('|').forEach(function (s) {
      var at = s.indexOf('@'); if (at < 0) return;
      var emo = s.slice(0, at), a = s.slice(at + 1).split(',');
      var cls = ['si'], anim = '', delay = '';
      a.slice(3).forEach(function (o) { if (o === 'f' || o === 'v' || o === 'g') cls.push(o); else if (/^d\d$/.test(o)) delay = o; else if (o) anim = 'a-' + o; });
      out += '<span class="' + cls.join(' ') + '" style="left:' + (+a[0]) + '%;top:' + (+a[1]) + '%;height:' + (+a[2]) + '%"><img src="' + EMO.src(emo) + '" alt="" class="' + anim + ' ' + delay + '" draggable="false"></span>';
    });
    return out + '</div>';
  }
  function lettersHTML(ans) {
    var words = [[]];
    MATCH.lettersMask(ans).forEach(function (m) {
      if (m.p === ' ') { words.push([]); return; }
      words[words.length - 1].push(m);
    });
    return '<div class="letters">' + words.map(function (w) {
      return '<span class="w">' + w.map(function (m) {
        return m.p != null ? '<span class="p">' + esc(m.p) + '</span>' : '<span class="l' + (m.show ? '' : ' hid') + '">' + (m.show ? esc(m.ch) : '·') + '</span>';
      }).join('') + '</span>';
    }).join('') + '</div><p class="small" style="color:#53618A;text-align:center;margin-top:6px">Открыта первая буква каждого слова</p>';
  }
  function hintCardHTML(p, i) {
    var h = hintDefs(p)[i];
    var head = '<div class="ht">' + E(HINT_META[h.t].icon) + ' ' + hintLabel(h) + '</div>', body;
    if (h.t === 'scene') body = sceneHTML(h);
    else if (h.t === 'lang') body = '<div class="hv foreign" lang="' + h.l + '">' + esc(h.v) + '</div>';
    else if (h.t === 'flip') body = '<div class="hv">' + esc(h.v) + '</div><p class="small" style="color:#53618A;margin-top:4px">Слова заменены на противоположные — переверни обратно!</p>';
    else if (h.t === 'letters') body = lettersHTML(p.a);
    else body = '<div class="hv">' + T(h.v) + '</div>';
    return '<div class="hint-card hc-' + h.t + '">' + head + body + '</div>';
  }
  function heatHTML(h) {
    if (h >= 0.72) return '<span class="temp hot">' + E('🔥') + ' Горячо! Совсем близко</span>';
    if (h >= 0.42) return '<span class="temp warm">' + E('🌤️') + ' Тепло</span>';
    return '<span class="temp cold">' + E('❄️') + ' Холодно</span>';
  }
  function shakeForm() { var f = $('#ansForm'); if (!f) return; f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); }
  function answerFormHTML() {
    return '<form class="answer" id="ansForm" autocomplete="off"><input id="ans" type="text" placeholder="Твой ответ…" enterkeyhint="done" autocapitalize="sentences" autocomplete="off" spellcheck="false" maxlength="90" aria-label="Твой ответ">' +
      '<button class="btn" type="submit" aria-label="Проверить">' + E('✅') + '</button></form><div class="feedback" id="fb" aria-live="polite"></div>';
  }

  /* ——— Главная ——— */
  SCREENS.home = function () {
    setTop({});
    var solved = D.stats.solved;
    app.innerHTML = '<div class="screen"><div class="col">' +
      '<div class="logo"><div class="word">Эмодзи' + E('🔐') + '</div><br><div class="word two">шифр</div>' +
      '<p class="tag">Разгадай фразу, спрятанную в смайликах!</p></div>' +
      '<div class="hero-stage"><div class="beam"></div><button class="pedestal" data-act="poke" aria-label="Потанцевать">' + AV.render(D.look, { size: 170 }) + '</button>' +
      '<div class="nametag"><b>' + esc(D.name || 'Агент') + '</b><span>' + rankOf(solved) + '</span></div></div>' +
      '<div class="menu">' +
      '<button class="btn" data-act="solo">' + E('🎯') + '<span class="lbl">Играть одному<span class="sub">243 шифровки в 6 темах</span></span></button>' +
      '<button class="btn btn-coral" data-act="friends">' + E('👥') + '<span class="lbl">Играть с друзьями<span class="sub">Кто быстрее расшифрует</span></span></button>' +
      '<div class="grid2"><button class="btn btn-aqua" data-act="shop">' + E('👕') + ' Гардероб</button>' +
      '<button class="btn btn-dark" data-act="howto">' + E('❓') + ' Как играть</button></div></div>' +
      '<div class="stats"><span class="chip">' + E('✅') + ' Разгадано ' + solved + ' из ' + PUZZLES.length + '</span>' +
      (D.stats.best ? '<span class="chip">' + E('🔥') + ' Лучшая серия: ' + D.stats.best + '</span>' : '') +
      (D.stats.wins ? '<span class="chip">' + E('🏆') + ' Побед: ' + D.stats.wins + '</span>' : '') + '</div>' +
      footerHTML() + '</div></div>';
    acts({
      solo: function () { SND.play('click'); go('cats'); },
      friends: function () { SND.play('click'); go('friends'); },
      shop: function () { SND.play('click'); go('shop'); },
      howto: function () { SND.play('click'); go('howto'); },
      poke: function (el) {
        var moods = ['dance', 'dance', 'cheer', 'shock', 'faint', 'love', 'confused', 'melt'];
        var m = pick(moods);
        AV.setMood(el, m, m === 'dance' ? 3200 : 2200);
        if (m === 'dance') SND.play('dance'); else SND.play('react');
      }
    });
  };
  function footerHTML() {
    return '<div class="footer">Эмодзи — <a href="https://github.com/jdecked/twemoji" target="_blank" rel="noopener">Twemoji</a> (CC BY 4.0).<br>Прогресс и монеты хранятся в этом браузере — в настройках есть код для переноса.</div>';
  }

  /* ——— Как играть ——— */
  SCREENS.howto = function () {
    setTop({ back: 'home', crumb: 'Как играть' });
    var steps = [
      ['🔐', 'На табло — зашифрованная фраза: название мультфильма, фильма, книги, сказки, пословица или фразеологизм.'],
      ['⌨️', 'Напиши ответ. Опечатки и буква «ё» прощаются, а «холодно — тепло — горячо» подскажет, насколько ты близко.'],
      ['💡', 'Застрял? Открой подсказку: картинку, описание, перевод на другой язык, перевёртыш или первые буквы. Каждая подсказка уменьшает награду.'],
      ['🪙', 'Лёгкая шифровка — 10 монет, средняя — 20, сложная — 30. Три победы подряд — бонус за серию.'],
      ['👕', 'Трать монеты в гардеробе: шапки, очки, костюмы, питомцы, эффекты и новые танцы.'],
      ['👥', 'С друзьями: создай комнату и отправь код. Все видят персонажей друг друга, а кто расшифрует быстрее — получает бонус за место.']
    ];
    app.innerHTML = '<div class="screen"><div class="col"><h2>Как играть</h2><div class="card howto">' +
      steps.map(function (s, i) { return '<div class="st"><span class="n">' + (i + 1) + '</span><p>' + E(s[0]) + ' ' + esc(s[1]) + '</p></div>'; }).join('') +
      '</div><div class="card"><h3 style="margin-bottom:10px">Пример</h3>' + boardHTML(BY_ID.i01, { reward: 10 }) +
      '<p style="margin-top:12px">Муха, стрелка, слон… Это <b>«Делать из мухи слона»</b> — так говорят, когда человек раздувает пустяк.</p></div>' +
      '<button class="btn btn-wide" data-act="play">' + E('🎯') + ' Начать!</button></div></div>';
    acts({ play: function () { go('cats'); } });
  };

  /* ——— Выбор темы ——— */
  SCREENS.cats = function () {
    setTop({ back: 'home', crumb: 'Одиночная игра' });
    var lvl = D.settings.lvl || 0;
    function tile(c) {
      var all = PUZZLES.filter(function (p) { return c === 'all' || p.c === c; });
      var done = all.filter(function (p) { return D.solved[p.id]; }).length;
      var info = c === 'all' ? { name: 'Всё вперемешку', icon: '🎲' } : CATS[c];
      return '<button class="cat' + (c === 'all' ? ' all' : '') + '" data-act="cat" data-c="' + c + '"><span class="ic">' + E(info.icon) + '</span>' +
        '<span style="flex:1;display:flex;flex-direction:column;gap:6px;width:100%"><b>' + info.name + '</b>' +
        '<small>' + done + ' из ' + all.length + '</small><span class="bar"><i style="width:' + Math.round(100 * done / all.length) + '%"></i></span></span></button>';
    }
    app.innerHTML = '<div class="screen"><div class="col"><h2>Выбери тему</h2><div class="cats">' + tile('all') + CAT_KEYS.map(tile).join('') + '</div>' +
      '<div class="setting"><span>Сложность</span><div class="seg" id="lvlSeg">' +
      ['Любая', 'Лёгкая', 'Средняя', 'Сложная'].map(function (n, i) { return '<button data-act="lvl" data-l="' + i + '" aria-pressed="' + (lvl === i) + '">' + (i ? E('⭐').repeat(i) + ' ' : '') + n + '</button>'; }).join('') +
      '</div></div></div></div>';
    acts({
      cat: function (el) { SND.play('click'); startSolo(el.getAttribute('data-c')); },
      lvl: function (el) { D.settings.lvl = +el.getAttribute('data-l'); save(); $$('#lvlSeg button').forEach(function (b) { b.setAttribute('aria-pressed', String(b === el)); }); SND.play('click'); }
    });
  };

  /* ——— Одиночная игра ——— */
  var S = null;
  function startSolo(cat) { S = { cat: cat, lvl: D.settings.lvl || 0 }; go('solo'); }
  function soloPool() { return PUZZLES.filter(function (p) { return (S.cat === 'all' || p.c === S.cat) && (!S.lvl || p.l === S.lvl); }); }
  function pickNext() {
    var pool = soloPool();
    if (!pool.length) { S.lvl = 0; pool = soloPool(); }
    var recent = D.recent || [];
    var fresh = function (a) { return a.filter(function (p) { return recent.indexOf(p.id) < 0; }); };
    var uns = pool.filter(function (p) { return !D.solved[p.id]; });
    var cand = fresh(uns); if (!cand.length) cand = uns;
    var repeat = false;
    if (!cand.length) { cand = fresh(pool); if (!cand.length) cand = pool; repeat = true; }
    return { p: pick(cand), repeat: repeat, allDone: !uns.length };
  }
  SCREENS.solo = function () {
    if (!S) return go('cats');
    nextPuzzle();
  };
  function nextPuzzle() {
    var r = pickNext();
    if (r.allDone && !S.warned) { S.warned = true; toast(E('🏆') + ' Все шифровки этой темы разгаданы! Дальше — повторение: монет меньше.', 3600); }
    S.p = r.p; S.repeat = r.repeat; S.opened = []; S.wrong = 0; S.done = false;
    D.recent = [S.p.id].concat((D.recent || []).filter(function (x) { return x !== S.p.id; })).slice(0, 16);
    save();
    renderSolo();
  }
  function soloCost() { return reward(S.p, S.opened.length, S.repeat) - reward(S.p, S.opened.length + 1, S.repeat); }
  function renderSolo() {
    var p = S.p;
    setTop({ back: 'cats', crumb: S.cat === 'all' ? 'Всё вперемешку' : CATS[S.cat].name,
      extra: D.streak >= 2 ? '<span class="chip" title="Серия">' + E('🔥') + ' ' + D.streak + '</span>' : '' });
    app.innerHTML = '<div class="screen"><div class="play-grid">' +
      '<div class="col" style="max-width:none">' + boardHTML(p, { reward: reward(p, 0, S.repeat) }) +
      '<div class="hints" id="hints">' + hintsHTML(p, S.opened, soloCost()) + '</div>' +
      '<div class="hint-list" id="hintList"></div>' + answerFormHTML() +
      '<div class="subacts"><button class="link" data-act="skip">Другая шифровка</button><button class="link" data-act="giveup">Сдаться</button></div></div>' +
      '<div class="side"><div class="stage"><div class="players"><div class="pl me" id="soloMe" style="--plw:150px">' + AV.render(D.look) +
      '<div class="tag">' + esc(D.name) + '</div></div></div></div>' +
      (S.repeat ? '<p class="small muted" style="text-align:center">Эту шифровку ты уже разгадывал — за повтор монет меньше.</p>' : '') + '</div>' +
      '</div></div>';
    popSounds(p); wobbleLater();
    var inp = $('#ans'), typingT = 0;
    if (!isTouch) setTimeout(function () { if (inp) inp.focus(); }, 500);
    inp.addEventListener('input', function () {
      var me = $('#soloMe');
      if (me && !me.querySelector('.av').getAttribute('data-mood') || (me && me.querySelector('.av').getAttribute('data-mood') === 'idle')) AV.setMood(me, 'think');
      clearTimeout(typingT);
      typingT = setTimeout(function () { var m = $('#soloMe'); if (m && m.querySelector('.av').getAttribute('data-mood') === 'think') AV.setMood(m, 'idle'); }, 2200);
    });
    $('#ansForm').addEventListener('submit', onSoloSubmit);
    acts({
      hint: function (el) { openSoloHint(+el.getAttribute('data-i')); },
      skip: function () {
        if (S.done) return;
        if (D.streak >= 2) toast(E('💨') + ' Серия прервана');
        D.streak = 0; save(); SND.play('click'); nextPuzzle();
      },
      giveup: function () { if (!S.done) confirmGiveUp(); }
    });
  }
  function openSoloHint(i) {
    if (S.done || S.opened.indexOf(i) >= 0) return;
    var before = reward(S.p, S.opened.length, S.repeat);
    S.opened.push(i);
    D.stats.hints++; save();
    var after = reward(S.p, S.opened.length, S.repeat);
    $('#hints').innerHTML = hintsHTML(S.p, S.opened, soloCost());
    var rn = $('#rewardN'); if (rn) rn.innerHTML = '<s>' + before + '</s> ' + after;
    var list = $('#hintList');
    list.insertAdjacentHTML('beforeend', hintCardHTML(S.p, i));
    SND.play('hint');
    var card = list.lastElementChild;
    if (card && card.scrollIntoView) setTimeout(function () { card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' }); }, 120);
  }
  function onSoloSubmit(e) {
    e.preventDefault();
    if (S.done) return;
    var inp = $('#ans'), v = inp.value;
    if (!v.trim()) return;
    var r = MATCH.check(v, S.p);
    if (r.ok) return soloWin();
    S.wrong++;
    $('#fb').innerHTML = heatHTML(r.heat);
    SND.play(r.heat >= 0.72 ? 'warm' : 'wrong');
    shakeForm();
    AV.setMood($('#soloMe'), r.heat >= 0.72 ? 'shock' : pick(['nope', 'confused', 'facepalm']), 1500);
    inp.select();
  }
  function coinsCounter(el, from, to) {
    var n = from, step = Math.max(1, Math.round((to - from) / 18));
    var t = setInterval(function () { n = Math.min(to, n + step); el.textContent = n; if (n >= to) clearInterval(t); }, 40);
  }
  function soloWin() {
    S.done = true;
    var p = S.p, first = !D.solved[p.id];
    var got = reward(p, S.opened.length, !first || S.repeat);
    D.streak = (D.streak || 0) + 1;
    var sb = streakBonus(D.streak);
    D.solved[p.id] = (D.solved[p.id] || 0) + 1;
    if (first) D.stats.solved++;
    if (D.streak > D.stats.best) D.stats.best = D.streak;
    var before = D.coins, total = got + sb;
    D.coins += total; save();
    SND.play('correct');
    setTimeout(function () { SND.play('dance'); }, 450);
    AV.setMood($('#soloMe'), 'dance');
    confettiAt($('#board'), 140);
    var rows = '<div class="gain"><span>' + E('🔓') + ' За шифровку' + (S.opened.length ? ' (подсказок: ' + S.opened.length + ')' : '') + '</span><b>+' + got + '</b></div>' +
      (sb ? '<div class="gain"><span>' + E('🔥') + ' Серия ×' + D.streak + '</span><b>+' + sb + '</b></div>' : '') +
      (!first ? '<div class="gain"><span>' + E('🔁') + ' Уже разгадывал</span><b>×0,3</b></div>' : '');
    openModal('<div class="stamp">Расшифровано!</div>' + AV.render(D.look, { cls: 'dancing', size: 150 }) +
      '<div class="ans">' + esc(p.a) + '</div>' +
      '<div class="gains">' + rows + '<div class="gain total"><span>Твои монеты</span><b>' + E('🪙') + ' <span id="mc">' + before + '</span></b></div></div>' +
      '<button class="btn btn-lime btn-wide" data-act="next" autofocus>Следующая шифровка</button>' +
      '<button class="link" data-act="cats">К темам</button>', {
        next: function () { closeModal(); nextPuzzle(); },
        cats: function () { go('cats'); }
      });
    var av = $('.modal .av'); if (av) { av.classList.add('dancing'); AV.setMood(av, 'dance'); }
    setTimeout(function () { var mc = $('#mc'); if (mc) { coinsCounter(mc, before, D.coins); SND.play('coin'); SND.play('coin', 0.18); } updateCoins(true); }, 500);
  }
  function confirmGiveUp() {
    openModal('<h2>Сдаёшься?</h2><p>Покажем ответ, но монет не будет' + (D.streak >= 2 ? ', а серия ' + E('🔥') + ' ' + D.streak + ' прервётся' : '') + '.</p>' +
      '<div class="row" style="width:100%"><button class="btn btn-dark" style="flex:1" data-act="close" autofocus>Ещё подумаю</button><button class="btn btn-coral" style="flex:1" data-act="yes">Покажи ответ</button></div>',
      { yes: soloLose }, true);
  }
  function soloLose() {
    S.done = true;
    D.streak = 0; save();
    SND.play('fail');
    var mood = pick(['cry', 'faint', 'melt']);
    AV.setMood($('#soloMe'), mood);
    var p = S.p;
    openModal('<div class="stamp bad">Не разгадано</div>' + AV.render(D.look, { size: 150 }) +
      '<p class="muted small" style="color:#53618A">Правильный ответ:</p><div class="ans">' + esc(p.a) + '</div>' +
      (p.h.filter(function (h) { return h.t === 'desc' || h.t === 'para'; }).slice(0, 1).map(function (h) { return '<p style="color:#33406A">' + T(h.v) + '</p>'; }).join('')) +
      '<button class="btn btn-lime btn-wide" data-act="next" autofocus>Следующая шифровка</button><button class="link" data-act="cats">К темам</button>', {
        next: function () { closeModal(); nextPuzzle(); },
        cats: function () { go('cats'); }
      });
    AV.setMood($('.modal .av'), mood);
  }

  /* ——— Гардероб ——— */
  var TABS = [['color', '🎨', 'Цвет'], ['head', '🎩', 'Шапки'], ['eyes', '🕶️', 'Очки'], ['face', '🥸', 'Лицо'], ['top', '👕', 'Одежда'], ['neck', '🎀', 'Шея'],
    ['hand', '🎈', 'В руки'], ['feet', '👟', 'Обувь'], ['pet', '🐾', 'Питомцы'], ['fx', '✨', 'Эффекты'], ['dance', '💃', 'Танцы']];
  var VB = { color: '0 10 260 280', head: '30 -24 200 170', eyes: '60 76 140 110', face: '56 118 148 140', top: '36 150 188 140', neck: '46 150 168 140',
    hand: '112 10 150 250', feet: '52 206 156 80', pet: '-6 40 272 260', fx: '-10 -30 280 330' };
  var DANCE_ICON = { jump: '🦘', wave: '👋', robot: '🤖', disco: '🪩', twist: '🌀', spin: '🌪️', floss: '〽️', squat: '🪆', heli: '🚁', moon: '🌙' };
  var SH = { tab: 'head', tryId: null };
  function shopLook() { var l = Object.assign({}, D.look); if (SH.tryId != null) l[SH.tab] = SH.tryId; return l; }
  SCREENS.shop = function () {
    setTop({ back: 'home', crumb: 'Гардероб' });
    SH.tryId = null;
    app.innerHTML = '<div class="screen shop"><div class="shop-top">' +
      '<div class="preview"><div class="stage" style="width:100%"><div class="players"><div class="pl me" id="shopAv" style="--plw:190px"></div></div></div>' +
      '<div class="acts"><button class="btn btn-sm btn-aqua" data-act="dance">' + E('💃') + ' Станцевать</button><button class="btn btn-sm btn-dark" data-act="random">' + E('🎲') + ' Случайный образ</button></div></div>' +
      '<div class="col shop-main" style="max-width:none"><div class="tabs" role="tablist" id="tabs">' +
      TABS.map(function (t) { return '<button role="tab" data-act="tab" data-t="' + t[0] + '" aria-selected="' + (SH.tab === t[0]) + '">' + E(t[1]) + ' ' + t[2] + '</button>'; }).join('') +
      '</div><div class="items" id="items"></div></div></div><div class="buybar" id="buybar" hidden></div></div>';
    renderShop();
    acts({
      tab: function (el) { SH.tab = el.getAttribute('data-t'); SH.tryId = null; $$('#tabs button').forEach(function (b) { b.setAttribute('aria-selected', String(b === el)); }); SND.play('click'); renderShop(); },
      item: function (el) { shopPick(el.getAttribute('data-id')); },
      buy: function () { shopBuy(); },
      dance: function () { var a = $('#shopAv'); AV.setMood(a, 'dance', 3400); SND.play('dance'); },
      random: function () {
        AV.SLOTS.forEach(function (s) { var own = AV.C[s].filter(function (it) { return owns(s, it.id); }); D.look[s] = pick(own).id; });
        SH.tryId = null; save(); renderShop(); AV.setMood($('#shopAv'), 'cheer', 1600); SND.play('buy');
      }
    });
  };
  function renderShop() {
    $('#shopAv').innerHTML = AV.render(shopLook());
    var slot = SH.tab;
    $('#items').innerHTML = AV.C[slot].map(function (it) {
      var own = owns(slot, it.id), on = D.look[slot] === it.id, trying = SH.tryId === it.id;
      var thumb;
      if (slot === 'dance') thumb = '<span class="big">' + E(DANCE_ICON[it.id] || '💃') + '</span>';
      else { var l = Object.assign({}, D.look); l[slot] = it.id; thumb = AV.render(l, { vb: VB[slot], cls: 'still' }); }
      return '<button class="item' + (on ? ' on' : '') + (trying ? ' sel' : '') + '" data-act="item" data-id="' + it.id + '" data-r="' + (it.r || 1) + '">' +
        '<span class="thumb">' + thumb + '</span><b>' + esc(it.name) + '</b>' +
        (own ? '<span class="state">' + (on ? 'надето ✓' : 'твоё') + '</span>' : '<span class="price">' + E('🪙') + it.price + '</span>') + '</button>';
    }).join('');
    renderBuybar();
  }
  function renderBuybar() {
    var bar = $('#buybar'), slot = SH.tab;
    if (SH.tryId == null || owns(slot, SH.tryId)) { bar.hidden = true; return; }
    var it = AV.find(slot, SH.tryId), need = it.price - D.coins;
    bar.hidden = false;
    bar.innerHTML = need > 0
      ? '<button class="btn btn-dark" disabled><span>Не хватает ' + need + ' ' + E('🪙') + ' — разгадывай шифровки!</span></button>'
      : '<button class="btn btn-lime" data-act="buy"><span>Купить «' + esc(it.name) + '» за ' + it.price + ' ' + E('🪙') + '</span></button>';
  }
  function shopPick(id) {
    var slot = SH.tab, it = AV.find(slot, id);
    if (!it) return;
    if (owns(slot, id)) {
      D.look[slot] = id; SH.tryId = null; save(); SND.play('click');
      renderShop();
      AV.setMood($('#shopAv'), slot === 'dance' ? 'dance' : 'happy', slot === 'dance' ? 3000 : 1200);
      if (slot === 'dance') SND.play('dance');
    } else {
      SH.tryId = id; SND.play('click');
      renderShop();
      AV.setMood($('#shopAv'), slot === 'dance' ? 'dance' : 'love', slot === 'dance' ? 3000 : 1400);
    }
  }
  function shopBuy() {
    var slot = SH.tab, it = AV.find(slot, SH.tryId);
    if (!it || owns(slot, it.id) || D.coins < it.price) return;
    D.coins -= it.price;
    D.owned.push(slot + ':' + it.id);
    D.look[slot] = it.id;
    SH.tryId = null; save();
    updateCoins(true);
    SND.play('buy');
    renderShop();
    confettiAt($('#shopAv'), 90);
    AV.setMood($('#shopAv'), 'dance', 3000);
    toast(E('🛍️') + ' «' + esc(it.name) + '» теперь твоё!');
  }

  /* ——— Настройки: имя, звук, перенос прогресса ——— */
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
  function exportCode() {
    var j = JSON.stringify({ n: D.name, c: D.coins, o: D.owned, l: D.look, s: Object.keys(D.solved), st: D.stats });
    return btoa(unescape(encodeURIComponent(j))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') + '.' + hash(j + 'шифр');
  }
  function importCode(str) {
    var parts = String(str).trim().split('.');
    if (parts.length !== 2) throw new Error('bad');
    var b = parts[0].replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '=';
    var j = decodeURIComponent(escape(atob(b)));
    if (hash(j + 'шифр') !== parts[1]) throw new Error('bad');
    var o = JSON.parse(j);
    D.name = cleanName(o.n) || D.name; D.coins = Math.max(0, +o.c || 0);
    D.owned = Array.isArray(o.o) ? o.o.filter(function (x) { return typeof x === 'string'; }) : D.owned;
    D.look = o.l || D.look; D.solved = {};
    (o.s || []).forEach(function (id) { if (BY_ID[id]) D.solved[id] = 1; });
    if (o.st) D.stats = o.st;
    normalize(D); save();
  }
  function openSettings() {
    openModal('<h2>Настройки</h2>' +
      '<label class="small" for="setName" style="color:#53618A">Имя агента</label><input class="name" id="setName" maxlength="16" value="' + esc(D.name) + '">' +
      '<button class="btn btn-sm btn-wide" data-act="saveName">Сохранить имя</button>' +
      '<hr style="width:100%;border:0;border-top:2px dashed #CAD5EE;margin:4px 0">' +
      '<h3>Перенос прогресса</h3><p class="small" style="color:#53618A">Монеты, одежда и разгаданные шифровки хранятся в этом браузере. Скопируй код и вставь его на другом устройстве.</p>' +
      '<div class="row" style="width:100%"><button class="btn btn-sm btn-aqua" style="flex:1" data-act="copyCode">' + E('📋') + ' Скопировать код</button></div>' +
      '<textarea id="codeOut" readonly hidden style="width:100%;height:70px;border-radius:12px;border:2px solid #CAD5EE;padding:8px;font-size:11px"></textarea>' +
      '<div class="row" style="width:100%"><input id="codeIn" placeholder="Вставь код сюда" style="flex:1;min-width:0;height:44px;border-radius:12px;border:3px solid var(--ink);padding:0 10px;color:var(--ink)">' +
      '<button class="btn btn-sm" data-act="loadCode">Загрузить</button></div>' +
      '<button class="btn btn-dark btn-wide" data-act="close">Готово</button>', {
        saveName: function () {
          var n = cleanName($('#setName').value);
          if (n === null) { toast(E('🙅') + ' Такое имя не подойдёт — придумай другое'); return; }
          if (!n) return;
          D.name = n; save(); toast(E('✅') + ' Имя сохранено'); closeModal(); go(current === 'home' ? 'home' : current);
        },
        copyCode: function () {
          var code = exportCode(), out = $('#codeOut');
          out.value = code; out.hidden = false;
          try { navigator.clipboard.writeText(code).then(function () { toast(E('📋') + ' Код скопирован'); }, function () { out.select(); }); } catch (e) { out.select(); }
        },
        loadCode: function () {
          try { importCode($('#codeIn').value); toast(E('✅') + ' Прогресс загружен!'); closeModal(); go('home'); }
          catch (e) { toast(E('⚠️') + ' Код не подходит — проверь, что скопировал его целиком'); }
        }
      }, true);
  }

  /* ——— Первое знакомство ——— */
  function onboarding(then) {
    var look = Object.assign({}, D.look), suggested = randomName();
    function html() {
      return '<h2>Привет, агент!</h2><p style="color:#33406A">Добро пожаловать в штаб. Как тебя зовут?</p>' +
        '<div id="obAv">' + AV.render(look, { size: 140 }) + '</div>' +
        '<input class="name" id="obName" maxlength="16" placeholder="' + esc(suggested) + '" autofocus>' +
        '<div class="swatches">' + AV.C.color.filter(function (c) { return !c.price; }).map(function (c) {
          return '<button data-act="col" data-id="' + c.id + '" aria-label="' + c.name + '" aria-pressed="' + (look.color === c.id) + '" style="background:' + c.c + '"></button>';
        }).join('') + '</div>' +
        '<button class="btn btn-lime btn-wide" data-act="ok">Поехали! ' + E('🚀') + '</button>';
    }
    openModal(html(), {
      col: function (el) {
        look.color = el.getAttribute('data-id');
        $('#obAv').innerHTML = AV.render(look, { size: 140 });
        AV.setMood($('#obAv'), 'happy', 900);
        $$('.swatches button').forEach(function (b) { b.setAttribute('aria-pressed', String(b === el)); });
        SND.play('click');
      },
      ok: function () {
        var n = cleanName($('#obName').value);
        if (n === null) { toast(E('🙅') + ' Такое имя не подойдёт — придумай другое'); return; }
        D.name = n || suggested; D.look.color = look.color; save();
        closeModal(); SND.play('correct'); then();
      }
    });
    var inp = $('#obName');
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); MACT.ok(); } });
  }

  /* ——— Игра с друзьями ——— */
  function myCid() {
    var c = null;
    try { c = sessionStorage.getItem('emojishifr.cid'); } catch (e) { c = null; }
    if (!c) { c = uid(8); try { sessionStorage.setItem('emojishifr.cid', c); } catch (e) { /* ок */ } }
    return c;
  }
  function roomPresence() { return { n: D.name, lk: D.look, j: Date.now(), gs: 0, gid: null, r: null, ty: 0 }; }
  var R = null;
  function newRoom(code) {
    return { code: code, st: null, isHost: false, peers: [], els: {}, gid: null, gs: 0, settled: {}, round: null, key: null,
      lastBeat: 0, allAt: 0, lastCount: -1, lastTick: -1, reactAt: 0, typing: 0, hostMissingSince: 0, podiumDone: null };
  }
  SCREENS.friends = function (autoCode) {
    setTop({ back: 'home', crumb: 'Игра с друзьями' });
    app.innerHTML = '<div class="screen"><div class="col">' +
      '<h2>Игра с друзьями</h2><p class="muted">Создай комнату и отправь друзьям код или ссылку. Все увидят персонажей друг друга — в той одежде, что ты выбрал. Кто быстрее расшифрует, тот и победил!</p>' +
      '<div class="card" style="display:flex;flex-direction:column;gap:12px"><h3>' + E('🏠') + ' Новая комната</h3><p style="color:#33406A">Ты станешь ведущим: выберешь темы, число раундов и время.</p>' +
      '<button class="btn btn-coral btn-wide" data-act="create" id="createBtn">' + E('✨') + ' Создать комнату</button></div>' +
      '<div class="card" style="display:flex;flex-direction:column;gap:12px"><h3>' + E('🔑') + ' Войти по коду</h3>' +
      '<form class="code-in" id="joinForm"><input id="codeInput" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="0000" aria-label="Код комнаты" value="' + (autoCode || '') + '">' +
      '<button class="btn" type="submit" id="joinBtn">Войти</button></form></div>' +
      '<p class="small muted" style="text-align:center">Для игры вместе нужен интернет. Связь идёт через бесплатный публичный сервер сообщений — не пиши в имени ничего личного.</p>' +
      '</div></div>';
    acts({ create: createRoom });
    $('#joinForm').addEventListener('submit', function (e) { e.preventDefault(); joinRoom($('#codeInput').value.trim()); });
    if (autoCode) setTimeout(function () { joinRoom(autoCode); }, 300);
  };
  function createRoom() {
    var btn = $('#createBtn'); if (!btn || btn.disabled) return;
    btn.disabled = true; btn.innerHTML = E('📡') + ' Создаю комнату…';
    NET.create({ cid: myCid() }, roomPresence()).then(function (code) {
      R = newRoom(code);
      var set = D.roomSet || { r: 10, t: 75, c: CAT_KEYS.slice(), l: 0 };
      NET.setState({ ph: 'lobby', set: set, gid: null, q: [], i: 0 });
      SND.play('join');
      go('room');
    }).catch(function () {
      toast(E('📡') + ' Не получилось подключиться к серверу игры. Проверь интернет и попробуй ещё раз.', 4000);
      btn.disabled = false; btn.innerHTML = E('✨') + ' Создать комнату';
    });
  }
  function joinRoom(code) {
    if (!/^[1-9]\d{3}$/.test(code)) { toast(E('🔢') + ' Код комнаты — 4 цифры'); return; }
    var btn = $('#joinBtn'); if (btn) { btn.disabled = true; btn.textContent = '…'; }
    NET.join(code, { cid: myCid() }, roomPresence()).then(function () {
      R = newRoom(code); SND.play('join'); go('room');
    }).catch(function (e) {
      toast(e && e.message === 'noroom' ? E('🤷') + ' Комната ' + code + ' не найдена. Проверь код!' : E('📡') + ' Нет связи с сервером игры. Проверь интернет.', 3600);
      if (btn) { btn.disabled = false; btn.textContent = 'Войти'; }
    });
  }
  function me() { return NET.me() || { cid: '' }; }
  function leaveRoom(silentMsg) {
    NET.leave();
    R = null;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ок */ }
    if (!silentMsg) SND.play('click');
    go('friends');
  }
  function askLeave() {
    openModal('<h2>Выйти из комнаты?</h2><p style="color:#33406A">Друзья продолжат без тебя.</p><div class="row" style="width:100%"><button class="btn btn-dark" style="flex:1" data-act="close" autofocus>Остаться</button><button class="btn btn-coral" style="flex:1" data-act="leave">Выйти</button></div>',
      { leave: function () { closeModal(); leaveRoom(); } }, true);
  }

  SCREENS.room = function () {
    if (!R || !NET.code()) return go('friends');
    setTop({ back: askLeave, crumb: 'Комната ' + R.code, extra: '<span class="net on" id="net" title="Связь"><i></i></span>' });
    try { history.replaceState(null, '', location.pathname + location.search + '#room=' + R.code); } catch (e) { /* ок */ }
    app.innerHTML = '<div class="screen"><div class="col" style="max-width:760px">' +
      '<div id="rmTop"></div><div id="rmMain" class="col" style="max-width:none"></div>' +
      '<div class="stage" id="stageBox"><div class="players" id="players"></div></div>' +
      '<div class="reacts" id="reacts">' + REACTS.map(function (e) { return '<button data-act="react" data-e="' + e + '" aria-label="Реакция ' + e + '">' + E(e) + '</button>'; }).join('') + '</div>' +
      '</div></div>';
    R.els = {}; R.key = null;
    acts({
      react: function (el) {
        var now = Date.now(); if (now - R.reactAt < 700) return; R.reactAt = now;
        NET.emit('rx', { e: el.getAttribute('data-e') }); SND.play('react');
      },
      copy: copyLink, share: shareLink,
      set: function (el) { hostSet(el.getAttribute('data-k'), el.getAttribute('data-v')); },
      start: function () { hostStart(); },
      skipReveal: function () { if (R.isHost) hostNext(); },
      again: function () { if (R.isHost) publish({ ph: 'lobby', set: R.st.set, gid: R.st.gid, q: [], i: 0 }); },
      hint: function (el) { openRoomHint(+el.getAttribute('data-i')); },
      leave: function () { leaveRoom(); }
    });
    NET.on('peers', function (list) { if (!R) return; R.peers = list; syncStage(); if (R.st && R.st.ph === 'lobby') renderLobbyInfo(); });
    NET.on('state', function (st) { onState(st); });
    NET.on('event', onEvent);
    NET.on('status', function (on) { var n = $('#net'); if (n) n.classList.toggle('on', on); if (!on) toast(E('📡') + ' Связь пропала, переподключаюсь…', 2000); });
    R.peers = NET.peers();
    onState(NET.state());
    var iv = setInterval(roomTick, 200);
    var onResize = function () { syncStage(); };
    window.addEventListener('resize', onResize);
    cleanups.push(function () {
      clearInterval(iv); window.removeEventListener('resize', onResize);
      NET.on('peers', null); NET.on('state', null); NET.on('event', null); NET.on('status', null);
    });
  };
  function copyLink() {
    var link = location.origin + location.pathname + location.search + '#room=' + R.code;
    try { navigator.clipboard.writeText(link).then(function () { toast(E('🔗') + ' Ссылка скопирована — отправь друзьям!'); }, function () { toast(esc(link), 5000); }); }
    catch (e) { toast(esc(link), 5000); }
  }
  function shareLink() {
    var link = location.origin + location.pathname + location.search + '#room=' + R.code;
    if (navigator.share) navigator.share({ title: 'Эмодзи-шифр', text: 'Заходи в мою комнату в игре «Эмодзи-шифр»! Код: ' + R.code, url: link }).catch(function () { /* отменили */ });
    else copyLink();
  }

  /* Состояние комнаты от ведущего */
  function onState(st) {
    if (!R) return;
    if (!st) {
      if (R.st) { toast(E('🚪') + ' Ведущий закрыл комнату'); leaveRoom(true); }
      return;
    }
    R.st = st;
    R.isHost = st.host === me().cid;
    if (st.gid && st.gid !== R.gid && st.ph !== 'lobby') {
      R.gid = st.gid; R.gs = 0; R.settled = {}; R.round = null; R.podiumDone = null;
      NET.setPresence({ gs: 0, gid: st.gid, r: null });
    }
    if (st.ph === 'play') ensureRound(st);
    var key = st.ph + ':' + (st.ph === 'play' || st.ph === 'reveal' ? st.rid : '') + ':' + (st.gid || '');
    if (key !== R.key) { R.key = key; renderPhase(); }
    else if (st.ph === 'lobby') renderLobbyInfo();
    if (st.ph === 'reveal') settleReveal(st);
    if (st.ph === 'podium') celebrate(st);
    syncStage();
  }
  function publish(o) {
    var st = { ph: o.ph, set: o.set, gid: o.gid || null, q: o.q || [], i: o.i || 0, rid: o.rid || null, st: o.st || 0, du: o.du || 0, rv: o.rv || 0, res: o.res || [], np: o.np || 0 };
    NET.setState(st);
    R.lastBeat = Date.now();
    onState(NET.state());
  }
  function ensureRound(st) {
    if (R.round && R.round.rid === st.rid) return;
    var p = BY_ID[st.q[st.i]];
    if (!p) return;
    R.round = { rid: st.rid, p: p, opened: [], wrong: 0, solved: false, t: 0, shown: false, coins: 0, repeat: !!D.solved[p.id] };
    R.lastCount = -1; R.lastTick = -1;
    NET.setPresence({ r: { id: st.rid, ok: 0, t: 0, h: 0, w: 0 }, ty: 0 });
  }
  function activePeers() { return R.peers.filter(function (p) { return p.cid === me().cid || Date.now() - p._seen < 25000; }); }
  function sortedPeers() { return activePeers().slice().sort(function (a, b) { return (a.j || 0) - (b.j || 0) || (a.cid < b.cid ? -1 : 1); }); }

  function renderPhase() {
    var st = R.st, top = $('#rmTop'), main = $('#rmMain'), stage = $('#stageBox');
    if (!top) return;
    stage.hidden = st.ph === 'podium';
    Object.keys(R.els).forEach(function (cid) { AV.setMood(R.els[cid], 'idle'); });
    if (st.ph === 'lobby') {
      top.innerHTML = '<div class="panel code-box"><p class="muted small">Код комнаты — продиктуй или отправь ссылку</p><div class="code">' + R.code + '</div>' +
        '<div class="row" style="justify-content:center"><button class="btn btn-sm btn-aqua" data-act="copy">' + E('🔗') + ' Скопировать ссылку</button>' +
        (navigator.share ? '<button class="btn btn-sm" data-act="share">' + E('📤') + ' Поделиться</button>' : '') + '</div></div>';
      main.innerHTML = '<div id="lobbyInfo"></div>';
      renderLobbyInfo();
    } else if (st.ph === 'play') {
      var rd = R.round;
      top.innerHTML = roundHeader(st);
      main.innerHTML = boardHTML(rd.p, { reward: reward(rd.p, 0, rd.repeat), hidden: true, count: '3' }) +
        '<div class="hints" id="hints">' + hintsHTML(rd.p, rd.opened, roomCost()) + '</div><div class="hint-list" id="hintList"></div>' +
        '<div id="ansBox">' + answerFormHTML() + '</div>';
      wireRoomAnswer();
    } else if (st.ph === 'reveal') {
      var p = BY_ID[st.q[st.i]];
      top.innerHTML = roundHeader(st);
      main.innerHTML = boardHTML(p, { answer: p.a }) + '<div class="panel"><div class="reveal-list" id="revealList"></div>' +
        '<p class="small muted" style="text-align:center;margin-top:10px" id="nextIn"></p>' +
        (R.isHost ? '<div class="row" style="justify-content:center;margin-top:8px"><button class="btn btn-sm" data-act="skipReveal">Дальше ' + E('⏭️') + '</button></div>' : '') + '</div>';
      renderRevealList(st);
      var tf = $('#timer i'); if (tf) tf.style.transform = 'scaleX(0)';
    } else if (st.ph === 'podium') {
      top.innerHTML = '<h2 style="text-align:center">' + E('🏆') + ' Итоги игры</h2>';
      main.innerHTML = podiumHTML() + '<div class="row" style="justify-content:center">' +
        (R.isHost ? '<button class="btn btn-lime" data-act="again">' + E('🔁') + ' Сыграть ещё</button>' : '<p class="muted small">Ведущий может начать новую игру</p>') +
        '<button class="btn btn-dark" data-act="leave">Выйти</button></div>';
      var spots = $$('.podium .spot');
      spots.forEach(function (s) { AV.setMood(s, s.classList.contains('p1') ? 'dance' : 'clap'); });
    }
  }
  function roundHeader(st) {
    return '<div class="row"><span class="chip">' + E('🎬') + ' Раунд ' + (st.i + 1) + ' из ' + st.q.length + '</span><span class="spacer" style="flex:1"></span>' +
      '<span class="chip" id="myGs">' + E('🪙') + ' ' + R.gs + ' за игру</span></div><div class="timer" id="timer" style="margin-top:10px"><i></i></div>';
  }
  function renderLobbyInfo() {
    var box = $('#lobbyInfo'); if (!box || !R.st) return;
    var set = R.st.set || { r: 10, t: 75, c: CAT_KEYS, l: 0 }, n = activePeers().length;
    var who = n + ' ' + plural(n, 'игрок', 'игрока', 'игроков') + ' в комнате';
    if (R.isHost) {
      var seg = function (k, vals, labels, cur) {
        return '<div class="seg">' + vals.map(function (v, i) { return '<button data-act="set" data-k="' + k + '" data-v="' + v + '" aria-pressed="' + (String(cur) === String(v)) + '">' + labels[i] + '</button>'; }).join('') + '</div>';
      };
      box.innerHTML = '<div class="panel" style="display:flex;flex-direction:column;gap:14px">' +
        '<div class="setting"><span>Раундов</span>' + seg('r', [5, 10, 15], ['5', '10', '15'], set.r) + '</div>' +
        '<div class="setting"><span>Время на шифровку</span>' + seg('t', [45, 75, 120], ['45 с', '75 с', '2 мин'], set.t) + '</div>' +
        '<div class="setting"><span>Сложность</span>' + seg('l', [0, 1, 2, 3], ['Любая', 'Лёгкая', 'Средняя', 'Сложная'], set.l) + '</div>' +
        '<div class="setting"><span>Темы</span><div class="seg">' + CAT_KEYS.map(function (c) {
          return '<button data-act="set" data-k="c" data-v="' + c + '" aria-pressed="' + (set.c.indexOf(c) >= 0) + '">' + E(CATS[c].icon) + ' ' + CATS[c].name + '</button>';
        }).join('') + '</div></div>' +
        '<button class="btn btn-lime btn-wide" data-act="start">' + E('🚀') + ' Начать игру · ' + who + '</button>' +
        (n < 2 ? '<p class="small muted" style="text-align:center">Можно начать и одному, но с друзьями веселее — бонусы за место дают, когда игроков хотя бы двое.</p>' : '') + '</div>';
    } else {
      box.innerHTML = '<div class="panel" style="text-align:center;display:flex;flex-direction:column;gap:8px"><h3>' + E('⏳') + ' Ждём, когда ведущий начнёт игру</h3>' +
        '<p class="muted small">' + who + ' · ' + set.r + ' раундов · ' + set.t + ' с на шифровку · ' + (set.l ? LEVELS[set.l].name.toLowerCase() : 'любая сложность') + '</p>' +
        '<p class="small">' + set.c.map(function (c) { return E(CATS[c].icon) + ' ' + CATS[c].name; }).join(' · ') + '</p>' +
        '<p class="muted small">А пока — пошли друзьям реакцию или загляни в гардероб перед игрой.</p></div>';
    }
  }
  function hostSet(k, v) {
    if (!R.isHost) return;
    var set = JSON.parse(JSON.stringify(R.st.set || { r: 10, t: 75, c: CAT_KEYS, l: 0 }));
    if (k === 'c') {
      var i = set.c.indexOf(v);
      if (i >= 0) { if (set.c.length > 1) set.c.splice(i, 1); } else set.c.push(v);
    } else set[k] = +v;
    D.roomSet = set; save(); SND.play('click');
    publish({ ph: 'lobby', set: set, gid: R.st.gid, q: [], i: 0 });
  }
  function hostStart() {
    if (!R.isHost) return;
    var set = R.st.set;
    var pool = PUZZLES.filter(function (p) { return set.c.indexOf(p.c) >= 0 && (!set.l || p.l === set.l); });
    if (!pool.length) pool = PUZZLES.slice();
    var unseen = pool.filter(function (p) { return !D.solved[p.id]; });
    var q = shuffle(unseen).concat(shuffle(pool.filter(function (p) { return D.solved[p.id]; }))).slice(0, set.r);
    q = shuffle(q).map(function (p) { return p.id; });
    SND.play('go');
    publish({ ph: 'play', set: set, gid: uid(6), q: q, i: 0, rid: uid(6), st: Date.now() + COUNT_MS, du: set.t * 1000 });
  }
  function hostNext() {
    var st = R.st;
    if (st.i + 1 < st.q.length) publish({ ph: 'play', set: st.set, gid: st.gid, q: st.q, i: st.i + 1, rid: uid(6), st: Date.now() + COUNT_MS, du: st.du });
    else publish({ ph: 'podium', set: st.set, gid: st.gid, q: st.q, i: st.i, rid: st.rid });
  }
  function hostReveal() {
    var st = R.st;
    var solvers = activePeers().filter(function (p) { return p.r && p.r.id === st.rid && p.r.ok; })
      .sort(function (a, b) { return (a.r.t - b.r.t) || (a.cid < b.cid ? -1 : 1); });
    var res = solvers.map(function (p, i) { return [p.cid, Math.round(p.r.t), i + 1]; });
    publish({ ph: 'reveal', set: st.set, gid: st.gid, q: st.q, i: st.i, rid: st.rid, st: st.st, du: st.du, rv: Date.now(), res: res, np: activePeers().length });
  }
  function hostTick() {
    var st = R.st, now = Date.now();
    if (!st || !R.isHost) return;
    if (now - R.lastBeat > 4000) { R.lastBeat = now; NET.beat(); }
    if (st.ph === 'play') {
      var act = activePeers();
      var all = act.length > 0 && act.every(function (p) { return p.r && p.r.id === st.rid && p.r.ok; });
      if (all && !R.allAt) R.allAt = now;
      if (!all) R.allAt = 0;
      if (now >= st.st + st.du + 400 || (R.allAt && now - R.allAt > 1500)) { R.allAt = 0; hostReveal(); }
    } else if (st.ph === 'reveal') {
      if (now >= st.rv + REVEAL_MS) hostNext();
    }
  }
  /* Если ведущий пропал — ведущим становится тот, кто пришёл раньше всех */
  function migrationCheck() {
    var st = R.st; if (!st || R.isHost) return;
    var hostHere = R.peers.some(function (p) { return p.cid === st.host && Date.now() - p._seen < 25000; });
    if (hostHere) { R.hostMissingSince = 0; return; }
    if (!R.hostMissingSince) { R.hostMissingSince = Date.now(); return; }
    if (Date.now() - R.hostMissingSince < 6000) return;
    var first = sortedPeers()[0];
    if (first && first.cid === me().cid) {
      R.hostMissingSince = 0;
      var shift = Date.now() - NET.hostNow();
      var o = JSON.parse(JSON.stringify(st));
      if (o.st) o.st += shift; if (o.rv) o.rv += shift;
      toast(E('🎙️') + ' Ведущий ушёл — теперь ведёшь ты!');
      publish(o);
    }
  }
  function roomTick() {
    if (!R || !R.st) return;
    var st = R.st, now = Date.now();
    if (st.ph === 'play' && R.round) {
      var ls = NET.toLocal(st.st), le = NET.toLocal(st.st + st.du), rd = R.round;
      var cnt = $('#count');
      if (now < ls) {
        var n = Math.ceil((ls - now) / 1000);
        if (cnt && n !== R.lastCount) { R.lastCount = n; cnt.innerHTML = '<b>' + n + '</b>'; SND.play('tick'); }
      } else if (!rd.shown) {
        rd.shown = true;
        if (cnt) cnt.remove();
        var row = $('#emoRow'); if (row) row.hidden = false;
        popSounds(rd.p); wobbleLater();
        var inp = $('#ans'); if (inp && !isTouch) inp.focus();
      }
      var bar = $('#timer i');
      if (bar) {
        var left = Math.max(0, le - now), frac = clamp(left / st.du, 0, 1);
        bar.style.transform = 'scaleX(' + (now < ls ? 1 : frac) + ')';
        bar.style.backgroundPosition = (100 - frac * 100) + '% 0';
        $('#timer').classList.toggle('low', left < 10000 && now >= ls);
        var sec = Math.ceil(left / 1000);
        if (now >= ls && sec <= 5 && sec > 0 && sec !== R.lastTick && !rd.solved) { R.lastTick = sec; SND.play('tick'); }
        if (now >= le && !rd.solved && !rd.timeUp) {
          rd.timeUp = true;
          var box = $('#ansBox'); if (box) box.innerHTML = '<div class="panel" style="text-align:center"><b>' + E('⏰') + ' Время вышло!</b><p class="muted small">Сейчас узнаем ответ…</p></div>';
        }
      }
    }
    if (st.ph === 'reveal') {
      var ni = $('#nextIn');
      if (ni) {
        var s = Math.max(0, Math.ceil((NET.toLocal(st.rv + REVEAL_MS) - now) / 1000));
        ni.textContent = st.i + 1 < st.q.length ? 'Следующая шифровка через ' + s + ' с' : 'Итоги через ' + s + ' с';
      }
    }
    hostTick();
    migrationCheck();
  }
  function roomCost() { var rd = R.round; return reward(rd.p, rd.opened.length, rd.repeat) - reward(rd.p, rd.opened.length + 1, rd.repeat); }
  function openRoomHint(i) {
    var rd = R.round; if (!rd || rd.solved || rd.timeUp || !rd.shown || rd.opened.indexOf(i) >= 0) return;
    var before = reward(rd.p, rd.opened.length, rd.repeat);
    rd.opened.push(i);
    $('#hints').innerHTML = hintsHTML(rd.p, rd.opened, roomCost());
    var rn = $('#rewardN'); if (rn) rn.innerHTML = '<s>' + before + '</s> ' + reward(rd.p, rd.opened.length, rd.repeat);
    $('#hintList').insertAdjacentHTML('beforeend', hintCardHTML(rd.p, i));
    SND.play('hint');
    NET.setPresence({ r: { id: rd.rid, ok: 0, t: 0, h: rd.opened.length, w: rd.wrong } });
  }
  function wireRoomAnswer() {
    var f = $('#ansForm'), inp = $('#ans');
    if (!f) return;
    inp.addEventListener('input', function () {
      if (!R.typing) { R.typing = 1; NET.setPresence({ ty: 1 }); }
      clearTimeout(R.typingT);
      R.typingT = setTimeout(function () { R.typing = 0; NET.setPresence({ ty: 0 }); }, 1800);
    });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var st = R.st, rd = R.round;
      if (!rd || rd.solved || rd.timeUp || st.ph !== 'play' || !rd.shown) return;
      var v = inp.value; if (!v.trim()) return;
      var r = MATCH.check(v, rd.p);
      if (r.ok) {
        rd.solved = true;
        rd.t = Math.max(0, Date.now() - NET.toLocal(st.st));
        var first = !D.solved[rd.p.id];
        rd.coins = reward(rd.p, rd.opened.length, !first);
        R.gs += rd.coins; D.coins += rd.coins;
        D.solved[rd.p.id] = (D.solved[rd.p.id] || 0) + 1; if (first) D.stats.solved++;
        save();
        R.typing = 0; clearTimeout(R.typingT);
        NET.setPresence({ r: { id: rd.rid, ok: 1, t: rd.t, h: rd.opened.length, w: rd.wrong }, gs: R.gs, ty: 0 }, true);
        NET.emit('ok', { rid: rd.rid });
        SND.play('correct');
        confettiAt($('#board'), 90);
        var box = $('#ansBox');
        box.innerHTML = '<div class="panel" style="text-align:center"><b style="font-family:var(--display);font-size:18px">' + E('✅') + ' Разгадано за ' + (rd.t / 1000).toFixed(1).replace('.', ',') + ' с!</b>' +
          '<p class="muted small" style="margin-top:4px">+' + rd.coins + ' ' + E('🪙') + ' · ждём остальных…</p></div>';
        flyCoins(box, 5, function () { updateCoins(true); });
        var g = $('#myGs'); if (g) g.innerHTML = E('🪙') + ' ' + R.gs + ' за игру';
      } else {
        rd.wrong++;
        $('#fb').innerHTML = heatHTML(r.heat);
        SND.play(r.heat >= 0.72 ? 'warm' : 'wrong');
        shakeForm();
        NET.setPresence({ r: { id: rd.rid, ok: 0, t: 0, h: rd.opened.length, w: rd.wrong } });
        NET.emit('no', {});
        inp.select();
      }
    });
  }
  function nameOf(cid) { var p = R.peers.filter(function (x) { return x.cid === cid; })[0]; return p ? (p.n || 'Агент') : 'Агент'; }
  function renderRevealList(st) {
    var box = $('#revealList'); if (!box) return;
    var medals = ['🥇', '🥈', '🥉'];
    var rows = (st.res || []).map(function (r) {
      var p = BY_ID[st.q[st.i]], extra = (st.np || 0) >= 2 ? placeBonus(r[2], p) : 0;
      return '<div class="gain"><span>' + E(medals[r[2] - 1] || '✅') + ' ' + esc(nameOf(r[0])) + (r[0] === me().cid ? ' (ты)' : '') + '</span><b>' + (r[1] / 1000).toFixed(1).replace('.', ',') + ' с' +
        (extra ? '<small class="plus">+' + extra + ' ' + E('🪙') + '</small>' : '') + '</b></div>';
    });
    var solved = (st.res || []).map(function (r) { return r[0]; });
    activePeers().forEach(function (p) { if (solved.indexOf(p.cid) < 0) rows.push('<div class="gain miss"><span>' + E('😵') + ' ' + esc(p.n || 'Агент') + (p.cid === me().cid ? ' (ты)' : '') + '</span><b>без ответа</b></div>'); });
    box.innerHTML = rows.length ? rows.join('') : '<p class="muted">Никто не разгадал — бывает! ' + E('🙈') + '</p>';
  }
  function settleReveal(st) {
    if (R.settled[st.rid]) return;
    R.settled[st.rid] = true;
    var p = BY_ID[st.q[st.i]];
    var mine = (st.res || []).filter(function (x) { return x[0] === me().cid; })[0];
    if (mine && (st.np || 0) >= 2) {
      var pb = placeBonus(mine[2], p);
      if (pb > 0) {
        R.gs += pb; D.coins += pb; save();
        setTimeout(function () { updateCoins(true); SND.play('coin'); }, 600);
        toast(E(['🥇', '🥈', '🥉'][mine[2] - 1]) + ' +' + pb + ' ' + E('🪙') + ' за ' + mine[2] + '-е место!');
        NET.setPresence({ gs: R.gs });
      }
    }
    if (mine && mine[2] === 1) { SND.play('fanfare'); confettiAt($('#board'), 160); }
    else if (!mine) SND.play('fail');
    var winners = {};
    (st.res || []).forEach(function (r) { winners[r[0]] = r[2]; });
    activePeers().forEach(function (pp) {
      var el = R.els[pp.cid]; if (!el) return;
      var place = winners[pp.cid];
      if (place === 1) AV.setMood(el, 'dance');
      else if (place) AV.setMood(el, pick(['cheer', 'clap', 'happy']), 5000);
      else AV.setMood(el, pick(['cry', 'faint', 'melt', 'facepalm', 'angry', pp.r && pp.r.w ? 'confused' : 'sleep']), 6500);
    });
    var g = $('#myGs'); if (g) g.innerHTML = E('🪙') + ' ' + R.gs + ' за игру';
  }
  function standings() {
    return activePeers().slice().sort(function (a, b) { return (b.gs || 0) - (a.gs || 0) || (a.j || 0) - (b.j || 0); });
  }
  function podiumHTML() {
    var s = standings(), order = [1, 0, 2], cls = ['p1', 'p2', 'p3'];
    var html = '<div class="podium">' + order.map(function (i) {
      var p = s[i]; if (!p) return '<div class="spot"></div>';
      return '<div class="spot ' + cls[i] + '">' + AV.render(p.lk) + '<div class="nm">' + esc(p.n || 'Агент') + '</div><div class="pts">' + E('🪙') + ' ' + (p.gs || 0) + '</div><div class="block">' + (i + 1) + '</div></div>';
    }).join('') + '</div>';
    if (s.length > 3) html += '<div class="panel reveal-list">' + s.slice(3).map(function (p, i) { return '<div class="gain"><span>' + (i + 4) + '. ' + esc(p.n || 'Агент') + '</span><b>' + E('🪙') + ' ' + (p.gs || 0) + '</b></div>'; }).join('') + '</div>';
    return html;
  }
  function celebrate(st) {
    if (R.podiumDone === st.gid) return;
    R.podiumDone = st.gid;
    var s = standings();
    D.stats.games++;
    if (s.length >= 2 && s[0] && s[0].cid === me().cid) { D.stats.wins++; }
    save();
    SND.play('fanfare');
    setTimeout(function () { confetti(null, null, 200); }, 200);
  }
  function onEvent(ev) {
    if (!R) return;
    var el = R.els[ev.c];
    if (ev.t === 'rx' && REACTS.indexOf(ev.e) >= 0 && el) {
      var f = document.createElement('div');
      f.className = 'float-emo'; f.innerHTML = E(ev.e);
      f.style.left = (el.offsetLeft + el.offsetWidth / 2) + 'px'; f.style.top = (el.offsetTop + 10) + 'px';
      $('#players').appendChild(f);
      setTimeout(function () { f.remove(); }, 1900);
      if (ev.c !== me().cid) SND.play('react');
    } else if (ev.t === 'no' && el) {
      AV.setMood(el, pick(['nope', 'confused', 'facepalm']), 1400);
      bubble(el, '❌', 1300);
    } else if (ev.t === 'ok' && R.st && ev.rid === R.st.rid) {
      if (el) AV.setMood(el, 'cheer', 1800);
      Object.keys(R.els).forEach(function (cid) {
        if (cid === ev.c) return;
        var o = R.els[cid], p = R.peers.filter(function (x) { return x.cid === cid; })[0];
        if (p && p.r && p.r.ok) return;
        if (el && o) {
          var dx = el.offsetLeft - o.offsetLeft;
          AV.look(o, clamp(dx / 30, -5, 5), 0);
          setTimeout(function () { AV.look(o, 0, 0); }, 2200);
        }
        AV.setMood(o, 'shock', 1100);
      });
      if (ev.c !== me().cid) { toast(E('⚡') + ' ' + esc(nameOf(ev.c)) + ' — есть ответ!'); SND.play('join'); }
    }
  }
  function bubble(el, emo, ms) {
    var b = el.querySelector('.bub.tmp'); if (b) b.remove();
    b = document.createElement('div'); b.className = 'bub tmp'; b.innerHTML = E(emo);
    el.appendChild(b);
    setTimeout(function () { b.remove(); }, ms || 1200);
  }
  function statusFor(p) {
    var st = R.st; if (!st) return '';
    if (st.ph === 'play') {
      if (p.r && p.r.id === st.rid && p.r.ok) {
        var solved = activePeers().filter(function (x) { return x.r && x.r.id === st.rid && x.r.ok; }).sort(function (a, b) { return a.r.t - b.r.t; });
        var idx = solved.indexOf(p);
        return E(['🥇', '🥈', '🥉'][idx] || '✅');
      }
      if (p.ty) return E('✍️');
      if (p.r && p.r.id === st.rid && p.r.h) return E('💡') + p.r.h;
      return '';
    }
    if (st.ph === 'reveal') {
      var r = (st.res || []).filter(function (x) { return x[0] === p.cid; })[0];
      return r ? E(['🥇', '🥈', '🥉'][r[2] - 1] || '✅') : E('😵');
    }
    return '';
  }
  function syncStage() {
    var box = $('#players'); if (!box || !R) return;
    var list = sortedPeers(), n = list.length || 1, w = box.clientWidth || 320;
    var perRow = n <= 4 ? n : Math.ceil(n / 2);
    var plw = clamp(Math.floor(w / perRow) - 8, 64, 132);
    var seen = {};
    list.forEach(function (p, i) {
      seen[p.cid] = 1;
      var el = R.els[p.cid];
      if (!el) {
        el = document.createElement('div'); el.className = 'pl'; el.setAttribute('data-cid', p.cid);
        R.els[p.cid] = el; el._look = null;
        if (p.cid !== me().cid && R.st && current === 'room') { SND.play('join'); }
      }
      if (box.children[i] !== el) box.insertBefore(el, box.children[i] || null);
      el.classList.toggle('me', p.cid === me().cid);
      el.style.setProperty('--plw', plw + 'px');
      var lk = JSON.stringify(p.lk || {});
      if (el._look !== lk) {
        el.innerHTML = AV.render(p.lk) + '<div class="tag"></div><div class="sc"></div><div class="bub st" hidden></div>';
        el._look = lk;
        if (R.st && R.st.ph === 'reveal') { /* реакция уже показана */ }
      }
      el.querySelector('.tag').textContent = (p.cid === me().cid ? '★ ' : '') + (p.n || 'Агент');
      el.querySelector('.sc').innerHTML = R.st && R.st.ph !== 'lobby' ? E('🪙') + ' ' + (p.gs || 0) : '';
      var hb = el.querySelector('.host');
      if (R.st && p.cid === R.st.host) { if (!hb) el.insertAdjacentHTML('afterbegin', '<span class="host">ведущий</span>'); } else if (hb) hb.remove();
      var bub = el.querySelector('.bub.st'), s = statusFor(p);
      if (s) { if (bub.innerHTML !== s) { bub.innerHTML = s; bub.hidden = false; } } else bub.hidden = true;
      var av = el.querySelector('.av');
      if (R.st && R.st.ph === 'play' && av) {
        var mood = av.getAttribute('data-mood');
        if (p.ty && (!mood || mood === 'idle')) AV.setMood(el, 'typing');
        else if (!p.ty && mood === 'typing') AV.setMood(el, 'idle');
      }
    });
    Object.keys(R.els).forEach(function (cid) { if (!seen[cid]) { R.els[cid].remove(); delete R.els[cid]; } });
  }

  /* ——— Запуск ——— */
  window.addEventListener('storage', function (e) { if (e.key === KEY) { D = load(); updateCoins(); } });
  window.addEventListener('pagehide', function () { if (R) NET.leave(); });
  D = load();
  function route() {
    var m = /room=([1-9]\d{3})/.exec(location.hash);
    if (m) go('friends', m[1]); else go('home');
  }
  window.addEventListener('hashchange', function () {
    var m = /room=([1-9]\d{3})/.exec(location.hash);
    if (m && D.name && (!R || R.code !== m[1])) { if (R) NET.leave(); R = null; go('friends', m[1]); }
  });
  if (!D.name) { go('home'); onboarding(route); } else route();
  window.__game = { D: function () { return D; }, go: go, S: function () { return S; }, R: function () { return R; }, save: save };
})();
