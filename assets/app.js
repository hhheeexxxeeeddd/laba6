(function () {
  'use strict';
  var de = document.documentElement, page = de.getAttribute('data-page');
  var CAN = (function () { try { localStorage.setItem('__t', '1'); localStorage.removeItem('__t'); return true; } catch (e) { return false; } })();
  var S = {
    get: function (k) { try { return localStorage.getItem('sahara_' + k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem('sahara_' + k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem('sahara_' + k); } catch (e) {} }
  };
  var PROTECTED = { dashboard: 1, scenarios: 1, scenario: 1, create: 1, analytics: 1 };
  var authed = S.get('auth') === '1';
  if (CAN) {
    if (PROTECTED[page] && !authed) { location.replace('login.html'); return; }
    if (page === 'login' && authed) { location.replace('dashboard.html'); return; }
    if ((page === 'verify' || page === 'pin') && !S.get('target')) { location.replace('login.html'); return; }
  }

  var fmt = function (n) { return Math.max(0, n).toLocaleString('ru-RU') + ' ₽'; };
  var GOALS = {
    georgia: { title: 'Отпуск в Грузии', cur: 92000, target: 140000 },
    cushion: { title: 'Подушка безопасности', cur: 154500, target: 300000 }
  };
  var params = new URLSearchParams(location.search), gid = GOALS[params.get('id')] ? params.get('id') : 'georgia', goal = GOALS[gid];
  var $ = function (s) { return document.querySelector(s); };

  window.Goal = {
    cur: goal.cur,
    render: function (cur) {
      var pct = Math.floor(cur / goal.target * 100);
      var set = function (id, f) { var el = document.getElementById(id); if (el) f(el); };
      set('goalPct', function (e) { e.textContent = pct + '%'; });
      set('goalBar', function (e) { e.style.width = Math.min(100, pct) + '%'; });
      set('goalLeft', function (e) { e.textContent = 'Осталось ' + fmt(goal.target - cur); });
      set('goalTarget', function (e) { e.textContent = '/ ' + fmt(goal.target); });
    }
  };

  var pinFirst = null;
  window.Auth = {
    afterVerify: function () {
      if (S.get('pin')) { S.set('auth', '1'); location.replace('dashboard.html'); } else { location.href = 'pin.html'; }
    },
    afterPin: function (code) {
      var h = $('h2'), cta = document.getElementById('verifyCta');
      setTimeout(function () { cta.innerHTML = '<span>Подтвердить</span><span class="material-symbols-outlined text-[20px]">arrow_forward</span>'; }, 0);
      if (pinFirst === null) { pinFirst = code; clearAll(); h.textContent = 'Повторите ПИН-код'; return; }
      if (pinFirst === code) { S.set('pin', '1'); S.set('auth', '1'); location.replace('dashboard.html'); return; }
      pinFirst = null; clearAll(); h.textContent = 'ПИН-коды не совпали. Попробуйте снова';
    }
  };

  function toast(t) {
    var d = document.createElement('div');
    d.className = 'fixed left-1/2 -translate-x-1/2 bottom-28 z-[70] px-4 py-2 rounded-full bg-inverse-surface text-inverse-on-surface text-sm shadow-lg';
    d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 1800);
  }
  function bad(el) { el.classList.add('ring-2', 'ring-error'); setTimeout(function () { el.classList.remove('ring-2', 'ring-error'); }, 1200); }

  document.addEventListener('DOMContentLoaded', function () {
    var back = { scenario: 'scenarios.html', create: 'dashboard.html', verify: 'login.html', pin: 'verify.html', login: 'login.html' };
    // кнопка «Назад»
    var b = $('[data-back]');
    if (b) {
      if (page === 'login') b.style.visibility = 'hidden';
      b.addEventListener('click', function () { if (history.length > 1) history.back(); else location.href = back[page] || 'dashboard.html'; });
    }
    // нижнее меню
    var map = { dashboard: 'dashboard.html', scenarios: 'scenarios.html', 'create-scenario': 'create.html', analytics: 'analytics.html' };
    document.querySelectorAll('nav [data-path]').forEach(function (a) {
      var key = a.getAttribute('data-path'); a.setAttribute('href', map[key]);
      if (key === 'create-scenario') return;
      var on = key === page;
      a.classList.toggle('text-primary', on); a.classList.toggle('font-semibold', on);
      a.classList.toggle('text-on-surface-variant', !on); a.classList.toggle('hover:text-on-surface', !on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    // клики по карточкам и кнопкам с data-href
    document.querySelectorAll('[data-href]').forEach(function (el) {
      el.classList.add('cursor-pointer');
      el.addEventListener('click', function () { location.href = el.getAttribute('data-href'); });
    });
    // уведомления и меню цели
    document.querySelectorAll('[aria-label="Уведомления"]').forEach(function (e) { e.addEventListener('click', function () { toast('У вас 3 новых уведомления'); }); });
    var mb = document.getElementById('scenarioMenuBtn'); if (mb) mb.addEventListener('click', function () { toast('Меню цели скоро появится'); });
    // профиль → выход
    var av = $('header img[alt="Профиль"]');
    if (av && PROTECTED[page]) {
      var box = av.parentElement; box.style.cursor = 'pointer';
      box.addEventListener('click', function (e) {
        e.stopPropagation();
        var old = document.getElementById('profileMenu'); if (old) { old.remove(); return; }
        var t = {}; try { t = JSON.parse(S.get('target')) || {}; } catch (x) {}
        var m = document.createElement('div'); m.id = 'profileMenu';
        m.className = 'fixed right-4 top-16 z-[60] w-52 rounded-2xl bg-surface-container-lowest border border-surface-variant/60 shadow-xl p-1';
        m.innerHTML = '<div class="px-3 py-2"><div class="font-bold text-sm">Анна</div><div class="text-xs text-on-surface-variant truncate">' + (t.value || '') + '</div></div>' +
          '<button id="logoutBtn" class="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-error hover:bg-error-container/50 text-sm font-semibold" type="button"><span class="material-symbols-outlined text-[18px]">logout</span>Выйти</button>';
        document.body.appendChild(m);
        document.getElementById('logoutBtn').onclick = function () { S.del('auth'); location.replace('login.html'); };
      });
      document.addEventListener('click', function () { var m = document.getElementById('profileMenu'); if (m) m.remove(); });
    }

    if (page === 'login') {
      var ph = $('#phone-input');
      var go = function (type, val) { S.set('target', JSON.stringify({ type: type, value: val })); location.href = 'verify.html'; };
      $('#submit-btn').addEventListener('click', function () {
        if (ph.value.replace(/\D/g, '').length < 10) { bad(ph.parentElement); ph.focus(); return; }
        go('phone', '+375 ' + ph.value);
      });
      ph.addEventListener('keydown', function (e) { if (e.key === 'Enter') $('#submit-btn').click(); });
      var em = $('#email-input');
      $('#email-container button').addEventListener('click', function () {
        if (!/^\S+@\S+\.\S+$/.test(em.value)) { bad(em.parentElement); em.focus(); return; }
        go('email', em.value);
      });
      if (/mode=register/.test(location.search)) {
        $('h1').textContent = 'Регистрация';
        $('header span.font-semibold').textContent = 'Регистрация';
        $('h1').nextElementSibling.textContent = 'Создайте копилку за минуту';
        $('a[href*="mode=register"]').parentElement.innerHTML = 'Уже есть аккаунт? <a class="font-semibold text-primary hover:text-primary-container transition-colors ml-1" href="login.html">Войти</a>';
      }
    }

    if (page === 'verify') {
      var t = {}; try { t = JSON.parse(S.get('target')) || {}; } catch (x) {}
      if (t.value) $('#phoneDisplay').textContent = t.value;
      if (t.type === 'email') $('#phoneDisplay').closest('div.inline-flex').previousElementSibling.textContent = 'Мы отправили 4-значный код на почту';
    }

    if (page === 'scenario') {
      var q = function (id) { return document.getElementById(id); };
      if (gid === 'cushion') {
        q('goalTitle').textContent = goal.title;
        q('goalChips').innerHTML = '<span class="inline-flex items-center gap-1 bg-surface-container-high text-on-surface text-label-md px-2 py-0.5 rounded-full"><span class="material-symbols-outlined text-[14px] text-primary">shield</span>Финансовая подушка</span>';
        q('goalCountdown').innerHTML = '<div class="flex items-center gap-space-sm"><span class="material-symbols-outlined text-[20px] text-primary">event</span><span class="text-body-sm font-medium text-on-surface">Срок накопления • 6 месяцев</span></div>';
        q('heroAmount').textContent = fmt(goal.cur);
        var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
        while ((n = w.nextNode())) n.nodeValue = n.nodeValue.replace('Сдача летит прямиком в авиабилеты', 'Сдача летит прямиком в подушку безопасности').replace('в грузинский сейф', 'в подушку безопасности');
      }
      window.Goal.render(goal.cur);
      var rb = q('rulesModalBtn'); if (rb) rb.addEventListener('click', function () { location.href = 'create.html?id=' + gid; });
      if (location.hash === '#deposit') q('addFundsBtn').click();
    }

    if (page === 'create') {
      if (params.get('id')) { $('#scenario-name').value = goal.title; $('#target-amount').value = goal.target.toLocaleString('ru-RU'); }
      $('#activate-btn').addEventListener('click', function () { setTimeout(function () { location.href = 'dashboard.html'; }, 1300); });
    }
  });
})();
