/* Эмодзи-шифр — комнаты для игры с друзьями.
   Связь через бесплатные публичные MQTT-брокеры (без регистрации):
   /s — состояние игры (хранит ведущий, retained), /p/<id> — игроки (retained + «завещание» при отключении), /e — события. */
(function () {
  'use strict';
  /* Первая цифра кода комнаты «помнит» брокер: (цифра − 1) % 4 */
  var BROKERS = [
    { url: 'wss://broker.hivemq.com:8884/mqtt' },
    { url: 'wss://broker.emqx.io:8084/mqtt' },
    { url: 'wss://public.cloud.shiftr.io', user: 'public', pass: 'public' }, /* порт 443 — для сетей, где закрыты другие порты */
    { url: 'wss://test.mosquitto.org:8081/mqtt' }
  ];
  var ROOT = 'emojishifr/v2/';
  var HEARTBEAT = 8000, STALE = 30000, STATE_BEAT = 4000;

  var client = null, code = null, prefix = '', me = null, my = {}, peers = {}, state = null;
  var cb = { peers: null, state: null, event: null, status: null };
  var offset = 0, stateLive = false, pubTimer = null, pubPending = false, lastPub = 0, hb = null, sweep = null, online = false, stateSeq = 0;

  function override() {
    var m = /[?&]broker=([^&#]+)/.exec(location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }
  function brokerIndex(c) { var d = parseInt(String(c).charAt(0), 10); return isNaN(d) || d < 1 ? 0 : (d - 1) % BROKERS.length; }
  function brokerFor(c) { var o = override(); return o ? { url: o } : BROKERS[brokerIndex(c)]; }
  function makeCode(bi) {
    var firsts = [];
    for (var d = 1; d <= 9; d++) if ((d - 1) % BROKERS.length === bi) firsts.push(d);
    return String(firsts[Math.floor(Math.random() * firsts.length)]) + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  }
  function parse(t) { try { return JSON.parse(t); } catch (e) { return null; } }

  function loadLib() {
    return new Promise(function (res, rej) {
      if (window.mqtt) return res();
      var s = document.createElement('script');
      s.src = 'vendor/mqtt.min.js';
      s.onload = function () { res(); };
      s.onerror = function () { rej(new Error('lib')); };
      document.head.appendChild(s);
    });
  }

  function connect(broker, roomCode, timeoutMs) {
    return new Promise(function (res, rej) {
      var pre = ROOT + roomCode + '/';
      var c, opts = {
        clientId: 'es_' + me.cid + '_' + Math.random().toString(36).slice(2, 7),
        keepalive: 20, clean: true, reconnectPeriod: 2500, connectTimeout: timeoutMs, protocolVersion: 4,
        will: { topic: pre + 'p/' + me.cid, payload: '', retain: true, qos: 0 }
      };
      if (broker.user) { opts.username = broker.user; opts.password = broker.pass; }
      try {
        c = window.mqtt.connect(broker.url, opts);
      } catch (e) { return rej(e); }
      var done = false;
      var t = setTimeout(function () { if (!done) { done = true; try { c.end(true); } catch (e) { } rej(new Error('timeout')); } }, timeoutMs + 300);
      c.once('connect', function () { if (!done) { done = true; clearTimeout(t); res(c); } });
      c.once('error', function (e) { if (!done) { done = true; clearTimeout(t); try { c.end(true); } catch (x) { } rej(e); } });
    });
  }

  function wire(c, roomCode) {
    client = c; code = roomCode; prefix = ROOT + roomCode + '/';
    peers = {}; state = null; stateLive = false; offset = 0;
    c.on('message', onMessage);
    c.on('connect', function () { setOnline(true); c.subscribe(prefix + '#', { qos: 0 }); publishPresence(true); });
    c.on('offline', function () { setOnline(false); });
    c.on('close', function () { setOnline(false); });
    c.on('reconnect', function () { setOnline(false); });
    c.subscribe(prefix + '#', { qos: 0 });
    setOnline(true);
    clearInterval(hb); clearInterval(sweep);
    hb = setInterval(function () { publishPresence(true); }, HEARTBEAT);
    sweep = setInterval(prune, 3000);
  }
  function setOnline(v) { if (online !== v) { online = v; if (cb.status) cb.status(v); } }

  function onMessage(topic, payload, packet) {
    if (topic.indexOf(prefix) !== 0) return;
    var sub = topic.slice(prefix.length), txt = payload ? payload.toString() : '';
    if (sub === 's') {
      if (!txt) { state = null; if (cb.state) cb.state(null, !!packet.retain); return; }
      var st = parse(txt);
      if (!st || typeof st !== 'object' || st.v !== 2) return;
      if (typeof st.now === 'number' && (!packet.retain || !stateLive)) { offset = Date.now() - st.now; if (!packet.retain) stateLive = true; }
      state = st;
      if (cb.state) cb.state(st, !!packet.retain);
    } else if (sub.indexOf('p/') === 0) {
      var id = sub.slice(2);
      if (!txt) { if (peers[id]) { delete peers[id]; emitPeers(); } return; }
      var p = parse(txt);
      if (!p || p.cid !== id) return;
      p._seen = Date.now(); p._live = !packet.retain;
      peers[id] = p;
      emitPeers();
    } else if (sub === 'e') {
      var ev = parse(txt);
      if (ev && typeof ev === 'object' && typeof ev.t === 'string' && cb.event) cb.event(ev);
    }
  }
  function emitPeers() { if (cb.peers) cb.peers(list()); }
  function list() {
    var out = [];
    for (var k in peers) if (Object.prototype.hasOwnProperty.call(peers, k)) out.push(peers[k]);
    return out;
  }
  function prune() {
    var now = Date.now(), changed = false;
    for (var k in peers) {
      if (k === me.cid) continue;
      if (now - peers[k]._seen > STALE) { delete peers[k]; changed = true; }
    }
    if (changed) emitPeers();
  }

  function publishPresence(force) {
    if (!client || !me) return;
    var now = Date.now();
    if (!force && now - lastPub < 250) {
      if (!pubPending) { pubPending = true; pubTimer = setTimeout(function () { pubPending = false; publishPresence(true); }, 260 - (now - lastPub)); }
      return;
    }
    lastPub = now;
    my.cid = me.cid; my.t = now;
    try { client.publish(prefix + 'p/' + me.cid, JSON.stringify(my), { retain: true, qos: 0 }); } catch (e) { /* переподключимся */ }
  }

  var NET = {
    brokerIndex: brokerIndex,
    on: function (name, fn) { cb[name] = fn; },
    me: function () { return me; },
    peers: list,
    state: function () { return state; },
    code: function () { return code; },
    online: function () { return online; },
    hostNow: function () { return Date.now() - offset; },
    toLocal: function (hostTs) { return hostTs + offset; },
    /* Создать комнату: пробуем брокеры по очереди, код комнаты «помнит» брокер первой цифрой */
    create: function (who, presence) {
      me = who; my = presence || {};
      return loadLib().then(function () {
        var order = BROKERS.map(function (b, i) { return i; });
        var i = 0, busyTries = 0;
        function attempt() {
          if (i >= order.length) return Promise.reject(new Error('offline'));
          var bi = order[i++], c = makeCode(bi), broker = override() ? { url: override() } : BROKERS[bi];
          return connect(broker, c, 6000).then(function (cl) {
            return new Promise(function (res) {
              var pre = ROOT + c + '/', busy = false;
              function probe(topic, payload) {
                if (topic === pre + 's' && payload && payload.length) {
                  var st = parse(payload.toString());
                  if (st && st.ph !== 'closed' && typeof st.now === 'number' && Math.abs(Date.now() - st.now) < 10 * 60000) busy = true;
                }
              }
              cl.on('message', probe);
              cl.subscribe(pre + 's', { qos: 0 });
              setTimeout(function () {
                cl.removeListener('message', probe);
                cl.unsubscribe(pre + 's');
                if (busy && busyTries++ < 4) { cl.end(true); i--; res(attempt()); return; }
                wire(cl, c);
                publishPresence(true);
                res(c);
              }, 700);
            });
          }, function () { return attempt(); });
        }
        return attempt();
      });
    },
    /* Войти по коду: ждём состояние комнаты от ведущего */
    join: function (roomCode, who, presence) {
      me = who; my = presence || {};
      return loadLib().then(function () {
        return connect(brokerFor(roomCode), roomCode, 8000);
      }).then(function (cl) {
        wire(cl, roomCode);
        publishPresence(true);
        return new Promise(function (res, rej) {
          var waited = 0;
          var t = setInterval(function () {
            waited += 200;
            if (state) { clearInterval(t); res(roomCode); }
            else if (waited >= 3500) { clearInterval(t); NET.leave(true); rej(new Error('noroom')); }
          }, 200);
        });
      });
    },
    setPresence: function (patch, force) {
      for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) {
        if (patch[k] === null) delete my[k]; else my[k] = patch[k];
      }
      publishPresence(!!force);
    },
    myPresence: function () { return my; },
    /* Состояние комнаты публикует только ведущий */
    setState: function (st) {
      if (!client) return;
      st.v = 2; st.now = Date.now(); st.host = me.cid; st.seq = ++stateSeq;
      state = st;
      try { client.publish(prefix + 's', JSON.stringify(st), { retain: true, qos: 0 }); } catch (e) { /* переподключимся */ }
    },
    beat: function () { if (state && state.host === me.cid) NET.setState(state); },
    emit: function (type, data) {
      if (!client) return;
      var ev = data || {}; ev.t = type; ev.c = me.cid;
      try { client.publish(prefix + 'e', JSON.stringify(ev), { qos: 0 }); } catch (e) { /* не страшно */ }
    },
    leave: function (silent) {
      clearInterval(hb); clearInterval(sweep); clearTimeout(pubTimer);
      if (!client) return;
      var c = client, pre = prefix;
      try {
        c.publish(pre + 'p/' + me.cid, '', { retain: true, qos: 0 });
        var others = list().filter(function (p) { return p.cid !== me.cid; });
        if (!silent && state && state.host === me.cid && others.length === 0) c.publish(pre + 's', '', { retain: true, qos: 0 });
      } catch (e) { /* уже отключены */ }
      setTimeout(function () { try { c.end(true); } catch (e) { } }, 250);
      client = null; code = null; peers = {}; state = null; setOnline(false);
    }
  };
  window.NET = NET;
})();
