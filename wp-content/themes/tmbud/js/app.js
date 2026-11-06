/* TM-BUD: menu mobilne, dolny pasek, karuzele zdjęć, formularz. Bez bibliotek. */

/* menu mobilne */
(function () {
  var h = document.querySelector('.ham'), p = document.getElementById('panel');
  if (!h || !p) return;
  function ustaw(o) {
    h.setAttribute('aria-expanded', o ? 'true' : 'false');
    h.setAttribute('aria-label', o ? 'Zamknij menu' : 'Menu');
    p.classList.toggle('otwarte', o);
    document.documentElement.classList.toggle('menu-otwarte', o);
  }
  h.addEventListener('click', function () { ustaw(h.getAttribute('aria-expanded') !== 'true'); });
  p.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { ustaw(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') ustaw(false); });
  var mq = window.matchMedia('(min-width:1061px)');
  var zmiana = function (e) { if (e.matches) ustaw(false); };
  if (mq.addEventListener) mq.addEventListener('change', zmiana); else if (mq.addListener) mq.addListener(zmiana);
})();

/* dolny pasek na telefonie: dopiero po przewinięciu za przyciski z pierwszego ekranu, chowany przy formularzu */
(function () {
  var m = document.querySelector('.mob');
  if (!m || !('IntersectionObserver' in window)) return;
  var cel = document.querySelector('.hero-cta') || document.querySelector('.pod-nag') || document.querySelector('.top');
  var k = document.getElementById('kontakt') || document.querySelector('.cta');
  var zaCelem = false, przyKontakcie = false;
  function odsw() {
    var w = zaCelem && !przyKontakcie;
    m.classList.toggle('widac', w);
    m.setAttribute('aria-hidden', w ? 'false' : 'true');
    m.querySelectorAll('a').forEach(function (a) { a.tabIndex = w ? 0 : -1; });
  }
  new IntersectionObserver(function (e) { zaCelem = !e[0].isIntersecting && e[0].boundingClientRect.top < 0; odsw(); }).observe(cel);
  if (k) new IntersectionObserver(function (e) { przyKontakcie = e[0].isIntersecting; odsw(); }, { threshold: 0.05 }).observe(k);
})();

/* karuzele zdjęć w kartach: palec (przewijanie z przyciąganiem), mysz (przeciąganie), strzałki, klawiatura */
(function () {
  document.querySelectorAll('[data-karuzela]').forEach(function (k) {
    var tor = k.querySelector('.fot-tor'), licz = k.querySelector('.fot-licz');
    var kl = tor.children, ile = kl.length;
    function nr() { return Math.round(tor.scrollLeft / Math.max(1, tor.clientWidth)); }
    function idz(i) {
      i = Math.max(0, Math.min(ile - 1, i));
      tor.scrollTo({ left: i * tor.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    function odsw() {
      var i = nr();
      if (licz) licz.textContent = (i + 1) + '/' + ile;
      k.classList.toggle('na-poczatku', i <= 0);
      k.classList.toggle('na-koncu', i >= ile - 1);
    }
    k.querySelector('.fot-prev').addEventListener('click', function () { idz(nr() - 1); });
    k.querySelector('.fot-next').addEventListener('click', function () { idz(nr() + 1); });
    tor.addEventListener('scroll', function () { window.requestAnimationFrame(odsw); }, { passive: true });
    tor.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); idz(nr() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); idz(nr() - 1); }
    });
    /* przeciąganie myszą */
    var start = null, poczL = 0, ruch = false;
    tor.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      start = e.clientX; poczL = tor.scrollLeft; ruch = false;
      tor.classList.add('ciagniete');
    });
    window.addEventListener('pointermove', function (e) {
      if (start === null) return;
      var dx = e.clientX - start;
      if (Math.abs(dx) > 4) ruch = true;
      tor.scrollLeft = poczL - dx;
    });
    window.addEventListener('pointerup', function (e) {
      if (start === null) return;
      var dx = e.clientX - start, i = Math.round(poczL / Math.max(1, tor.clientWidth));
      start = null;
      tor.classList.remove('ciagniete');
      if (Math.abs(dx) > tor.clientWidth * 0.12) i += dx < 0 ? 1 : -1;
      idz(i);
    });
    /* przeciągnięcie nie może działać jak kliknięcie */
    tor.addEventListener('click', function (e) { if (ruch) { e.preventDefault(); e.stopPropagation(); ruch = false; } }, true);
    tor.addEventListener('dragstart', function (e) { e.preventDefault(); });
    odsw();
  });
})();

/* formularz zapytania: wysyłka bez przeładowania; w wersji testowej tylko pokaz */
(function () {
  var f = document.getElementById('formularz');
  if (!f) return;
  var info = f.querySelector('.form-info'), btn = f.querySelector('button[type=submit]');
  function pokaz(t, ok) { info.textContent = t; info.classList.toggle('ok', !!ok); info.classList.toggle('blad', !ok); }
  f.addEventListener('submit', function (e) {
    var kon = f.kontakt.value.trim(), tr = f.tresc.value.trim();
    if (!kon || !tr) {
      e.preventDefault();
      pokaz('Podaj telefon lub e-mail i krótko opisz zapytanie.', false);
      (kon ? f.tresc : f.kontakt).focus();
      return;
    }
    if (!/@.+\./.test(kon) && (kon.match(/\d/g) || []).length < 9) {
      e.preventDefault();
      pokaz('Sprawdź telefon lub e-mail - wygląda na niepełny.', false);
      f.kontakt.focus();
      return;
    }
    if (f.getAttribute('data-tryb') === 'demo') {
      e.preventDefault();
      pokaz('To wersja testowa strony - wiadomość nie została wysłana. Po uruchomieniu na tm-bud.pl zapytanie trafi na skrzynkę firmy.', true);
      return;
    }
    if (!window.fetch || !window.FormData) return; /* zwykła wysyłka formularza */
    e.preventDefault();
    var dane = new FormData(f);
    dane.append('ajax', '1');
    btn.disabled = true;
    pokaz('Wysyłam...', true);
    fetch(f.getAttribute('action'), { method: 'POST', body: dane, credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        pokaz(j.msg || (j.ok ? 'Dziękujemy, zapytanie zostało wysłane.' : 'Coś poszło nie tak. Prosimy zadzwonić.'), j.ok);
        if (j.ok) f.reset();
      })
      .catch(function () { pokaz('Nie udało się wysłać. Prosimy zadzwonić lub napisać e-mail.', false); })
      .then(function () { btn.disabled = false; });
  });
})();
