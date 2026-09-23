/* Эмодзи-шифр — персонаж «Шифрик»: оригинальный SVG-персонаж с одеждой, танцами и реакциями.
   Все координаты — в системе viewBox 0 0 260 290 (голова/туловище одно целое). */
(function () {
  'use strict';
  var INK = '#16203F';
  var seq = 0;

  function E(emo, x, y, w, extra) {
    return '<image href="' + EMO.src(emo) + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + w + '" ' + (extra || '') + '/>';
  }
  function shade(hex, k) { // k<0 — темнее, k>0 — светлее
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function f(c) { return Math.max(0, Math.min(255, Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k))); }
    return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }

  /* ——— Каталог: цвет, шапки, очки, лицо, одежда, шея, в руке, обувь, питомец, эффект, танец ——— */
  var BODY = 'M130,74 C172,74 192,118 192,178 C192,228 170,254 130,254 C90,254 68,228 68,178 C68,118 88,74 130,74 Z';
  var SHIRT = 'M30,198 L106,198 Q130,214 154,198 L230,198 L230,234 Q130,250 30,234 Z';
  var SUIT = 'M30,198 L106,198 Q130,214 154,198 L230,198 L230,300 L30,300 Z';
  function teeColor(c) { var n = parseInt(c.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (b > r && b > g - 20) || (r > 200 && g < 150) ? '#FFB23F' : '#3F7BFF'; }

  var C = {};
  C.color = [
    { id: 'sun', name: 'Солнышко', price: 0, c: '#FFD23F' },
    { id: 'mint', name: 'Мятный', price: 0, c: '#5CE1B9' },
    { id: 'sky', name: 'Небесный', price: 0, c: '#62C9FF' },
    { id: 'coral', name: 'Коралл', price: 0, c: '#FF7C6E' },
    { id: 'grape', name: 'Виноград', price: 120, c: '#A58BFF', r: 2 },
    { id: 'bubble', name: 'Жвачка', price: 120, c: '#FF8ED4', r: 2 },
    { id: 'lime', name: 'Лайм', price: 120, c: '#B8EE4E', r: 2 },
    { id: 'orange', name: 'Апельсин', price: 120, c: '#FFA53D', r: 2 },
    { id: 'snow', name: 'Снежок', price: 160, c: '#F3F6FF', r: 2 },
    { id: 'cocoa', name: 'Какао', price: 160, c: '#B9855E', r: 2 },
    { id: 'night', name: 'Полночь', price: 220, c: '#4C5BB8', r: 3 },
    { id: 'ruby', name: 'Рубин', price: 220, c: '#E8405F', r: 3 },
    { id: 'gold', name: 'Золото', price: 550, c: '#FFD34D', g: ['#FFF1A6', '#FFC21A', '#E09A00'], r: 4 },
    { id: 'rainbow', name: 'Радуга', price: 650, c: '#FF8ED4', g: ['#FF6B6B', '#FFD23F', '#5CE1B9', '#62C9FF', '#A58BFF'], r: 4 },
    { id: 'galaxy', name: 'Галактика', price: 750, c: '#3C3A8F', g: ['#2A2470', '#5B3FB8', '#1B6FB8'], stars: true, r: 4 }
  ];

  C.head = [
    { id: 'none', name: 'Без шапки', price: 0 },
    { id: 'cap', name: 'Кепка', price: 60, r: 1, svg: function () { return E('🧢', 92, 22, 80); } },
    { id: 'party', name: 'Колпак', price: 60, r: 1, svg: function () {
      return '<g transform="rotate(-10 130 84)"><path d="M104,84 L156,84 L130,12 Z" fill="#FF5A8A" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M113,62 L147,62 M121,40 L139,40" stroke="#FFD23F" stroke-width="6" stroke-linecap="round"/>' +
        '<circle cx="130" cy="12" r="9" fill="#62C9FF" stroke="' + INK + '" stroke-width="3.5"/></g>'; } },
    { id: 'beanie', name: 'Шапка с помпоном', price: 80, r: 1, svg: function () {
      return '<path d="M88,96 C86,50 174,50 172,96 Z" fill="#FF6B6B" stroke="' + INK + '" stroke-width="4"/>' +
        '<path d="M108,62 L106,92 M130,56 L130,92 M152,62 L154,92" stroke="#E04848" stroke-width="4"/>' +
        '<rect x="84" y="86" width="92" height="16" rx="8" fill="#FFF3E8" stroke="' + INK + '" stroke-width="4"/>' +
        '<circle cx="130" cy="44" r="13" fill="#FFF3E8" stroke="' + INK + '" stroke-width="4"/>'; } },
    { id: 'ushanka', name: 'Ушанка', price: 140, r: 2, svg: function () {
      return '<rect x="72" y="92" width="22" height="50" rx="11" fill="#8C6B55" stroke="' + INK + '" stroke-width="4"/>' +
        '<rect x="166" y="92" width="22" height="50" rx="11" fill="#8C6B55" stroke="' + INK + '" stroke-width="4"/>' +
        '<path d="M84,98 C82,44 178,44 176,98 Z" fill="#9C7A62" stroke="' + INK + '" stroke-width="4"/>' +
        '<path d="M80,96 Q130,74 180,96 L180,106 Q130,86 80,106 Z" fill="#6E5140" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M104,64 q6,-6 12,0 M130,58 q6,-6 12,0 M150,68 q6,-6 12,0" stroke="#6E5140" stroke-width="3" fill="none"/>'; } },
    { id: 'chef', name: 'Колпак повара', price: 110, r: 2, svg: function () {
      return '<g fill="#FFFFFF" stroke="' + INK + '" stroke-width="4"><circle cx="106" cy="60" r="19"/><circle cx="154" cy="60" r="19"/><circle cx="130" cy="44" r="24"/>' +
        '<rect x="98" y="66" width="64" height="26" rx="6"/></g><path d="M100,70 L160,70" stroke="#FFFFFF" stroke-width="6"/>'; } },
    { id: 'cowboy', name: 'Ковбойская шляпа', price: 150, r: 2, svg: function () {
      return '<path d="M62,88 Q130,112 198,88 Q196,100 130,106 Q64,100 62,88 Z" fill="#B7773F" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M98,92 C96,52 112,42 130,56 C148,42 164,52 162,92 Q130,100 98,92 Z" fill="#C9884A" stroke="' + INK + '" stroke-width="4"/>' +
        '<path d="M99,84 Q130,92 161,84" stroke="#7A4A22" stroke-width="6" fill="none"/>'; } },
    { id: 'bunny', name: 'Заячьи ушки', price: 120, r: 2, svg: function () {
      return '<g class="wig"><g transform="rotate(-14 110 70)"><ellipse cx="110" cy="40" rx="13" ry="34" fill="#FFFFFF" stroke="' + INK + '" stroke-width="4"/><ellipse cx="110" cy="42" rx="6" ry="24" fill="#FFB3CF"/></g>' +
        '<g transform="rotate(14 150 70)"><ellipse cx="150" cy="40" rx="13" ry="34" fill="#FFFFFF" stroke="' + INK + '" stroke-width="4"/><ellipse cx="150" cy="42" rx="6" ry="24" fill="#FFB3CF"/></g></g>'; } },
    { id: 'cat', name: 'Кошачьи ушки', price: 120, r: 2, svg: function (col) {
      return '<path d="M90,98 L98,44 L126,80 Z" fill="' + col + '" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/><path d="M98,86 L101,58 L116,78 Z" fill="#FFB3CF"/>' +
        '<path d="M170,98 L162,44 L134,80 Z" fill="' + col + '" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/><path d="M162,86 L159,58 L144,78 Z" fill="#FFB3CF"/>'; } },
    { id: 'phones', name: 'Наушники', price: 160, r: 2, svg: function () {
      return '<path d="M70,140 C68,52 192,52 190,140" stroke="#2B2F4A" stroke-width="10" fill="none" stroke-linecap="round"/>' +
        '<rect x="54" y="118" width="26" height="44" rx="12" fill="#FF5A5F" stroke="' + INK + '" stroke-width="4"/>' +
        '<rect x="180" y="118" width="26" height="44" rx="12" fill="#FF5A5F" stroke="' + INK + '" stroke-width="4"/>'; } },
    { id: 'tophat', name: 'Цилиндр', price: 180, r: 2, svg: function () { return E('🎩', 86, 2, 88); } },
    { id: 'grad', name: 'Шапочка выпускника', price: 180, r: 2, svg: function () { return E('🎓', 88, 14, 84); } },
    { id: 'pirate', name: 'Пиратская шляпа', price: 200, r: 3, svg: function () {
      return '<path d="M70,94 Q130,20 190,94 Q130,76 70,94 Z" fill="#23263A" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M80,90 Q130,70 180,90" stroke="#FFD23F" stroke-width="4" fill="none"/>' + E('☠️', 116, 48, 28); } },
    { id: 'viking', name: 'Шлем викинга', price: 220, r: 3, svg: function () {
      return '<path d="M98,82 Q70,74 72,36 Q86,60 106,70 Z" fill="#F4E9D0" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M162,82 Q190,74 188,36 Q174,60 154,70 Z" fill="#F4E9D0" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M90,96 C88,50 172,50 170,96 Z" fill="#A9B4C2" stroke="' + INK + '" stroke-width="4"/>' +
        '<rect x="86" y="88" width="88" height="14" rx="7" fill="#C98A3A" stroke="' + INK + '" stroke-width="4"/>' +
        '<circle cx="108" cy="95" r="2.5" fill="' + INK + '"/><circle cx="130" cy="95" r="2.5" fill="' + INK + '"/><circle cx="152" cy="95" r="2.5" fill="' + INK + '"/>'; } },
    { id: 'wizard', name: 'Колпак волшебника', price: 260, r: 3, svg: function () {
      return '<path d="M94,88 Q124,58 128,-2 Q150,44 168,88 Z" fill="#4B5BD6" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<ellipse cx="130" cy="88" rx="48" ry="10" fill="#3A48B8" stroke="' + INK + '" stroke-width="4"/>' +
        E('⭐', 114, 50, 16, 'class="tw"') + E('⭐', 136, 26, 13, 'class="tw d2"') + E('✨', 140, 60, 14, 'class="tw d3"'); } },
    { id: 'propeller', name: 'Кепка с пропеллером', price: 240, r: 3, svg: function () {
      return '<path d="M94,92 C92,56 168,56 166,92 Z" fill="#FF5A5F" stroke="' + INK + '" stroke-width="4"/>' +
        '<path d="M130,58 C120,60 112,72 110,92 L130,92 Z" fill="#FFD23F"/><path d="M130,58 C140,60 148,72 150,92 L130,92 Z" fill="#62C9FF"/>' +
        '<path d="M94,92 C92,56 168,56 166,92 Z" fill="none" stroke="' + INK + '" stroke-width="4"/>' +
        '<rect x="127" y="44" width="6" height="14" fill="' + INK + '"/>' +
        '<g class="prop"><ellipse cx="130" cy="44" rx="30" ry="6" fill="#5CE1B9" stroke="' + INK + '" stroke-width="3"/></g>' +
        '<circle cx="130" cy="44" r="5" fill="#FFD23F" stroke="' + INK + '" stroke-width="2.5"/>'; } },
    { id: 'santa', name: 'Шапка Деда Мороза', price: 200, r: 3, svg: function () {
      return '<path d="M92,94 Q110,36 150,30 Q180,34 186,64 L174,70 Q164,52 152,54 Q160,74 170,94 Z" fill="#E53935" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<rect x="84" y="86" width="92" height="18" rx="9" fill="#FFFFFF" stroke="' + INK + '" stroke-width="4"/>' +
        '<circle cx="182" cy="70" r="11" fill="#FFFFFF" stroke="' + INK + '" stroke-width="4"/>'; } },
    { id: 'kokoshnik', name: 'Кокошник', price: 300, r: 3, svg: function () {
      return '<path d="M78,100 Q76,30 130,22 Q184,30 182,100 Q130,80 78,100 Z" fill="#E0314B" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M90,92 Q90,42 130,34 Q170,42 170,92" fill="none" stroke="#FFD23F" stroke-width="5"/>' +
        '<g fill="#FFFFFF" stroke="' + INK + '" stroke-width="1.5"><circle cx="92" cy="96" r="4"/><circle cx="104" cy="92" r="4"/><circle cx="117" cy="89" r="4"/><circle cx="130" cy="88" r="4"/><circle cx="143" cy="89" r="4"/><circle cx="156" cy="92" r="4"/><circle cx="168" cy="96" r="4"/></g>' +
        E('💎', 118, 40, 24, 'class="tw"'); } },
    { id: 'unicorn', name: 'Рог единорога', price: 420, r: 4, svg: function () {
      return '<path d="M118,82 L130,4 L142,82 Z" fill="#FFE27A" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M121,66 L139,58 M124,46 L137,40 M127,28 L134,24" stroke="#F2A93B" stroke-width="3.5" stroke-linecap="round"/>' +
        E('🌸', 96, 70, 24) + E('🌼', 142, 70, 24) + E('✨', 146, 20, 18, 'class="tw"'); } },
    { id: 'halo', name: 'Нимб', price: 380, r: 4, svg: function () {
      return '<g class="halo"><ellipse cx="130" cy="44" rx="36" ry="10" fill="none" stroke="#FFF4B0" stroke-width="12" opacity=".55"/>' +
        '<ellipse cx="130" cy="44" rx="36" ry="10" fill="none" stroke="#FFC933" stroke-width="6"/></g>'; } },
    { id: 'crown', name: 'Корона', price: 700, r: 4, svg: function () { return E('👑', 96, 26, 68) + E('✨', 160, 30, 16, 'class="tw"'); } },
    { id: 'devil', name: 'Рожки', price: 150, r: 2, svg: function () {
      return '<path d="M96,90 Q88,56 110,58 Q102,70 110,86 Z" fill="#E8405F" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<path d="M164,90 Q172,56 150,58 Q158,70 150,86 Z" fill="#E8405F" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>'; } },
    { id: 'alien', name: 'Антенки', price: 130, r: 2, svg: function () {
      return '<g class="wig"><path d="M114,80 Q104,56 98,34" stroke="' + INK + '" stroke-width="4" fill="none"/><path d="M146,80 Q156,56 162,34" stroke="' + INK + '" stroke-width="4" fill="none"/>' +
        '<circle cx="98" cy="32" r="9" fill="#B8EE4E" stroke="' + INK + '" stroke-width="3.5"/><circle cx="162" cy="32" r="9" fill="#FF8ED4" stroke="' + INK + '" stroke-width="3.5"/></g>'; } },
    { id: 'mohawk', name: 'Ирокез', price: 170, r: 2, svg: function () {
      return '<path d="M104,90 L108,40 L120,78 L128,24 L138,78 L152,40 L156,90 Z" fill="#FF3D7F" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>'; } },
    { id: 'bow', name: 'Бантик', price: 70, r: 1, svg: function () { return E('🎀', 146, 64, 44); } },
    { id: 'flower', name: 'Цветок', price: 50, r: 1, svg: function () { return E('🌻', 150, 66, 38); } },
    { id: 'wreath', name: 'Венок', price: 190, r: 3, svg: function () {
      return E('🌼', 86, 72, 26) + E('🌸', 104, 58, 26) + E('🌼', 122, 52, 26) + E('🌸', 140, 58, 26) + E('🌼', 156, 72, 26); } }
  ];

  C.eyes = [
    { id: 'none', name: 'Без очков', price: 0 },
    { id: 'shades', name: 'Тёмные очки', price: 90, r: 1, svg: function () { return E('🕶️', 76, 84, 108); } },
    { id: 'specs', name: 'Очки', price: 60, r: 1, svg: function () { return E('👓', 78, 86, 104); } },
    { id: 'nerd', name: 'Круглые очки', price: 80, r: 1, svg: function () {
      return '<g fill="rgba(255,255,255,.22)" stroke="#2B2F4A" stroke-width="6"><circle cx="110" cy="138" r="21"/><circle cx="150" cy="138" r="21"/></g>' +
        '<path d="M126,134 Q130,128 134,134" stroke="#2B2F4A" stroke-width="5" fill="none"/>'; } },
    { id: 'hearts', name: 'Очки-сердечки', price: 150, r: 2, svg: function () {
      function h(cx, cy) { return 'M' + cx + ',' + (cy + 15) + ' C' + (cx - 26) + ',' + (cy - 2) + ' ' + (cx - 14) + ',' + (cy - 24) + ' ' + cx + ',' + (cy - 9) + ' C' + (cx + 14) + ',' + (cy - 24) + ' ' + (cx + 26) + ',' + (cy - 2) + ' ' + cx + ',' + (cy + 15) + ' Z'; }
      return '<path d="' + h(108, 138) + '" fill="#FF4F8B" stroke="' + INK + '" stroke-width="3.5"/><path d="' + h(152, 138) + '" fill="#FF4F8B" stroke="' + INK + '" stroke-width="3.5"/>' +
        '<path d="M126,134 L134,134" stroke="' + INK + '" stroke-width="4"/><circle cx="100" cy="130" r="3.5" fill="#fff" opacity=".8"/><circle cx="144" cy="130" r="3.5" fill="#fff" opacity=".8"/>'; } },
    { id: 'stars', name: 'Очки-звёзды', price: 150, r: 2, svg: function () {
      function st(cx, cy, r) { var p = []; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.48 : r; p.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1)); } return p.join(' '); }
      return '<polygon points="' + st(108, 140, 24) + '" fill="#FFD23F" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>' +
        '<polygon points="' + st(152, 140, 24) + '" fill="#FFD23F" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/><path d="M126,136 L134,136" stroke="' + INK + '" stroke-width="4"/>'; } },
    { id: 'glasses3d', name: '3D-очки', price: 120, r: 2, svg: function () {
      return '<path d="M84,122 L176,122 L174,152 L136,152 L130,140 L124,152 L86,152 Z" fill="#FFFFFF" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
        '<rect x="92" y="127" width="30" height="20" rx="4" fill="#FF3B3B" opacity=".8"/><rect x="138" y="127" width="30" height="20" rx="4" fill="#22D3E6" opacity=".8"/>'; } },
    { id: 'goggles', name: 'Лыжная маска', price: 140, r: 2, svg: function () { return E('🥽', 76, 84, 108); } },
    { id: 'monocle', name: 'Монокль', price: 170, r: 2, svg: function () {
      return '<circle cx="150" cy="138" r="21" fill="rgba(255,255,255,.2)" stroke="#E0A100" stroke-width="5"/>' +
        '<path d="M168,150 Q182,178 176,214" stroke="#E0A100" stroke-width="3" fill="none" stroke-dasharray="4 3"/>'; } },
    { id: 'patch', name: 'Пиратская повязка', price: 110, r: 2, svg: function () {
      return '<path d="M72,118 L188,150" stroke="#23263A" stroke-width="5"/><ellipse cx="110" cy="138" rx="18" ry="19" fill="#23263A" stroke="' + INK + '" stroke-width="3"/>'; } },
    { id: 'mask', name: 'Маска героя', price: 200, r: 3, svg: function () {
      return '<path fill-rule="evenodd" d="M74,126 Q130,104 186,126 L188,154 Q130,168 72,154 Z M124,138 a14,15 0 1 0 -28,0 a14,15 0 1 0 28,0 Z M164,138 a14,15 0 1 0 -28,0 a14,15 0 1 0 28,0 Z" fill="#2E86FF" stroke="' + INK + '" stroke-width="3.5"/>' +
        '<path d="M186,128 L204,120 M188,150 L206,156" stroke="#2E86FF" stroke-width="6" stroke-linecap="round"/>'; } }
  ];

  C.face = [
    { id: 'none', name: 'Ничего', price: 0 },
    { id: 'freckles', name: 'Веснушки', price: 40, r: 1, svg: function () {
      return '<g fill="#C47F55" opacity=".8"><circle cx="90" cy="160" r="2.4"/><circle cx="98" cy="165" r="2.4"/><circle cx="86" cy="168" r="2.4"/><circle cx="170" cy="160" r="2.4"/><circle cx="162" cy="165" r="2.4"/><circle cx="174" cy="168" r="2.4"/></g>'; } },
    { id: 'whiskers', name: 'Усики-вибриссы', price: 60, r: 1, svg: function () {
      return '<g stroke="' + INK + '" stroke-width="2.5" stroke-linecap="round"><path d="M96,164 L64,158 M96,170 L62,172 M96,176 L66,186"/><path d="M164,164 L196,158 M164,170 L198,172 M164,176 L194,186"/></g>'; } },
    { id: 'mustache', name: 'Усы', price: 110, r: 2, svg: function () {
      return '<path d="M130,160 C118,148 98,150 92,166 C104,160 116,166 130,168 C144,166 156,160 168,166 C162,150 142,148 130,160 Z" fill="#3B2A20" stroke="' + INK + '" stroke-width="2"/>'; } },
    { id: 'nose', name: 'Клоунский нос', price: 90, r: 1, svg: function () {
      return '<circle cx="130" cy="158" r="11" fill="#FF3B3B" stroke="' + INK + '" stroke-width="3"/><circle cx="126" cy="154" r="3.5" fill="#fff" opacity=".85"/>'; } },
    { id: 'bandage', name: 'Пластырь', price: 50, r: 1, svg: function () {
      return '<g transform="rotate(-28 166 164)"><rect x="150" y="158" width="32" height="12" rx="5" fill="#F2C9A0" stroke="' + INK + '" stroke-width="2.5"/><rect x="161" y="158" width="10" height="12" fill="#E8B083"/></g>'; } },
    { id: 'beard', name: 'Борода мудреца', price: 240, r: 3, svg: function () {
      return '<path d="M92,184 Q90,236 130,246 Q170,236 168,184 Q150,200 130,196 Q110,200 92,184 Z" fill="#F4F4F4" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>' +
        '<path d="M112,210 Q116,226 124,234 M146,210 Q144,226 136,234" stroke="#CDD3DD" stroke-width="3" fill="none"/>'; } },
    { id: 'gum', name: 'Жвачка-пузырь', price: 160, r: 2, svg: function () {
      return '<g class="gum"><circle cx="130" cy="184" r="17" fill="#FF8ED4" stroke="#E0569D" stroke-width="3" opacity=".95"/><circle cx="124" cy="178" r="4" fill="#fff" opacity=".8"/></g>'; } }
  ];

  C.top = [
    { id: 'none', name: 'Без одежды', price: 0 },
    { id: 'tee', name: 'Футболка', price: 0, sl: teeColor, svg: function (c) { return shirt(teeColor(c)); } },
    { id: 'tee_star', name: 'Футболка со звездой', price: 60, r: 1, sl: '#62C9FF', svg: function () { return shirt('#62C9FF') + E('⭐', 116, 204, 28); } },
    { id: 'tee_cat', name: 'Футболка с котиком', price: 80, r: 1, sl: '#FF8ED4', svg: function () { return shirt('#FF8ED4') + E('🐱', 115, 203, 30); } },
    { id: 'tee_bolt', name: 'Футболка с молнией', price: 80, r: 1, sl: '#23263A', svg: function () { return shirt('#23263A') + E('⚡', 115, 203, 30); } },
    { id: 'stripes', name: 'Тельняшка', price: 100, r: 1, sl: '#1E3A8A', svg: function () {
      var s = shirt('#FFFFFF'); [206, 218, 230].forEach(function (y) { s += '<rect x="30" y="' + y + '" width="200" height="6" fill="#1E3A8A"/>'; }); return s + hem(); } },
    { id: 'hoodie', name: 'Худи', price: 140, r: 2, sl: '#FF7A45', svg: function () {
      return shirt('#FF7A45', true) + '<path d="M104,236 L156,236 L166,262 L94,262 Z" fill="#E8612E" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="M116,210 L114,232 M144,210 L146,232" stroke="#FFF3E8" stroke-width="4" stroke-linecap="round"/><circle cx="114" cy="234" r="3.5" fill="#FFF3E8"/><circle cx="146" cy="234" r="3.5" fill="#FFF3E8"/>'; } },
    { id: 'sweater', name: 'Свитер с оленями', price: 160, r: 2, sl: '#2FAE7A', svg: function () {
      return shirt('#2FAE7A', true) + '<path d="M40,226 L52,216 L64,226 L76,216 L88,226 L100,216 L112,226 L124,216 L136,226 L148,216 L160,226 L172,216 L184,226 L196,216 L208,226 L220,216" stroke="#FFFFFF" stroke-width="5" fill="none"/>' +
        E('🦌', 114, 232, 30); } },
    { id: 'overalls', name: 'Комбинезон', price: 150, r: 2, sl: '#FFD23F', svg: function () {
      return shirt('#FFD23F') + '<path d="M100,222 L160,222 L160,300 L100,300 Z" fill="#3D6FD6" stroke="' + INK + '" stroke-width="3"/>' +
        '<path d="M100,224 L86,200 M160,224 L174,200" stroke="#3D6FD6" stroke-width="9" stroke-linecap="round"/>' +
        '<rect x="30" y="252" width="200" height="60" fill="#3D6FD6"/><circle cx="106" cy="230" r="4" fill="#FFD23F" stroke="' + INK + '" stroke-width="2"/><circle cx="154" cy="230" r="4" fill="#FFD23F" stroke="' + INK + '" stroke-width="2"/>' +
        '<rect x="116" y="232" width="28" height="16" rx="4" fill="#2E5BB8" stroke="' + INK + '" stroke-width="2.5"/>'; } },
    { id: 'jersey', name: 'Футбольная форма', price: 170, r: 2, sl: '#E8405F', svg: function () {
      return shirt('#E8405F', true) + '<path d="M30,246 L230,246" stroke="#FFFFFF" stroke-width="6"/>' +
        '<text x="130" y="238" text-anchor="middle" font-family="Unbounded, Nunito, sans-serif" font-weight="900" font-size="30" fill="#FFFFFF" stroke="' + INK + '" stroke-width="2.5" paint-order="stroke">10</text>'; } },
    { id: 'hawaii', name: 'Гавайская рубашка', price: 180, r: 2, sl: '#20C7B8', svg: function () {
      return shirt('#20C7B8') + E('🌺', 82, 206, 22) + E('🌺', 150, 212, 22) + E('🍍', 106, 214, 20) + E('🌺', 172, 200, 18) +
        '<path d="M130,210 L130,244" stroke="' + INK + '" stroke-width="2.5"/>' + hem(); } },
    { id: 'kimono', name: 'Кимоно', price: 190, r: 2, sl: '#FFFFFF', svg: function () {
      return shirt('#FFFFFF', true) + '<path d="M108,202 L142,244 M152,202 L128,232" stroke="' + INK + '" stroke-width="3.5"/>' +
        '<rect x="30" y="240" width="200" height="12" fill="#23263A"/><path d="M142,252 L150,272 M150,252 L160,270" stroke="#23263A" stroke-width="6" stroke-linecap="round"/>'; } },
    { id: 'pajama', name: 'Пижама', price: 110, r: 1, sl: '#9FD8FF', svg: function () {
      return shirt('#9FD8FF', true) + E('⭐', 92, 216, 16) + E('🌙', 146, 222, 18) + E('⭐', 112, 244, 14) + E('⭐', 160, 250, 16) +
        '<g fill="#FFFFFF" stroke="' + INK + '" stroke-width="2"><circle cx="130" cy="214" r="3.5"/><circle cx="130" cy="230" r="3.5"/><circle cx="130" cy="246" r="3.5"/></g>'; } },
    { id: 'dress', name: 'Платье в горошек', price: 170, r: 2, sl: '#FF5A8A', svg: function () {
      var s = shirt('#FF5A8A', true);
      [[92, 214], [120, 222], [150, 214], [170, 234], [104, 240], [136, 244], [84, 262], [118, 266], [152, 268], [182, 258]].forEach(function (p) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="#FFFFFF"/>'; });
      return s + '<path d="M30,236 Q130,252 230,236" stroke="#FFD23F" stroke-width="6" fill="none"/>'; } },
    { id: 'tux', name: 'Смокинг', price: 260, r: 3, sl: '#23263A', svg: function () {
      return shirt('#23263A', true) + '<path d="M112,200 L130,252 L148,200 Z" fill="#FFFFFF" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
        '<circle cx="130" cy="226" r="3" fill="' + INK + '"/><circle cx="130" cy="240" r="3" fill="' + INK + '"/>' +
        '<path d="M130,210 L114,202 L114,218 Z M130,210 L146,202 L146,218 Z" fill="#E53935" stroke="' + INK + '" stroke-width="2.5" stroke-linejoin="round"/>'; } },
    { id: 'hero', name: 'Костюм супергероя', price: 300, r: 3, sl: '#2E86FF', svg: function () {
      return shirt('#2E86FF', true) + '<rect x="30" y="250" width="200" height="12" fill="#FFD23F" stroke="' + INK + '" stroke-width="2.5"/>' +
        '<circle cx="130" cy="228" r="17" fill="#FFD23F" stroke="' + INK + '" stroke-width="3"/>' + E('⚡', 117, 215, 26); } },
    { id: 'space', name: 'Скафандр', price: 340, r: 3, sl: '#F1F4FA', svg: function () {
      return shirt('#F1F4FA', true) + '<rect x="110" y="222" width="40" height="26" rx="5" fill="#C9D2E0" stroke="' + INK + '" stroke-width="3"/>' +
        '<circle cx="120" cy="235" r="4" fill="#FF5A5F"/><circle cx="132" cy="235" r="4" fill="#5CE1B9"/><circle cx="143" cy="235" r="4" fill="#FFD23F"/>' + E('🚀', 76, 214, 22); } },
    { id: 'goldsuit', name: 'Золотой пиджак', price: 480, r: 4, sl: '#F2B705', svg: function () {
      return shirt('#F2B705', true) + '<path d="M112,200 L130,250 L148,200 Z" fill="#23263A" stroke="' + INK + '" stroke-width="3"/>' +
        E('✨', 80, 216, 20, 'class="tw"') + E('✨', 160, 236, 18, 'class="tw d2"') + '<circle cx="130" cy="230" r="3.5" fill="#FFD23F"/>'; } }
  ];
  function hem() { return '<path d="M30,234 Q130,250 230,234" fill="none" stroke="' + INK + '" stroke-width="3.5"/>'; }
  function shirt(fill, full) {
    return '<path d="' + (full ? SUIT : SHIRT) + '" fill="' + fill + '"/>' +
      '<path d="M40,198 L106,198 Q130,214 154,198 L220,198" fill="none" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>' + (full ? '' : hem());
  }

  C.neck = [
    { id: 'none', name: 'Ничего', price: 0 },
    { id: 'bowtie', name: 'Бабочка', price: 70, r: 1, svg: function () {
      return '<path d="M130,206 L108,194 L108,218 Z M130,206 L152,194 L152,218 Z" fill="#E53935" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/><rect x="124" y="200" width="12" height="12" rx="3" fill="#C62828" stroke="' + INK + '" stroke-width="3"/>'; } },
    { id: 'tie', name: 'Галстук', price: 70, r: 1, svg: function () {
      return '<path d="M123,204 L137,204 L141,216 L135,250 L130,256 L125,250 L119,216 Z" fill="#2E86FF" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/><path d="M122,204 L138,204 L134,214 L126,214 Z" fill="#1B5FC7" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>'; } },
    { id: 'scarf', name: 'Полосатый шарф', price: 90, r: 1, svg: function () {
      return '<path d="M150,208 L166,252 L150,256 L138,212 Z" fill="#FF5A5F" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
        '<path d="M76,196 Q130,216 184,196 L186,212 Q130,232 74,212 Z" fill="#FF5A5F" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>' +
        '<path d="M96,204 L96,222 M116,208 L116,226 M144,208 L144,226 M164,204 L164,222" stroke="#FFFFFF" stroke-width="5"/>'; } },
    { id: 'bell', name: 'Колокольчик', price: 80, r: 1, svg: function () {
      return '<path d="M84,196 Q130,214 176,196 L176,206 Q130,224 84,206 Z" fill="#E53935" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' + E('🔔', 116, 208, 28); } },
    { id: 'pearls', name: 'Жемчужные бусы', price: 150, r: 2, svg: function () {
      var s = '<g fill="#FFFFFF" stroke="#C9CED8" stroke-width="1.5">';
      for (var i = 0; i <= 10; i++) { var t = i / 10, x = (1 - t) * (1 - t) * 90 + 2 * (1 - t) * t * 130 + t * t * 170, y = (1 - t) * (1 - t) * 198 + 2 * (1 - t) * t * 232 + t * t * 198; s += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="5.5"/>'; }
      return s + '</g>'; } },
    { id: 'medal', name: 'Медаль', price: 200, r: 3, svg: function () { return E('🏅', 108, 198, 44); } },
    { id: 'cape', name: 'Плащ героя', price: 250, r: 3, back: true, svg: function () {
      return '<g class="cape"><path d="M92,196 Q130,210 168,196 L206,266 Q170,280 130,274 Q90,280 54,266 Z" fill="#E53935" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/></g>'; },
      front: function () { return '<circle cx="102" cy="200" r="6" fill="#FFD23F" stroke="' + INK + '" stroke-width="3"/><circle cx="158" cy="200" r="6" fill="#FFD23F" stroke="' + INK + '" stroke-width="3"/>'; } }
  ];

  /* Предметы в правой руке (рука в точке 200,220; рисуются внутри руки и двигаются с ней) */
  C.hand = [
    { id: 'none', name: 'Ничего', price: 0 },
    { id: 'balloon', name: 'Шарик', price: 50, r: 1, svg: function () {
      return '<g class="bal"><path d="M200,222 Q214,180 212,146" stroke="' + INK + '" stroke-width="2" fill="none"/>' + E('🎈', 186, 92, 54) + '</g>'; } },
    { id: 'icecream', name: 'Мороженое', price: 50, r: 1, svg: function () { return E('🍦', 180, 170, 44); } },
    { id: 'lolly', name: 'Леденец', price: 50, r: 1, svg: function () { return E('🍭', 182, 168, 44); } },
    { id: 'sunflower', name: 'Подсолнух', price: 60, r: 1, svg: function () { return E('🌻', 180, 150, 50); } },
    { id: 'teddy', name: 'Мишка', price: 90, r: 1, svg: function () { return E('🧸', 176, 182, 50); } },
    { id: 'pizza', name: 'Пицца', price: 70, r: 1, svg: function () { return E('🍕', 180, 176, 44); } },
    { id: 'rod', name: 'Удочка', price: 110, r: 2, svg: function () { return E('🎣', 184, 150, 62); } },
    { id: 'mic', name: 'Микрофон', price: 120, r: 2, svg: function () { return E('🎤', 182, 180, 40); } },
    { id: 'umbrella', name: 'Зонтик', price: 120, r: 2, svg: function () { return E('☂️', 170, 126, 84); } },
    { id: 'kite', name: 'Воздушный змей', price: 160, r: 2, svg: function () {
      return '<path d="M200,220 Q236,150 232,70" stroke="' + INK + '" stroke-width="2" fill="none"/><g class="bal">' + E('🪁', 208, 22, 50) + '</g>'; } },
    { id: 'wand', name: 'Волшебная палочка', price: 220, r: 3, svg: function () { return E('🪄', 180, 166, 48) + E('✨', 214, 156, 20, 'class="tw"'); } },
    { id: 'guitar', name: 'Гитара', price: 260, r: 3, svg: function () { return '<g transform="rotate(18 190 230)">' + E('🎸', 146, 176, 86) + '</g>'; } },
    { id: 'trophy', name: 'Кубок', price: 420, r: 4, svg: function () { return E('🏆', 178, 172, 50) + E('✨', 212, 164, 18, 'class="tw"'); } }
  ];

  /* Обувь: рисуем обе ноги */
  function feetDefault(col) {
    var d = shade(col, -0.28);
    return pair(function (x) { return '<ellipse cx="' + x + '" cy="258" rx="19" ry="11" fill="' + d + '" stroke="' + INK + '" stroke-width="4"/>'; });
  }
  function pair(fn) { return '<g class="ft ft-l">' + fn(108, -1) + '</g><g class="ft ft-r">' + fn(152, 1) + '</g>'; }
  C.feet = [
    { id: 'none', name: 'Босиком', price: 0 },
    { id: 'sneakers', name: 'Кроссовки', price: 90, r: 1, svg: function () {
      return pair(function (x, s) {
        return '<path d="M' + (x - 21) + ',264 Q' + (x - 22) + ',246 ' + (x - 6) + ',246 L' + (x + 6) + ',250 Q' + (x + 22) + ',254 ' + (x + 22) + ',264 Z" fill="#FFFFFF" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
          '<path d="M' + (x - 20) + ',262 L' + (x + 21) + ',262" stroke="#FF5A5F" stroke-width="5"/><path d="M' + (x - 8) + ',252 l6,-2 M' + (x - 2) + ',254 l6,-2" stroke="' + INK + '" stroke-width="2"/>';
      }); } },
    { id: 'boots', name: 'Резиновые сапоги', price: 90, r: 1, svg: function () {
      return pair(function (x) {
        return '<path d="M' + (x - 15) + ',230 L' + (x + 13) + ',230 L' + (x + 13) + ',254 Q' + (x + 22) + ',256 ' + (x + 22) + ',266 L' + (x - 17) + ',266 Z" fill="#FFD23F" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
          '<path d="M' + (x - 17) + ',262 L' + (x + 22) + ',262" stroke="#E0A100" stroke-width="5"/>';
      }); } },
    { id: 'valenki', name: 'Валенки', price: 130, r: 2, svg: function () {
      return pair(function (x) {
        return '<path d="M' + (x - 16) + ',226 L' + (x + 14) + ',226 L' + (x + 14) + ',252 Q' + (x + 23) + ',254 ' + (x + 23) + ',266 L' + (x - 18) + ',266 Z" fill="#DADFE7" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
          '<path d="M' + (x - 14) + ',236 L' + (x + 12) + ',236" stroke="#E53935" stroke-width="4" stroke-dasharray="4 4"/>';
      }); } },
    { id: 'slippers', name: 'Тапки-зайки', price: 120, r: 2, svg: function () {
      return pair(function (x) {
        return '<ellipse cx="' + (x - 4) + '" cy="238" rx="5" ry="12" fill="#FFB3CF" stroke="' + INK + '" stroke-width="3"/><ellipse cx="' + (x + 6) + '" cy="238" rx="5" ry="12" fill="#FFB3CF" stroke="' + INK + '" stroke-width="3"/>' +
          '<ellipse cx="' + x + '" cy="258" rx="21" ry="12" fill="#FFB3CF" stroke="' + INK + '" stroke-width="4"/><circle cx="' + (x - 5) + '" cy="255" r="2.2" fill="' + INK + '"/><circle cx="' + (x + 5) + '" cy="255" r="2.2" fill="' + INK + '"/>';
      }); } },
    { id: 'flippers', name: 'Ласты', price: 110, r: 2, svg: function () {
      return pair(function (x, s) {
        var tip = x + s * 40;
        return '<path d="M' + (x - s * 10) + ',250 L' + tip + ',252 Q' + (tip + s * 4) + ',262 ' + tip + ',270 L' + (x - s * 12) + ',266 Z" fill="#2BD99F" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>';
      }); } },
    { id: 'skates', name: 'Ролики', price: 170, r: 2, svg: function () {
      return pair(function (x) {
        return '<path d="M' + (x - 18) + ',234 L' + (x + 10) + ',234 L' + (x + 10) + ',248 Q' + (x + 20) + ',250 ' + (x + 20) + ',260 L' + (x - 20) + ',260 Z" fill="#A58BFF" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
          '<g fill="#FFD23F" stroke="' + INK + '" stroke-width="3"><circle cx="' + (x - 12) + '" cy="268" r="6"/><circle cx="' + x + '" cy="268" r="6"/><circle cx="' + (x + 12) + '" cy="268" r="6"/></g>';
      }); } },
    { id: 'rocket', name: 'Реактивные ботинки', price: 380, r: 4, svg: function () {
      return pair(function (x) {
        return '<g class="flame">' + E('🔥', x - 13, 262, 26) + '</g><path d="M' + (x - 16) + ',236 L' + (x + 14) + ',236 L' + (x + 16) + ',264 L' + (x - 18) + ',264 Z" fill="#B8C2D1" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
          '<rect x="' + (x - 16) + '" y="244" width="30" height="7" fill="#FF5A5F"/>';
      }); } }
  ];

  /* Питомцы: где стоят — у ног слева; попугай — на плече */
  C.pet = [
    { id: 'none', name: 'Без питомца', price: 0 },
    { id: 'cat', name: 'Котик', price: 150, r: 2, e: '🐈' },
    { id: 'dog', name: 'Пёсик', price: 150, r: 2, e: '🐕' },
    { id: 'hamster', name: 'Хомяк', price: 120, r: 2, e: '🐹', w: 44 },
    { id: 'duck', name: 'Утёнок', price: 100, r: 1, e: '🐥', w: 44 },
    { id: 'frog', name: 'Лягушонок', price: 100, r: 1, e: '🐸', w: 46 },
    { id: 'penguin', name: 'Пингвин', price: 160, r: 2, e: '🐧' },
    { id: 'hedgehog', name: 'Ёжик', price: 140, r: 2, e: '🦔', w: 50 },
    { id: 'parrot', name: 'Попугай на плече', price: 220, r: 3, e: '🦜', shoulder: true },
    { id: 'robot', name: 'Робот', price: 260, r: 3, e: '🤖', w: 50 },
    { id: 'ghost', name: 'Привидение', price: 260, r: 3, e: '👻', float: true },
    { id: 'dino', name: 'Динозаврик', price: 300, r: 3, e: '🦖', w: 64 },
    { id: 'unicorn', name: 'Единорог', price: 520, r: 4, e: '🦄', w: 62 },
    { id: 'dragon', name: 'Дракончик', price: 650, r: 4, e: '🐉', float: true, w: 66 }
  ];

  C.fx = [
    { id: 'none', name: 'Без эффекта', price: 0 },
    { id: 'sparkle', name: 'Блёстки', price: 120, r: 2, front: function () {
      return E('✨', 26, 120, 28, 'class="tw"') + E('✨', 214, 96, 24, 'class="tw d2"') + E('✨', 214, 222, 22, 'class="tw d3"') + E('✨', 34, 34, 20, 'class="tw d4"'); } },
    { id: 'hearts', name: 'Сердечки', price: 160, r: 2, front: function () {
      return '<g class="rise">' + E('💖', 24, 200, 26) + '</g><g class="rise d2">' + E('💗', 214, 180, 24) + '</g><g class="rise d4">' + E('💖', 206, 240, 20) + '</g>'; } },
    { id: 'notes', name: 'Ноты', price: 160, r: 2, front: function () {
      return '<g class="rise">' + E('🎵', 22, 170, 28) + '</g><g class="rise d3">' + E('🎶', 212, 150, 28) + '</g>'; } },
    { id: 'bubbles', name: 'Пузыри', price: 140, r: 2, front: function () {
      return '<g class="rise">' + E('🫧', 20, 220, 30) + '</g><g class="rise d2">' + E('🫧', 216, 210, 26) + '</g><g class="rise d4">' + E('🫧', 40, 160, 22) + '</g>'; } },
    { id: 'snow', name: 'Снегопад', price: 180, r: 2, front: function () {
      return '<g class="drop">' + E('❄️', 22, 20, 22) + '</g><g class="drop d2">' + E('❄️', 212, 10, 20) + '</g><g class="drop d4">' + E('❄️', 120, 0, 18) + '</g>'; } },
    { id: 'orbit', name: 'Звёздная орбита', price: 300, r: 3, front: function () {
      return '<g class="orbit">' + E('⭐', 118, 44, 24) + E('⭐', 18, 218, 20) + E('⭐', 214, 218, 22) + '</g>'; } },
    { id: 'fire', name: 'Огненные ноги', price: 320, r: 3, back: function () {
      return '<g class="flick">' + E('🔥', 60, 214, 46) + E('🔥', 108, 222, 44) + E('🔥', 156, 214, 46) + '</g>'; } },
    { id: 'rainbow', name: 'Радуга', price: 360, r: 3, back: function () {
      var cols = ['#FF5A6E', '#FFA53D', '#FFD23F', '#5CE1B9', '#62C9FF', '#A58BFF'], out = '<g class="glow">';
      cols.forEach(function (c, i) { var r = 126 - i * 9; out += '<path d="M' + (130 - r) + ',214 A' + r + ',' + r + ' 0 0 1 ' + (130 + r) + ',214" fill="none" stroke="' + c + '" stroke-width="9.5"/>'; });
      return out + '</g>'; } },
    { id: 'aura', name: 'Золотое сияние', price: 520, r: 4, back: function (u) {
      return '<radialGradient id="au' + u + '"><stop offset="0" stop-color="#FFE27A" stop-opacity=".9"/><stop offset="1" stop-color="#FFE27A" stop-opacity="0"/></radialGradient>' +
        '<circle class="glow" cx="130" cy="170" r="126" fill="url(#au' + u + ')"/>'; } },
    { id: 'lightning', name: 'Молнии', price: 420, r: 4, back: function () {
      return '<g class="zap">' + E('⚡', 10, 80, 44) + '</g><g class="zap d3">' + E('⚡', 206, 120, 44) + '</g>'; } }
  ];

  C.dance = [
    { id: 'jump', name: 'Прыжки', price: 0 },
    { id: 'wave', name: 'Волна', price: 0 },
    { id: 'robot', name: 'Робот', price: 90, r: 1 },
    { id: 'disco', name: 'Диско', price: 120, r: 2 },
    { id: 'twist', name: 'Твист', price: 140, r: 2 },
    { id: 'spin', name: 'Волчок', price: 160, r: 2 },
    { id: 'floss', name: 'Маятник', price: 200, r: 3 },
    { id: 'squat', name: 'Вприсядку', price: 240, r: 3 },
    { id: 'heli', name: 'Вертолёт', price: 280, r: 3 },
    { id: 'moon', name: 'Лунная походка', price: 360, r: 4 }
  ];

  var SLOTS = ['color', 'head', 'eyes', 'face', 'top', 'neck', 'hand', 'feet', 'pet', 'fx', 'dance'];
  var DEFAULT = { color: 'sun', head: 'none', eyes: 'none', face: 'none', top: 'tee', neck: 'none', hand: 'none', feet: 'none', pet: 'none', fx: 'none', dance: 'jump' };

  function find(slot, id) {
    var arr = C[slot] || [];
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  }
  function clean(look) {
    var out = {};
    SLOTS.forEach(function (s) {
      var v = look && typeof look[s] === 'string' ? look[s] : DEFAULT[s];
      out[s] = find(s, v) ? v : DEFAULT[s];
    });
    return out;
  }

  /* ——— Отрисовка ——— */
  function armPath(side) {
    return side < 0 ? 'M78,184 Q68,202 60,220' : 'M182,184 Q192,202 200,220';
  }
  function render(look, opt) {
    opt = opt || {};
    var L = clean(look), u = ++seq;
    var col = find('color', L.color), c = col.c;
    var fill = c, defs = '';
    if (col.g) {
      defs += '<linearGradient id="bg' + u + '" x1="0" y1="0" x2="1" y2="1">' +
        col.g.map(function (s, i) { return '<stop offset="' + (i / (col.g.length - 1)) + '" stop-color="' + s + '"/>'; }).join('') + '</linearGradient>';
      fill = 'url(#bg' + u + ')';
    }
    defs += '<clipPath id="bc' + u + '"><path d="' + BODY + '"/></clipPath>';
    var top = find('top', L.top), neck = find('neck', L.neck), hand = find('hand', L.hand), feet = find('feet', L.feet);
    var head = find('head', L.head), eyes = find('eyes', L.eyes), face = find('face', L.face), pet = find('pet', L.pet), fx = find('fx', L.fx);
    var sl = top && (typeof top.sl === 'function' ? top.sl(c) : top.sl);
    var armCol = col.g ? col.g[1] : c;

    var s = '<svg viewBox="' + (opt.vb || '0 0 260 290') + '" aria-hidden="true" focusable="false"><defs>' + defs + '</defs>';
    // эффекты сзади
    s += '<g class="fxb">' + (fx && fx.back ? fx.back(u) : '') + '</g>';
    // питомец
    if (pet && pet.e) {
      var pw = pet.w || 56;
      if (pet.shoulder) s += '<g class="pet pet-sh">' + E(pet.e, 176, 64, 46) + '</g>';
      else if (pet.float) s += '<g class="pet pet-fl">' + E(pet.e, 0, 70, pw) + '</g>';
      else s += '<g class="pet">' + E(pet.e, 32 - pw / 2, 272 - pw, pw) + '</g>';
    }
    s += '<g class="rt">';
    if (neck && neck.back) s += neck.svg();
    // ноги
    s += '<g class="feet">' + (feet && feet.svg ? feet.svg() : feetDefault(c)) + '</g>';
    // левая рука (за телом — нет, перед телом; рисуем после тела)
    // тело
    s += '<g class="bd"><path d="' + BODY + '" fill="' + fill + '"/>' +
      '<g clip-path="url(#bc' + u + ')">' +
      (col.stars ? E('✨', 150, 200, 22) + E('⭐', 90, 226, 14) + E('✨', 104, 96, 16) : '') +
      '<ellipse cx="130" cy="266" rx="80" ry="36" fill="#000" opacity=".10"/>' +
      '<ellipse cx="104" cy="104" rx="20" ry="13" fill="#fff" opacity=".35" transform="rotate(-28 104 104)"/>' +
      (top && top.svg ? top.svg(c) : '') + '</g>' +
      '<path d="' + BODY + '" fill="none" stroke="' + INK + '" stroke-width="5"/></g>';
    // лицо
    s += '<g class="face">' +
      '<g class="brows b-sad"><path d="M96,118 L120,110 M164,118 L140,110" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/></g>' +
      '<g class="brows b-angry"><path d="M94,110 L122,120 M166,110 L138,120" stroke="' + INK + '" stroke-width="5.5" stroke-linecap="round"/></g>' +
      '<g class="brows b-up"><path d="M96,108 Q108,98 122,106 M138,106 Q152,98 164,108" stroke="' + INK + '" stroke-width="5" fill="none" stroke-linecap="round"/></g>' +
      '<g class="brows b-one"><path d="M96,114 L122,114 M138,106 Q152,96 164,104" stroke="' + INK + '" stroke-width="5" fill="none" stroke-linecap="round"/></g>' +
      '<g class="eyes e-open"><ellipse cx="110" cy="138" rx="14" ry="17" fill="#fff" stroke="' + INK + '" stroke-width="4"/><ellipse cx="150" cy="138" rx="14" ry="17" fill="#fff" stroke="' + INK + '" stroke-width="4"/>' +
      '<g class="pup"><circle cx="111" cy="141" r="7.5" fill="' + INK + '"/><circle cx="151" cy="141" r="7.5" fill="' + INK + '"/><circle cx="114" cy="137" r="2.6" fill="#fff"/><circle cx="154" cy="137" r="2.6" fill="#fff"/></g></g>' +
      '<g class="eyes e-happy"><path d="M96,144 Q110,124 124,144 M136,144 Q150,124 164,144" stroke="' + INK + '" stroke-width="5.5" fill="none" stroke-linecap="round"/></g>' +
      '<g class="eyes e-closed"><path d="M96,138 Q110,148 124,138 M136,138 Q150,148 164,138" stroke="' + INK + '" stroke-width="5" fill="none" stroke-linecap="round"/></g>' +
      '<g class="eyes e-x"><path d="M100,128 L120,148 M120,128 L100,148 M140,128 L160,148 M160,128 L140,148" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/></g>' +
      '<g class="eyes e-spiral"><path d="M110,138 m-3,0 a3,3 0 1 1 6,0 a6,6 0 1 1 -12,0 a9,9 0 1 1 18,0 a12,12 0 1 1 -24,0 M150,138 m-3,0 a3,3 0 1 1 6,0 a6,6 0 1 1 -12,0 a9,9 0 1 1 18,0 a12,12 0 1 1 -24,0" stroke="' + INK + '" stroke-width="3" fill="none"/></g>' +
      '<g class="eyes e-big"><ellipse cx="110" cy="136" rx="17" ry="21" fill="#fff" stroke="' + INK + '" stroke-width="4"/><ellipse cx="150" cy="136" rx="17" ry="21" fill="#fff" stroke="' + INK + '" stroke-width="4"/><circle cx="110" cy="138" r="4" fill="' + INK + '"/><circle cx="150" cy="138" r="4" fill="' + INK + '"/></g>' +
      '<g class="cheeks"><ellipse cx="92" cy="162" rx="9" ry="5.5" fill="#FF6F91" opacity=".45"/><ellipse cx="168" cy="162" rx="9" ry="5.5" fill="#FF6F91" opacity=".45"/></g>' +
      '<g class="mouth m-smile"><path d="M114,174 Q130,190 146,174" stroke="' + INK + '" stroke-width="5" fill="none" stroke-linecap="round"/></g>' +
      '<g class="mouth m-grin"><path d="M110,170 Q130,206 150,170 Z" fill="#7A1E2C" stroke="' + INK + '" stroke-width="4.5" stroke-linejoin="round"/><path d="M118,186 Q130,196 142,186 Q136,180 130,182 Q124,180 118,186 Z" fill="#FF7F9E"/></g>' +
      '<g class="mouth m-o"><ellipse cx="130" cy="182" rx="8" ry="10" fill="#7A1E2C" stroke="' + INK + '" stroke-width="4"/></g>' +
      '<g class="mouth m-sad"><path d="M114,188 Q130,172 146,188" stroke="' + INK + '" stroke-width="5" fill="none" stroke-linecap="round"/></g>' +
      '<g class="mouth m-cry"><path d="M110,192 Q130,164 150,192 Z" fill="#7A1E2C" stroke="' + INK + '" stroke-width="4.5" stroke-linejoin="round"/></g>' +
      '<g class="mouth m-wavy"><path d="M110,182 q5,-6 10,0 t10,0 t10,0 t10,0" stroke="' + INK + '" stroke-width="4.5" fill="none" stroke-linecap="round"/></g>' +
      '<g class="mouth m-flat"><path d="M116,182 L144,182" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/></g>' +
      (face && face.svg ? '<g class="facc">' + face.svg() + '</g>' : '') +
      '</g>';
    if (eyes && eyes.svg) s += '<g class="glasses">' + eyes.svg() + '</g>';
    if (neck && neck.svg && !neck.back) s += '<g class="neckw">' + neck.svg() + '</g>';
    if (neck && neck.front) s += neck.front();
    if (head && head.svg) s += '<g class="hat">' + head.svg(c) + '</g>';
    // руки
    function arm(side) {
      var p = armPath(side), hx = side < 0 ? 60 : 200;
      var out = '<g class="arm ' + (side < 0 ? 'arm-l' : 'arm-r') + '">';
      out += '<path d="' + p + '" stroke="' + INK + '" stroke-width="19" fill="none" stroke-linecap="round"/>';
      out += '<path d="' + p + '" stroke="' + armCol + '" stroke-width="11" fill="none" stroke-linecap="round"/>';
      if (sl) {
        var sp = side < 0 ? 'M78,184 Q74,192 70,199' : 'M182,184 Q186,192 190,199';
        out += '<path d="' + sp + '" stroke="' + INK + '" stroke-width="21" fill="none" stroke-linecap="round"/><path d="' + sp + '" stroke="' + sl + '" stroke-width="13" fill="none" stroke-linecap="round"/>';
      }
      out += '<circle cx="' + hx + '" cy="222" r="10" fill="' + armCol + '" stroke="' + INK + '" stroke-width="4"/>';
      if (side > 0 && hand && hand.svg) out += '<g class="held">' + hand.svg() + '</g>';
      return out + '</g>';
    }
    s += arm(-1) + arm(1);
    // накладки для реакций
    s += '<g class="ov ov-tears"><path class="tear" d="M100,150 q-3,10 0,14 q3,-4 0,-14 Z" fill="#62C9FF"/><path class="tear d2" d="M160,150 q-3,10 0,14 q3,-4 0,-14 Z" fill="#62C9FF"/>' +
      '<path class="tear d3" d="M96,156 q-4,12 0,16 q4,-4 0,-16 Z" fill="#62C9FF"/><path class="tear d4" d="M164,156 q-4,12 0,16 q4,-4 0,-16 Z" fill="#62C9FF"/></g>' +
      '<g class="ov ov-sweat">' + E('💦', 178, 86, 30) + '</g>' +
      '<g class="ov ov-zzz"><g class="rise">' + E('💤', 170, 64, 34) + '</g></g>' +
      '<g class="ov ov-q">' + E('❓', 172, 50, 30, 'class="pop"') + E('❓', 60, 66, 22, 'class="pop d2"') + '</g>' +
      '<g class="ov ov-stars"><g class="orb">' + E('💫', 100, 30, 26) + E('⭐', 150, 40, 20) + '</g></g>' +
      '<g class="ov ov-steam">' + E('💢', 164, 70, 30, 'class="pop"') + E('💨', 60, 70, 30, 'class="pop d2"') + '</g>' +
      '<g class="ov ov-think">' + E('💭', 174, 40, 44) + '</g>' +
      '<g class="ov ov-hearts">' + E('💕', 172, 56, 34, 'class="pop"') + '</g>';
    s += '</g>'; // rt
    s += '<g class="fxf">' + (fx && fx.front ? fx.front(u) : '') + '</g>';
    s += '</svg>';
    var st = opt.size ? ' style="width:' + opt.size + 'px"' : '';
    return '<div class="av' + (opt.cls ? ' ' + opt.cls : '') + '" data-dance="' + L.dance + '"' + st + '>' + s + '</div>';
  }

  /* ——— Настроения ——— */
  var MOODS = {
    idle: {}, happy: { eyes: 'happy', mouth: 'grin' }, dance: { eyes: 'happy', mouth: 'grin' },
    think: { mouth: 'flat', ov: 'think' }, typing: { mouth: 'flat' },
    nope: { mouth: 'wavy', brows: 'sad' }, cry: { eyes: 'closed', mouth: 'cry', brows: 'sad', ov: 'tears' },
    faint: { eyes: 'x', mouth: 'o', ov: 'stars' }, facepalm: { eyes: 'closed', mouth: 'flat', brows: 'sad' },
    shock: { eyes: 'big', mouth: 'o', brows: 'up', ov: 'sweat' }, melt: { eyes: 'spiral', mouth: 'wavy' },
    angry: { mouth: 'flat', brows: 'angry', ov: 'steam' }, sleep: { eyes: 'closed', mouth: 'o', ov: 'zzz' },
    confused: { mouth: 'wavy', brows: 'one', ov: 'q' }, clap: { eyes: 'happy', mouth: 'grin' },
    cheer: { eyes: 'happy', mouth: 'grin' }, love: { eyes: 'happy', mouth: 'smile', ov: 'hearts' }
  };
  function setMood(el, mood, ms) {
    if (!el) return;
    var av = el.classList && el.classList.contains('av') ? el : el.querySelector('.av');
    if (!av) return;
    clearTimeout(av._mt);
    var m = MOODS[mood] || {};
    av.setAttribute('data-mood', mood || 'idle');
    ['eyes', 'mouth', 'brows', 'ov'].forEach(function (k) { if (m[k]) av.setAttribute('data-' + k, m[k]); else av.removeAttribute('data-' + k); });
    av.classList.toggle('dancing', mood === 'dance');
    // перезапуск анимаций реакции
    av.classList.remove('re'); void av.offsetWidth; av.classList.add('re');
    if (ms) av._mt = setTimeout(function () { setMood(av, 'idle'); }, ms);
  }
  function look(el, dx, dy) {
    var av = el && (el.classList.contains('av') ? el : el.querySelector('.av'));
    if (!av) return;
    av.style.setProperty('--lx', (dx || 0) + 'px');
    av.style.setProperty('--ly', (dy || 0) + 'px');
  }

  window.AV = { C: C, SLOTS: SLOTS, DEFAULT: DEFAULT, find: find, clean: clean, render: render, setMood: setMood, look: look, MOODS: MOODS, shade: shade };
})();
