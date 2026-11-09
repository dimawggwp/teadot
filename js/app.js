(function () {
  'use strict';
  var MENU = window.TEADOT_MENU, CITIES = window.TEADOT_CITIES, LOCS = window.TEADOT_LOCATIONS, I18N = window.TEADOT_I18N;
  var LANGS = ['ru', 'kk', 'en'];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  var state = {
    lang: LANGS.indexOf(store('teadot.lang')) >= 0 ? store('teadot.lang') : 'ru',
    city: CITIES.some(function (c) { return c.id === store('teadot.city'); }) ? store('teadot.city') : null,
    query: ''
  };

  var t = function (k) { return I18N[state.lang][k] || I18N.ru[k] || ''; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var city = function () { return CITIES.filter(function (c) { return c.id === state.city; })[0] || CITIES[0]; };
  var locsIn = function (id) { return LOCS.filter(function (l) { return l.city === id; }); };
  var price = function (n) { return n.toLocaleString('ru-RU').replace(/,/g, ' ') + ' ₸'; };
  var sizeLabel = function (s) {
    if (!s) return '';
    if (/pcs$/.test(s)) return parseInt(s, 10) + ' ' + t('pcs');
    return (state.lang === 'en' ? s : s.replace('.', ',')) + ' ' + t('l');
  };
  function plural(n) {
    if (state.lang !== 'ru') return n === 1 ? t('places1') : t('places5');
    var a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return t('places1');
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return t('places2');
    return t('places5');
  }
  function woltUrl(u) { return u.replace('/ru/kaz/', '/' + state.lang + '/kaz/'); }
  /* Прямая ссылка на товар в Wolt. ID товаров взяты из меню TEADOT Абая (Алматы),
     поэтому для Алматы открывается сразу выбранный напиток нужного размера. */
  var ITEM_VENUE = 'https://wolt.com/ru/kaz/almaty/venue/teadot-teahouse';
  function itemWolt(size) {
    var c = city();
    if (c.id === 'almaty') return { url: woltUrl(ITEM_VENUE + '/itemid-' + size.img.replace('.jpg', '')), direct: true };
    return { url: woltUrl(c.wolt), direct: false };
  }

  /* ---------- Тексты ---------- */
  function applyTexts() {
    document.documentElement.lang = state.lang;
    $$('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    $$('[data-i18n-html]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    $$('[data-i18n-ph]').forEach(function (el) { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
    $$('[data-lang-switch]').forEach(function (box) {
      box.innerHTML = LANGS.map(function (l) {
        return '<button type="button" data-lang="' + l + '" class="' + (l === state.lang ? 'on' : '') + '">' + I18N[l].langName + '</button>';
      }).join('');
    });
    $('#statItems').textContent = MENU.reduce(function (n, c) { return n + c.items.length; }, 0) + '+';
    $('#statPlaces').textContent = LOCS.filter(function (l) { return !l.soon; }).length;
    $('#statCities').textContent = CITIES.filter(function (c) { return locsIn(c.id).length; }).length;
    $('#year').textContent = new Date().getFullYear();
  }

  /* ---------- Город ---------- */
  function renderGate() {
    var withPts = CITIES.filter(function (c) { return locsIn(c.id).length; });
    var other = CITIES.filter(function (c) { return !locsIn(c.id).length; });
    $('#gateMain').innerHTML = withPts.map(function (c) {
      var n = locsIn(c.id).length;
      return '<button type="button" class="gate__city' + (c.id === state.city ? ' on' : '') + '" data-city="' + c.id + '"><b>' + esc(c.name[state.lang]) + '</b><small>' + n + ' ' + plural(n) + '</small></button>';
    }).join('');
    $('#gateOther').innerHTML = other.map(function (c) {
      return '<button type="button" class="gate__city gate__city--sm' + (c.id === state.city ? ' on' : '') + '" data-city="' + c.id + '">' + esc(c.name[state.lang]) + '</button>';
    }).join('');
  }
  function openGate() { renderGate(); $('#gate').hidden = false; document.body.classList.add('lock'); }
  function closeGate() { $('#gate').hidden = true; document.body.classList.remove('lock'); }
  function setCity(id) {
    state.city = id; store('teadot.city', id);
    closeGate(); renderCity();
  }
  function renderCity() {
    var c = city();
    $('#cityName').textContent = c.name[state.lang];
    $('#placesCity').textContent = c.name[state.lang];
    $$('[data-wolt]').forEach(function (a) { a.href = woltUrl(c.wolt); });
    renderPlaces();
  }

  /* ---------- Меню ---------- */
  function renderCats() {
    $('#catsIn').innerHTML = MENU.map(function (c) {
      return '<a href="#cat-' + c.id + '" data-cat="' + c.id + '"><img src="images/menu/' + c.img + '" alt="" loading="lazy">' + esc(c.name[state.lang]) + '</a>';
    }).join('');
    updateCatsArrows();
    $('#footerCats').innerHTML = MENU.slice(0, 7).map(function (c) { return '<a href="#cat-' + c.id + '">' + esc(c.name[state.lang]) + '</a>'; }).join('');
    var names = MENU.map(function (c) { return c.name[state.lang]; });
    var row = names.concat(names).map(function (n) { return '<span>' + esc(n) + '</span><i class="cube"></i>'; }).join('');
    $('#marquee').innerHTML = row + row;
  }

  function card(item, ci, ii) {
    var first = item.sizes[0], multi = item.sizes.length > 1;
    var pills = multi ? '<div class="card__sizes">' + item.sizes.map(function (s) { return '<span>' + sizeLabel(s.size) + '</span>'; }).join('') + '</div>' : (first.size ? '<div class="card__sizes"><span>' + sizeLabel(first.size) + '</span></div>' : '');
    return '<article class="card" data-open="' + ci + ':' + ii + '" tabindex="0">' +
      '<div class="card__img"><img src="images/menu/' + first.img + '" alt="' + esc(item.name[state.lang]) + '" loading="lazy"></div>' +
      '<div class="card__body"><h4>' + esc(item.name[state.lang]) + '</h4>' +
      (item.desc[state.lang] ? '<p>' + esc(item.desc[state.lang]) + '</p>' : '<p class="muted"></p>') +
      '<div class="card__foot">' + pills + '<div class="card__price">' + (multi ? '<small>' + t('from') + '</small> ' : '') + price(first.price) + '</div><span class="card__plus" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></span></div></div></article>';
  }

  /* На телефоне меню работает вкладками: показывается одна категория */
  var mq = window.matchMedia('(max-width: 760px)');
  var tabMode = function () { return mq.matches && !state.query.trim(); };
  state.cat = MENU[0].id;
  function highlightCat(id) {
    $$('#catsIn a').forEach(function (a) {
      var on = a.getAttribute('data-cat') === id;
      a.classList.toggle('on', on);
      if (on) { var box = $('#cats'); box.scrollTo({ left: a.offsetLeft - (box.clientWidth - a.offsetWidth) / 2, behavior: 'smooth' }); }
    });
  }
  function renderMenu() {
    var q = state.query.trim().toLowerCase(), html = '', total = 0, tabs = tabMode();
    MENU.forEach(function (c, ci) {
      if (tabs && c.id !== state.cat) return;
      var items = c.items.map(function (it, ii) { return [it, ii]; }).filter(function (p) {
        if (!q) return true;
        var it = p[0];
        return LANGS.some(function (l) { return (it.name[l] + ' ' + it.desc[l]).toLowerCase().indexOf(q) >= 0; });
      });
      if (!items.length) return;
      total += items.length;
      html += '<div class="cat-block" id="cat-' + c.id + '"><div class="cat-block__head"><img src="images/menu/' + c.img + '" alt=""><h3>' + esc(c.name[state.lang]) + '</h3><span>' + items.length + '</span></div>' +
        '<div class="grid">' + items.map(function (p) { return card(p[0], ci, p[1]); }).join('') + '</div>' +
        (tabs && MENU[ci + 1] ? '<button type="button" class="next-cat" data-tab="' + MENU[ci + 1].id + '"><span>' + t('nextCat') + '</span><b>' + esc(MENU[ci + 1].name[state.lang]) + '</b><svg viewBox="0 0 24 24" width="20" height="20"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' : '') +
        '</div>';
    });
    $('#menuBody').innerHTML = total ? html : '<div class="empty">' + t('nothing') + '</div>';
    if (tabs) { if (catObserver) catObserver.disconnect(); highlightCat(state.cat); } else observeCats();
  }

  function updateCatsArrows() {
    var sc = $('#cats'), w = sc.parentNode;
    var l = sc.scrollLeft > 4, r = sc.scrollLeft + sc.clientWidth < sc.scrollWidth - 4;
    w.classList.toggle('can-l', l); w.classList.toggle('can-r', r);
    sc.classList.toggle('fade-l', l); sc.classList.toggle('fade-r', r);
  }
  var catObserver;
  function observeCats() {
    if (catObserver) catObserver.disconnect();
    if (!('IntersectionObserver' in window)) return;
    catObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        highlightCat(e.target.id.replace('cat-', ''));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('.cat-block').forEach(function (b) { catObserver.observe(b); });
  }

  /* ---------- Модалка ---------- */
  var current = null;
  function openItem(ci, ii) {
    var c = MENU[ci], it = c.items[ii];
    current = { it: it, size: 0 };
    $('#mCat').textContent = c.name[state.lang];
    $('#mName').textContent = it.name[state.lang];
    $('#mDesc').textContent = it.desc[state.lang] || '';
    $('#mImg').alt = it.name[state.lang];
    $('#mSizes').innerHTML = it.sizes.length > 1 || it.sizes[0].size ? it.sizes.map(function (s, i) {
      return '<button type="button" data-size="' + i + '">' + sizeLabel(s.size) + '<small>' + price(s.price) + '</small></button>';
    }).join('') : '';
    pickSize(0);
    $('#modal').hidden = false; document.body.classList.add('lock');
  }
  function pickSize(i) {
    current.size = i;
    var s = current.it.sizes[i];
    $('#mImg').src = 'images/menu/' + s.img;
    $('#mPrice').textContent = price(s.price);
    var w = itemWolt(s);
    $('#mWolt').href = w.url;
    $('#mNote').textContent = w.direct ? '' : t('noteItem').replace('{x}', current.it.name[state.lang] + (s.size ? ' ' + sizeLabel(s.size) : ''));
    $$('#mSizes button').forEach(function (b) { b.classList.toggle('on', +b.getAttribute('data-size') === i); });
  }
  function closeModal() { $('#modal').hidden = true; document.body.classList.remove('lock'); }

  /* ---------- Карта и точки ---------- */
  /* Карта — официальный виджет Яндекс Карт (без API-ключа), все точки города с номерами */
  var activeLoc = -1;
  function fitView(list, c) {
    if (!list.length) return { ll: c.center[1] + ',' + c.center[0], z: c.zoom };
    if (list.length === 1) return { ll: list[0].lon + ',' + list[0].lat, z: 16 };
    var lats = list.map(function (l) { return l.lat; }), lons = list.map(function (l) { return l.lon; });
    var minLa = Math.min.apply(0, lats), maxLa = Math.max.apply(0, lats), minLo = Math.min.apply(0, lons), maxLo = Math.max.apply(0, lons);
    var box = $('#map'), W = Math.max(box.clientWidth, 300), H = Math.max(box.clientHeight, 300);
    var midLa = (minLa + maxLa) / 2, k = Math.cos(midLa * Math.PI / 180);
    var zx = Math.log2((W - 140) * 360 / (256 * Math.max(maxLo - minLo, 1e-4)));
    var zy = Math.log2((H - 160) * 360 * k / (256 * Math.max(maxLa - minLa, 1e-4)));
    return { ll: ((minLo + maxLo) / 2) + ',' + midLa, z: Math.max(10, Math.min(16, Math.floor(Math.min(zx, zy)))) };
  }
  function drawMap(focus) {
    var c = city(), list = locsIn(c.id);
    var pts = list.map(function (l, i) { return l.lon + ',' + l.lat + ''; }).join('~');
    var v = focus != null && list[focus] ? { ll: list[focus].lon + ',' + list[focus].lat, z: 16 } : fitView(list, c);
    var src = 'https://yandex.kz/map-widget/v1/?ll=' + v.ll + '&z=' + v.z + (pts ? '&pt=' + pts : '') + '&l=map&lang=' + (state.lang === 'en' ? 'en_US' : 'ru_RU');
    var frame = $('#map');
    if (frame.getAttribute('src') !== src) frame.setAttribute('src', src);
  }
  function setActive(i) {
    activeLoc = i;
    $$('.place').forEach(function (p) { p.classList.toggle('on', +p.getAttribute('data-loc') === i); });
    drawMap(i);
  }
  function renderPlaces() {
    var c = city(), list = locsIn(c.id), box = $('#placesList');
    if (!list.length) {
      var others = CITIES.filter(function (x) { return locsIn(x.id).length; });
      box.innerHTML = '<div class="noplaces"><div class="noplaces__ic">🧋</div><h3>' + t('noPlacesT') + '</h3><p>' + t('noPlaces') + '</p><div class="noplaces__cities">' +
        others.map(function (x) { return '<button type="button" data-city="' + x.id + '">' + esc(x.name[state.lang]) + ' · ' + locsIn(x.id).length + '</button>'; }).join('') + '</div></div>';
    } else {
      box.innerHTML = list.map(function (l, i) {
        var g = 'https://www.google.com/maps/dir/?api=1&destination=' + l.lat + ',' + l.lon;
        var gis = l.gis || ('https://2gis.kz/search/' + encodeURIComponent('TEADOT ' + l.addr.ru));
        return '<div class="place" data-loc="' + i + '"><div class="place__n"><img src="images/brand/mark.jpg" alt=""></div><div class="place__body">' +
          '<h4>' + esc(l.name) + (l.soon ? ' <span class="place__soon">' + t('soonOpen') + '</span>' : (l.rating ? ' <span class="place__r">★ ' + l.rating.toFixed(1) + '</span>' : '')) + '</h4>' +
          '<p>' + esc(l.addr[state.lang]) + '</p>' +
          (l.hours ? '<p class="muted">' + t('hours') + ': ' + l.hours + '</p>' : '') +
          '<div class="place__actions">' +
          (l.soon ? '' : '<a class="chip chip--dark" href="' + woltUrl(l.wolt || c.wolt) + '" target="_blank" rel="noopener">Wolt</a>') +
          '<a class="chip" href="' + g + '" target="_blank" rel="noopener">Google Maps</a>' +
          '<a class="chip" href="' + gis + '" target="_blank" rel="noopener">2GIS</a>' +
          '<a class="chip" href="https://yandex.kz/maps/?rtext=~' + l.lat + ',' + l.lon + '" target="_blank" rel="noopener">' + t('route') + '</a>' +
          (l.phone ? '<a class="chip" href="tel:' + l.phone + '">' + l.phone.replace(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/, '+7 $1 $2 $3 $4') + '</a>' : '') +
          '</div></div></div>';
      }).join('');
    }
    activeLoc = -1;
    drawMap();
  }

  /* ---------- События ---------- */
  document.addEventListener('click', function (e) {
    var el;
    if ((el = e.target.closest('[data-lang]'))) {
      state.lang = el.getAttribute('data-lang'); store('teadot.lang', state.lang);
      applyTexts(); renderCats(); renderMenu(); renderCity();
      if (!$('#gate').hidden) renderGate();
      return;
    }
    if ((el = e.target.closest('[data-city]'))) { setCity(el.getAttribute('data-city')); return; }
    if (e.target.closest('#cityBtn, #cityBtn2')) { openGate(); return; }
    if ((el = e.target.closest('[data-open]'))) { var p = el.getAttribute('data-open').split(':'); openItem(+p[0], +p[1]); return; }
    if ((el = e.target.closest('[data-size]'))) { pickSize(+el.getAttribute('data-size')); return; }
    if ((el = e.target.closest('[data-tab]')) || ((el = e.target.closest('#catsIn a')) && tabMode())) {
      e.preventDefault();
      state.cat = el.getAttribute('data-tab') || el.getAttribute('data-cat');
      renderMenu();
      var top = $('#menuBody').getBoundingClientRect().top + window.scrollY - $('.cats').offsetHeight - $('#header').offsetHeight - 8;
      window.scrollTo({ top: top, behavior: 'smooth' });
      return;
    }
    if ((el = e.target.closest('[data-scroll]'))) { var sc = $('#cats'); sc.scrollBy({ left: +el.getAttribute('data-scroll') * sc.clientWidth * 0.7, behavior: 'smooth' }); return; }
    if (e.target.closest('[data-close]')) { closeModal(); return; }
    if ((el = e.target.closest('.place')) && !e.target.closest('a')) {
      var idx = +el.getAttribute('data-loc');
      if (idx === activeLoc) { activeLoc = -1; el.classList.remove('on'); drawMap(); } else setActive(idx);
      if (window.innerWidth < 1080 && window.innerWidth > 760) $('.places__map').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (!$('#modal').hidden) closeModal(); else if (!$('#gate').hidden && state.city) closeGate(); }
    if (e.key === 'Enter' && e.target.matches('[data-open]')) e.target.click();
  });
  $('#gate').addEventListener('click', function (e) { if (e.target.id === 'gate' && state.city) closeGate(); });
  $('#cats').addEventListener('scroll', updateCatsArrows, { passive: true });
  window.addEventListener('resize', updateCatsArrows);
  (mq.addEventListener ? mq.addEventListener('change', renderMenu) : mq.addListener(renderMenu));
  $('#search').addEventListener('input', function (e) { state.query = e.target.value; renderMenu(); });
  window.addEventListener('scroll', function () { $('#header').classList.toggle('scrolled', window.scrollY > 10); }, { passive: true });

  /* ---------- Старт ---------- */
  applyTexts(); renderCats(); renderMenu(); renderCity();
  if (!state.city) openGate();
})();
