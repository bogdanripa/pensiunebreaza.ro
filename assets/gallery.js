/* Casa Rodica — shared gallery lightbox.
   Opens images in place (any page), navigates within the clicked photo's category,
   loops within it, and closes back to where you were. Falls back to gallery
   navigation if this script doesn't run. */
(function () {
  var items = window.RODICA_GALLERY || [];
  var omittedLiving = {
    'living-02.jpg': true,
    'living-03.jpg': true,
    'living-05.jpg': true,
    'living-06.jpg': true,
    'living-07.jpg': true
  };
  items = items.filter(function (it) { return !omittedLiving[it.file]; });
  items.forEach(function (it) {
    if (it.g === 'Foișor & grătar' || it.g === 'Living & semineu') {
      it.g = 'Living & pavilion';
    }
  });
  if (!items.length) return;

  // On the full gallery page, merge the pavilion and selected living photos
  // into one visible group and remove near-duplicate living angles.
  var groups = Array.prototype.slice.call(document.querySelectorAll('.gal-group'));
  var pavilionGroup = groups.find(function (group) {
    var heading = group.querySelector('h2');
    return heading && heading.textContent.trim() === 'Foișor & grătar';
  });
  var livingGroup = groups.find(function (group) {
    var heading = group.querySelector('h2');
    return heading && heading.textContent.trim() === 'Living & semineu';
  });
  if (pavilionGroup && livingGroup) {
    Object.keys(omittedLiving).forEach(function (file) {
      var id = file.replace(/\.jpg$/, '');
      var thumb = livingGroup.querySelector('#' + id);
      if (thumb) thumb.remove();
    });
    var pavilionGrid = pavilionGroup.querySelector('.gal-grid');
    var livingGrid = livingGroup.querySelector('.gal-grid');
    Array.prototype.slice.call(livingGrid.children).forEach(function (thumb) {
      pavilionGrid.appendChild(thumb);
    });
    pavilionGroup.querySelector('h2').textContent = 'Living & pavilion';
    pavilionGroup.querySelector('.count').textContent = pavilionGrid.children.length + ' foto';
    livingGroup.remove();
  }

  var byName = {};
  items.forEach(function (it, i) {
    byName[it.file.replace(/\.jpg$/, '')] = i;
    byName[it.file] = i;
  });

  var subsets = {
    firepit: {
      label: 'Seri în jurul focului',
      files: ['piscina-06.jpg', 'piscina-09.jpg', 'piscina-11.jpg', 'piscina-18.jpg', 'piscina-21.jpg']
    },
    sport: {
      label: 'Sport în aer liber',
      files: ['piscina-08.jpg', 'piscina-14.jpg', 'piscina-15.jpg', 'piscina-16.jpg', 'piscina-19.jpg', 'piscina-20.jpg']
    },
    poker: {
      label: 'Cramă cu masă de poker',
      files: ['biliard-03.jpg', 'biliard-08.jpg']
    }
  };

  function bounds(i) {
    var g = items[i].g, s = i, e = i;
    while (s > 0 && items[s - 1].g === g) s--;
    while (e < items.length - 1 && items[e + 1].g === g) e++;
    return [s, e];
  }

  var lb = document.createElement('div');
  lb.className = 'lb';
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Galerie foto Casa Rodica');
  lb.innerHTML =
    '<button class="lb-close" type="button" aria-label="Închide">×</button>' +
    '<button class="lb-btn lb-prev" type="button" aria-label="Imaginea anterioară"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>' +
    '<div class="lb-stage"><img alt=""></div>' +
    '<button class="lb-btn lb-next" type="button" aria-label="Imaginea următoare"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>' +
    '<div class="lb-cap"><span class="lb-capname"></span><span class="n lb-num"></span></div>';
  document.body.appendChild(lb);

  var img = lb.querySelector('.lb-stage img');
  var capn = lb.querySelector('.lb-capname');
  var num = lb.querySelector('.lb-num');
  var cur = 0, gs = 0, ge = 0, activeIndices = null, activeLabel = '';

  function render() {
    var it = items[cur];
    img.src = 'assets/images/' + it.file;
    img.alt = it.alt;
    capn.textContent = activeLabel || it.g;
    if (activeIndices) {
      num.textContent = (activeIndices.indexOf(cur) + 1) + ' / ' + activeIndices.length;
    } else {
      num.textContent = (cur - gs + 1) + ' / ' + (ge - gs + 1);
    }
  }
  function step(d) {
    if (activeIndices) {
      var pos = activeIndices.indexOf(cur) + d;
      if (pos >= activeIndices.length) pos = 0;
      else if (pos < 0) pos = activeIndices.length - 1;
      cur = activeIndices[pos];
      render();
      return;
    }
    cur += d;
    if (cur > ge) cur = gs;
    else if (cur < gs) cur = ge;
    render();
  }
  function open(i, subsetName) {
    cur = i;
    activeIndices = null;
    activeLabel = '';
    var subset = subsets[subsetName];
    if (subset) {
      activeIndices = subset.files.map(function (file) { return byName[file]; }).filter(function (idx) { return idx != null; });
      activeLabel = subset.label;
      if (activeIndices.indexOf(cur) < 0) cur = activeIndices[0];
    }
    var b = bounds(i); gs = b[0]; ge = b[1];
    render();
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  lb.querySelector('.lb-close').addEventListener('click', close);
  lb.querySelector('.lb-prev').addEventListener('click', function () { step(-1); });
  lb.querySelector('.lb-next').addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.classList.contains('lb-stage')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  });

  function nameFor(el) {
    var href = el.getAttribute && el.getAttribute('href');
    if (href && href.indexOf('#') >= 0) return decodeURIComponent(href.split('#')[1]);
    var im = el.querySelector && el.querySelector('img');
    if (im) return im.getAttribute('src').split('/').pop().replace(/\.jpg$/, '');
    return null;
  }

  // Intercept clicks on inline image links (any page) and gallery thumbs.
  document.querySelectorAll('a.imglink, .gthumb').forEach(function (el) {
    el.addEventListener('click', function (e) {
      var idx = byName[nameFor(el)];
      if (idx == null) return; // fall back to default (navigate) if unknown
      e.preventDefault();
      open(idx, el.getAttribute('data-gallery-subset'));
    });
  });

  // Direct URL deep-link (e.g. galerie.html#foisor-11 opened in a new tab).
  function fromHash() {
    var h = decodeURIComponent(location.hash.slice(1));
    if (!h) return;
    var idx = byName[h];
    if (idx != null) open(idx);
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
