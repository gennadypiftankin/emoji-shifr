/* Эмодзи-шифр — звуки, синтезированные прямо в браузере (без файлов) */
(function () {
  'use strict';
  var ctx = null, master = null, on = true;
  try { on = localStorage.getItem('emojishifr.sound') !== '0'; } catch (e) { /* нет хранилища */ }

  function ac() {
    if (!on) return null;
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
      master = ctx.createGain(); master.gain.value = 0.32; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(freq, t0, dur, type, vol, slideTo) {
    var c = ac(); if (!c) return;
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'triangle';
    o.frequency.setValueAtTime(freq, c.currentTime + t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + t0 + dur);
    g.gain.setValueAtTime(0.0001, c.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.5, c.currentTime + t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
    o.connect(g); g.connect(master);
    o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + 0.05);
  }
  function noise(t0, dur, vol, fFrom, fTo) {
    var c = ac(); if (!c) return;
    var len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var s = c.createBufferSource(); s.buffer = buf;
    var f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
    f.frequency.setValueAtTime(fFrom || 800, c.currentTime + t0);
    f.frequency.exponentialRampToValueAtTime(fTo || 3000, c.currentTime + t0 + dur);
    var g = c.createGain(); g.gain.setValueAtTime(vol || 0.3, c.currentTime + t0); g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(c.currentTime + t0);
  }
  var N = { C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, E6: 1318.5, G6: 1568, C4: 261.63, E4: 329.63, G4: 392, A4: 440 };

  var SFX = {
    click: function () { tone(660, 0, 0.05, 'square', 0.12); },
    pop: function (i) { tone(420 + (i || 0) * 70, 0, 0.09, 'triangle', 0.35, 900 + (i || 0) * 90); },
    hint: function () { noise(0, 0.28, 0.25, 400, 4000); tone(880, 0.12, 0.12, 'sine', 0.25); },
    wrong: function () { tone(220, 0, 0.18, 'sawtooth', 0.22, 150); tone(160, 0.16, 0.26, 'sawtooth', 0.2, 110); },
    warm: function () { tone(520, 0, 0.1, 'triangle', 0.25); tone(620, 0.08, 0.12, 'triangle', 0.25); },
    coin: function (d) { var t = d || 0; tone(N.B5, t, 0.07, 'square', 0.18); tone(N.E6, t + 0.07, 0.22, 'square', 0.18); },
    correct: function () { [N.C5, N.E5, N.G5, N.C6].forEach(function (f, i) { tone(f, i * 0.09, 0.22, 'triangle', 0.45); }); tone(N.G6, 0.38, 0.35, 'sine', 0.2); },
    fail: function () { [N.G4, 369.99, 349.23].forEach(function (f, i) { tone(f, i * 0.32, 0.3, 'sawtooth', 0.18, f * 0.97); }); tone(329.63, 0.96, 0.8, 'sawtooth', 0.18, 290); },
    tick: function () { tone(1000, 0, 0.06, 'square', 0.15); },
    go: function () { tone(N.C5, 0, 0.12, 'square', 0.2); tone(N.G5, 0.1, 0.25, 'square', 0.2); },
    buy: function () { noise(0, 0.15, 0.2, 2000, 6000); [N.E5, N.G5, N.C6, N.E6].forEach(function (f, i) { tone(f, 0.05 + i * 0.06, 0.16, 'triangle', 0.3); }); },
    react: function () { tone(700, 0, 0.08, 'sine', 0.25, 1100); },
    join: function () { tone(N.E5, 0, 0.1, 'triangle', 0.3); tone(N.A5, 0.09, 0.16, 'triangle', 0.3); },
    fanfare: function () {
      var seq = [[N.C5, 0, .14], [N.C5, .15, .1], [N.C5, .27, .1], [N.E5, .4, .3], [N.C5, .72, .14], [N.E5, .88, .12], [N.G5, 1.02, .5]];
      seq.forEach(function (s) { tone(s[0], s[1], s[2], 'square', 0.2); tone(s[0] / 2, s[1], s[2], 'triangle', 0.25); });
    },
    dance: function () {
      var bass = [N.C4, N.C4, N.G4 / 2 * 2, N.A4 / 2 * 2];
      for (var b = 0; b < 8; b++) {
        var t = b * 0.25;
        tone(b % 2 ? 180 : 90, t, 0.12, 'sine', 0.5, 50);
        if (b % 2) noise(t, 0.06, 0.12, 5000, 9000);
        tone(bass[b % 4] / 2, t, 0.2, 'square', 0.1);
      }
      [N.E5, N.G5, N.A5, N.G5, N.E5, N.C6].forEach(function (f, i) { tone(f, 0.25 + i * 0.25, 0.18, 'triangle', 0.25); });
    }
  };
  function play(name, a) { try { if (on && SFX[name]) SFX[name](a); } catch (e) { /* звук необязателен */ } }
  function toggle() {
    on = !on;
    try { localStorage.setItem('emojishifr.sound', on ? '1' : '0'); } catch (e) { /* нет хранилища */ }
    if (on) play('click');
    return on;
  }
  window.SND = { play: play, toggle: toggle, isOn: function () { return on; } };
})();
