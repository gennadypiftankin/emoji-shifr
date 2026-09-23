/* Эмодзи-шифр — эмодзи как картинки Twemoji (одинаково на всех устройствах) */
(function () {
  'use strict';
  var RE = /(?:\p{Regional_Indicator}{2})|(?:[#*0-9]️?⃣)|(?:\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?(?:‍\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?)*)/gu;

  function code(emo) {
    var s = emo.indexOf('‍') < 0 ? emo.replace(/️/g, '') : emo;
    var out = [];
    for (var ch of s) out.push(ch.codePointAt(0).toString(16));
    return out.join('-');
  }
  function src(emo) { return 'e/' + code(emo) + '.svg'; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function img(emo, cls, extra) {
    return '<img class="em ' + (cls || '') + '" src="' + src(emo) + '" alt="' + emo +
      '" draggable="false" ' + (extra || '') + '>';
  }
  function split(str) { return String(str).match(RE) || []; }
  /* Текст → HTML: экранируем и заменяем эмодзи на картинки */
  function parse(text) { return esc(text).replace(RE, function (m) { return img(m, 'em-i'); }); }

  window.EMO = { RE: RE, code: code, src: src, img: img, split: split, parse: parse, esc: esc };
})();
