/* Shared booking bar (Casa Rodica + Casa Alinka) — stay rules + Hoteliera redirect.
   Each page's <form class="bookbar"> sets its own engine via data-reserve-url.
   Ideal: Fri→Mon (weekend), Mon→Fri, 7+ nights.
   OK (mid-week): Mon→Wed, Mon→Thu, Tue→Thu. Min 2 nights. */
(function () {
  var RES_DEFAULT = 'https://guest.hoteliera.com/new-reservation?o=ro-vila-r-hqh4&location=vila-r-hqh4&lang=ro';
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function nightsTxt(n) { return n + ' ' + (n === 1 ? 'noapte' : 'nopți'); }

  function reserveUrl(base, ci, co) {
    var url = base;
    if (ci && co) url += (base.indexOf('?') >= 0 ? '&' : '?') + 'day_from=' + encodeURIComponent(ci) + '&day_to=' + encodeURIComponent(co);
    return url;
  }

  document.querySelectorAll('form.bookbar[data-booking]').forEach(function (form) {
    var RES_URL = form.getAttribute('data-reserve-url') || RES_DEFAULT;
    var ci = form.querySelector('input[name=ci]');
    var co = form.querySelector('input[name=co]');
    var g = form.querySelector('select[name=g]');
    var cta = form.querySelector('[data-book-cta]');
    var status = (form.parentNode || document).querySelector('[data-book-status]');
    if (!ci || !co || !cta) return;

    var today = new Date(); today.setHours(0, 0, 0, 0);
    ci.min = iso(today);

    function classify() {
      if (!ci.value || !co.value) return { k: 'empty' };
      var a = new Date(ci.value), b = new Date(co.value);
      var nights = Math.round((b - a) / 86400000);
      if (nights <= 0) return { k: 'bad' };
      var cd = a.getDay(), od = b.getDay(); // 0=Sun … 6=Sat
      if (nights >= 7) return { k: 'ideal', n: nights };
      if (cd === 5 && od === 0) return { k: 'ideal', n: nights }; // Fri → Sun (weekend)
      if (cd === 1 && od === 5) return { k: 'ideal', n: nights };              // Mon → Fri
      if (cd === 1 && od === 3) return { k: 'ok', n: nights };                 // Mon → Wed
      if (cd === 1 && od === 4) return { k: 'ok', n: nights };                 // Mon → Thu
      if (cd === 2 && od === 4) return { k: 'ok', n: nights };                 // Tue → Thu
      if (nights < 2) return { k: 'min' };
      return { k: 'other', n: nights };
    }

    function update() {
      if (ci.value) { var a = new Date(ci.value); a.setDate(a.getDate() + 1); co.min = iso(a); if (co.value && new Date(co.value) <= new Date(ci.value)) co.value = ''; }
      var r = classify(), cls = '', txt = '';
      if (r.k === 'empty') txt = 'Alege datele. Sejururi recomandate: weekend Vineri–Duminică, Luni–Vineri sau 7+ nopți.';
      else if (r.k === 'bad') { cls = 'bad'; txt = 'Check-out trebuie să fie după check-in.'; }
      else if (r.k === 'min') { cls = 'bad'; txt = 'Sejur minim 2 nopți.'; }
      else if (r.k === 'ideal') { cls = 'ideal'; txt = '✓ Perioadă ideală de sejur (' + nightsTxt(r.n) + ').'; }
      else if (r.k === 'ok') { cls = 'ok'; txt = '✓ Perioadă selectată — sejur mid-week (' + nightsTxt(r.n) + ').'; }
      else { cls = 'other'; txt = 'Combinație non-standard (' + nightsTxt(r.n) + '). Recomandăm weekend Vineri–Duminică, Luni–Vineri sau 7+ nopți.'; }
      if (status) { status.className = 'book-status' + (cls ? ' ' + cls : ''); status.textContent = txt; }
    }

    ci.addEventListener('change', update);
    co.addEventListener('change', update);
    if (g) g.addEventListener('change', update);
    cta.addEventListener('click', function (e) {
      e.preventDefault();
      var r = classify();
      if (r.k === 'bad' || r.k === 'min') { update(); (ci.value ? co : ci).focus(); return; }
      window.location.href = reserveUrl(RES_URL, ci.value, co.value);
    });
    update();
  });
})();
