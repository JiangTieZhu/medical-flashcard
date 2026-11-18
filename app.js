/* 中医方剂学闪卡 · 逻辑 */
(function () {
  'use strict';

  var DATA = window.FORMULA_DATA;
  if (!DATA || !DATA.formulas) {
    document.querySelector('.card').innerHTML =
      '<div class="empty">未找到 formulas.js，请确认它与 index.html 在同一目录。</div>';
    return;
  }

  var ALL = DATA.formulas;
  var KEY = 'tcm-fangji-flash-v1';

  var state = {
    q: '',
    chapter: '全部',
    level: '全部',
    mode: '顺序',
    hide: false,
    mute: false,
    revealed: false,
    list: [],
    idx: 0,
    mastered: {}
  };

  /* ---------- 持久化 ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var s = JSON.parse(raw);
      state.chapter = s.chapter || '全部';
      state.level = s.level || '全部';
      state.mode = s.mode || '顺序';
      state.hide = !!s.hide;
      state.mute = !!s.mute;
      state.mastered = s.mastered || {};
    } catch (e) { /* 忽略损坏的存储 */ }
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        chapter: state.chapter, level: state.level, mode: state.mode,
        hide: state.hide, mute: state.mute, mastered: state.mastered
      }));
    } catch (e) { /* 隐私模式忽略 */ }
  }

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ---------- DOM ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var card = $('card'), backBody = $('b-body');

  /* 方歌按“；”分两行显示 */
  function fillSong(text) {
    var box = $('f-song');
    box.textContent = '';
    if (text) {
      text.split('；').forEach(function (line) {
        var s = document.createElement('span');
        s.textContent = line;
        box.appendChild(s);
      });
    }
    applyMask();
  }

  /* 勾选“先藏方歌”时遮住方歌，点击后再显示 */
  function applyMask() {
    var box = $('f-song');
    var has = !!box.querySelector('span');
    box.classList.toggle('masked', !!(state.mute && has && !state.revealed));
  }

  /* ---------- 筛选 ---------- */
  function buildChapterOptions() {
    var order = [], groups = {};
    ALL.forEach(function (f) {
      var top = String(f.chapter).split('·')[0];
      if (!groups[top]) { groups[top] = []; order.push(top); }
      if (groups[top].indexOf(f.chapter) < 0) groups[top].push(f.chapter);
    });
    var sel = $('chapter');
    order.forEach(function (top) {
      var g = document.createElement('optgroup');
      g.label = top;
      var all = document.createElement('option');
      all.value = top;
      all.textContent = top + '（全部）';
      g.appendChild(all);
      groups[top].forEach(function (c) {
        var o = document.createElement('option');
        o.value = c;
        o.textContent = c.indexOf('·') > -1 ? c.split('·')[1] : c;
        g.appendChild(o);
      });
      sel.appendChild(g);
    });
    sel.value = state.chapter;
    if (!sel.value) { state.chapter = '全部'; sel.value = '全部'; }
  }

  function match(f) {
    if (state.level !== '全部' && f.level !== state.level) return false;
    if (state.chapter !== '全部') {
      var top = String(f.chapter).split('·')[0];
      if (f.chapter !== state.chapter && top !== state.chapter) return false;
    }
    if (state.hide && state.mastered[f.name]) return false;
    if (state.q) {
      var hay = [f.name, f.source, f.chapter, f.effects, f.indication, f.points]
        .concat(f.pitfalls, f.comp.map(function (c) { return c[0] + c[1]; }))
        .join(' ').toLowerCase();
      if (hay.indexOf(state.q) < 0) return false;
    }
    return true;
  }

  function rebuild(keepName) {
    var arr = ALL.filter(match);
    if (state.mode === '乱序') arr = shuffle(arr.slice());
    state.list = arr;
    if (keepName) {
      for (var i = 0; i < arr.length; i++) if (arr[i].name === keepName) { state.idx = i; return; }
    }
    if (state.idx >= arr.length) state.idx = 0;
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------- 渲染 ---------- */
  function cur() { return state.list[state.idx] || null; }

  function render() {
    var f = cur();
    state.revealed = false;
    card.classList.remove('flipped');

    if (!f) {
      $('f-name').textContent = '没有符合条件的方剂';
      $('f-src').textContent = '';
      fillSong('');
      $('f-chap').textContent = '';
      $('f-level').textContent = '';
      $('f-level').className = 'badge';
      backBody.innerHTML = '';
      $('pos').textContent = '0 / 0';
      $('bar').style.width = '0%';
      $('prev').disabled = $('next').disabled = $('flip').disabled = $('master').disabled = true;
      return;
    }
    $('prev').disabled = $('next').disabled = $('flip').disabled = $('master').disabled = false;

    $('f-name').textContent = f.name;
    $('f-src').textContent = f.source;
    fillSong(f.song);
    $('f-chap').textContent = f.chapter;
    $('f-level').textContent = f.level;
    $('f-level').className = 'badge lv-' + f.level;

    backBody.innerHTML =
      '<div class="back-top"><h3>' + esc(f.name) + '</h3><span class="from">' + esc(f.source) +
      '</span><span class="from" style="color:#a2977f">' + esc(f.chapter) + '</span></div>' +
      '<div class="sec"><h4>组成</h4><div class="comp">' +
      f.comp.map(function (c) {
        return '<span class="herb"><b>' + esc(c[0]) + '</b><i>' + esc(c[1]) + '</i></span>';
      }).join('') + '</div></div>' +
      '<div class="sec"><h4>功用</h4><p>' + esc(f.effects) + '</p></div>' +
      '<div class="sec"><h4>主治</h4><p>' + esc(f.indication) + '</p></div>' +
      '<div class="sec"><h4>要点</h4><p>' + esc(f.points) + '</p></div>' +
      '<div class="sec pitfalls"><h4>易错点</h4><ul>' +
      f.pitfalls.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') +
      '</ul></div>';

    var on = !!state.mastered[f.name];
    var btn = $('master');
    btn.textContent = on ? '✓ 已掌握（点击取消）' : '标记已掌握';
    btn.classList.toggle('on', on);

    $('pos').textContent = (state.idx + 1) + ' / ' + state.list.length;
    $('bar').style.width = ((state.idx + 1) / state.list.length * 100) + '%';

    var done = state.list.filter(function (x) { return state.mastered[x.name]; }).length;
    $('mastered').textContent = '本组已掌握 ' + done + ' / ' + state.list.length;
  }

  function renderStats() {
    $('total').textContent = ALL.length;
    var c = { '重点': 0, '次重点': 0, '了解': 0 };
    ALL.forEach(function (f) { if (c[f.level] != null) c[f.level]++; });
    $('stats').innerHTML =
      '<span><b>' + c['重点'] + '</b> 重点</span>' +
      '<span><b>' + c['次重点'] + '</b> 次重点</span>' +
      '<span><b>' + c['了解'] + '</b> 了解</span>';
  }

  /* ---------- 交互 ---------- */
  function flip() {
    if (!cur()) return;
    card.classList.toggle('flipped');
  }
  function go(step) {
    if (!state.list.length) return;
    state.idx = (state.idx + step + state.list.length) % state.list.length;
    render();
  }
  function toggleMaster() {
    var f = cur(); if (!f) return;
    if (state.mastered[f.name]) delete state.mastered[f.name];
    else state.mastered[f.name] = 1;
    save();
    if (state.mastered[f.name] && state.hide) { rebuild(); render(); }
    else render();
  }

  card.addEventListener('click', function (e) {
    if (e.target.closest('.back')) return; // 背面不误触翻回
    flip();
  });
  $('f-song').addEventListener('click', function (e) {
    if (!this.classList.contains('masked')) return;
    e.stopPropagation();      // 遮住时点击只显示方歌，不翻面
    state.revealed = true;
    this.classList.remove('masked');
  });
  $('mute').addEventListener('change', function () {
    state.mute = this.checked;
    save();
    state.revealed = false;
    applyMask();
  });
  $('flip').addEventListener('click', flip);
  $('prev').addEventListener('click', function () { go(-1); });
  $('next').addEventListener('click', function () { go(1); });
  $('master').addEventListener('click', toggleMaster);

  $('q').addEventListener('input', function () {
    state.q = this.value.trim().toLowerCase();
    rebuild();
    render();
  });
  $('chapter').addEventListener('change', function () {
    state.chapter = this.value; save(); rebuild(); state.idx = 0; render();
  });
  $('level').addEventListener('change', function () {
    state.level = this.value; save(); rebuild(); state.idx = 0; render();
  });
  $('mode').addEventListener('change', function () {
    state.mode = this.value; save(); rebuild(cur() ? cur().name : null); render();
  });
  $('hide').addEventListener('change', function () {
    state.hide = this.checked; save(); rebuild(cur() ? cur().name : null); render();
  });
  $('reset').addEventListener('click', function () {
    if (!confirm('清空全部「已掌握」记录？')) return;
    state.mastered = {}; save(); rebuild(cur() ? cur().name : null); render();
  });

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === 'm' || e.key === 'M') { e.preventDefault(); toggleMaster(); }
  });

  /* ---------- 启动 ---------- */
  load();
  renderStats();
  buildChapterOptions();
  $('level').value = state.level;
  $('mode').value = state.mode;
  $('hide').checked = state.hide;
  $('mute').checked = state.mute;
  rebuild();
  render();
})();
