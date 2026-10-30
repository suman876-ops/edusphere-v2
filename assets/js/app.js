/* EduSphere site behaviour: live data, filters, search, form, scroll. */
(function () {
  'use strict';

  var api = window.EduSphereApi;
  var search = window.EduSphereSearch;
  var grid = document.getElementById('module-grid');
  var state = { category: 'all', query: '', modules: [] };

  /* ------------------------------------------------------------ helpers */
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function hasSymbol(name) {
    return !!document.getElementById('i-' + name);
  }

  function icon(name) {
    var span = el('span', 'ico');
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'ic');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#i-' + (hasSymbol(name) ? name : 'layers'));
    svg.appendChild(use);
    span.appendChild(svg);
    return span;
  }

  /* ------------------------------------------------------------ modules */
  function moduleCard(item) {
    var card = el('div', 'card reveal');
    card.setAttribute('data-cat', item.category || 'core');
    card.appendChild(icon(item.icon));
    card.appendChild(el('h3', null, item.title));
    card.appendChild(el('p', null, item.description));
    return card;
  }

  function renderModules(items) {
    if (!grid) return;
    grid.innerHTML = '';
    if (!items.length) {
      grid.appendChild(el('p', 'empty-note', 'No modules are published yet.'));
      return;
    }
    items.forEach(function (item) {
      var card = moduleCard(item);
      card.classList.add('in');
      grid.appendChild(card);
    });
    applyFilters();
  }

  function showState(message, retry) {
    if (!grid) return;
    grid.innerHTML = '';
    var note = el('p', 'empty-note', message);
    grid.appendChild(note);
    if (retry) {
      var button = el('button', 'chip retry', 'Try again');
      button.type = 'button';
      button.style.marginTop = '14px';
      button.addEventListener('click', load);
      note.appendChild(document.createElement('br'));
      note.appendChild(button);
    }
  }

  function load() {
    showState('Loading modules…');
    api.modules()
      .then(function (items) {
        state.modules = items;
        renderModules(items);
        setStat('stat-modules', items.length);
      })
      .catch(function (error) {
        showState('Modules could not be loaded: ' + error.message, true);
        setStat('stat-modules', null);
      });
  }

  /* ---------------------------------------------------------- filtering */
  function applyFilters() {
    if (!grid) return;
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
    var shown = 0;

    cards.forEach(function (card) {
      var inCategory = state.category === 'all' || card.getAttribute('data-cat') === state.category;
      var text = card.textContent || '';
      var inQuery = !state.query || !search || search.matches(state.query, text);
      var visible = inCategory && inQuery;
      card.style.display = visible ? '' : 'none';
      if (visible) shown += 1;
    });

    var note = grid.querySelector('.empty-note');
    if (!shown && cards.length) {
      if (!note) {
        note = el('p', 'empty-note', 'No module matches that filter.');
        grid.appendChild(note);
      }
    } else if (note && cards.length) {
      note.remove();
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll('.chip[data-filter]'), function (chip) {
    chip.addEventListener('click', function () {
      Array.prototype.forEach.call(document.querySelectorAll('.chip[data-filter]'), function (c) {
        c.setAttribute('aria-pressed', String(c === chip));
      });
      state.category = chip.getAttribute('data-filter') || 'all';
      applyFilters();
    });
  });

  var searchInput = document.getElementById('module-search');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      state.query = searchInput.value || '';
      applyFilters();
    });
    searchInput.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        searchInput.value = '';
        state.query = '';
        applyFilters();
      }
    });
  }

  /* -------------------------------------------------------------- stats */
  function setStat(id, value) {
    var node = document.getElementById(id);
    if (!node) return;
    node.classList.remove('stat-pending');
    node.textContent = value == null ? '—' : String(value);
  }

  function structuralStats() {
    setStat('stat-portals', document.querySelectorAll('#access .card').length);
    setStat('stat-roles', document.querySelectorAll('#users .user').length);
    setStat('stat-stages', document.querySelectorAll('#lifecycle .tl').length);
  }

  /* ------------------------------------------------------------- notice */
  function loadNotice() {
    var card = document.getElementById('notice-card');
    if (!card) return;
    api.latestNotice()
      .then(function (notice) {
        if (!notice) return;
        document.getElementById('notice-ticker').textContent = notice.title;
        document.getElementById('notice-body').textContent = notice.body;
        var when = new Date(notice.published_at);
        document.getElementById('notice-date').textContent = when.toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric'
        });
        card.hidden = false;
      })
      .catch(function () {
        card.hidden = true;
      });
  }

  /* ------------------------------------------------------------ campuses */
  function loadCampuses() {
    var select = document.getElementById('f-campus');
    if (!select) return;
    api.campuses()
      .then(function (rows) {
        rows.forEach(function (row) {
          var option = document.createElement('option');
          option.value = row.slug;
          option.textContent = row.name;
          select.appendChild(option);
        });
      })
      .catch(function () { /* the field is optional; keep "Any campus" */ });
  }

  /* ------------------------------------------------------------- enquiry */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var status = document.getElementById('enquiry-status');
    var submit = document.getElementById('enquiry-submit');

    function say(message, tone) {
      status.textContent = message;
      status.className = 'form-status' + (tone ? ' ' + tone : '');
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.reportValidity()) return;

      var data = {
        full_name: form.full_name.value.trim(),
        email: form.email.value.trim().toLowerCase(),
        phone: form.phone.value.trim(),
        message: form.message.value.trim() || null
      };
      if (form.campus_slug.value) data.campus_slug = form.campus_slug.value;

      submit.disabled = true;
      say('Sending…');

      api.submitEnquiry(data)
        .then(function () {
          form.reset();
          say('Thank you — your enquiry has reached the admissions office.', 'ok');
        })
        .catch(function (error) {
          var text = String(error.message || '');
          if (text.indexOf('Too many enquiries') !== -1) {
            say('You have already sent several enquiries. Please wait an hour or call the office.', 'warn');
          } else {
            say('Could not send: ' + text, 'bad');
          }
        })
        .finally(function () {
          submit.disabled = false;
        });
    });
  }

  /* ------------------------------------------------------------- reveal */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

    reveals.forEach(function (node, index) {
      node.style.transitionDelay = Math.min(index % 6, 5) * 40 + 'ms';
      io.observe(node);
    });

    // grids and the timeline animate their children, so they need the class too
    Array.prototype.forEach.call(
      document.querySelectorAll('.grid, .timeline, .flow'),
      function (node) {
        node.classList.add('reveal');
        io.observe(node);
      }
    );
  } else {
    reveals.forEach(function (node) { node.classList.add('in'); });
  }

  /*
   * Safety net: if the observer never fires — an older browser, a restored
   * scroll position, a script that failed earlier — the page must still be
   * readable. Anything still hidden after a second and a half is shown.
   */
  setTimeout(function () {
    Array.prototype.forEach.call(document.querySelectorAll('.reveal:not(.in)'), function (node) {
      var box = node.getBoundingClientRect();
      if (box.top < window.innerHeight) node.classList.add('in');
    });
  }, 1500);

  /* ----------------------------------------------- progress + back to top */
  var bar = document.getElementById('bar');
  var toTop = document.getElementById('to-top');

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var top = doc.scrollTop || document.body.scrollTop || 0;
    if (bar) bar.style.width = (max > 0 ? (top / max) * 100 : 0) + '%';
    if (toTop) toTop.classList.toggle('show', top > 500);
  }

  var nav = document.querySelector('.nav');
  function navState() {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', navState, { passive: true });
  navState();

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------------------------------------------------------------- boot */
  /* -------------------------------------------------------- institutions */
  function loadColleges() {
    var grid = document.getElementById('college-grid');
    if (!grid) return;

    api.colleges()
      .then(function (rows) {
        grid.innerHTML = '';
        if (!rows.length) {
          grid.appendChild(el('p', 'empty-note', 'No institutions are published yet.'));
          return;
        }
        rows.forEach(function (college) {
          var card = el('div', 'card reveal');
          card.appendChild(icon('landmark'));

          card.appendChild(el('h3', null, college.name));

          if (college.campus_code) {
            var code = el('p', 'college-code', college.campus_code);
            card.appendChild(code);
          }

          var meta = [];
          if (college.established_year) meta.push('Est. ' + college.established_year);
          if (college.naac_grade) meta.push('NAAC ' + college.naac_grade);
          else meta.push('NAAC not accredited');
          if (meta.length) card.appendChild(el('p', null, meta.join(' · ')));

          if (college.college_type) card.appendChild(el('p', 'college-type', college.college_type));

          card.appendChild(el('p', null,
            college.departments + ' departments · ' + college.ug_programmes + ' UG and '
            + college.pg_programmes + ' PG programmes'));

          if (college.address) {
            card.appendChild(el('p', 'college-address',
              college.address + (college.pincode ? ' — ' + college.pincode : '')));
          }

          var facts = el('dl', 'college-facts');
          function fact(label, value, href) {
            if (!value) return;
            var row = el('div');
            row.appendChild(el('dt', null, label));
            var dd = el('dd');
            if (href) {
              var link = el('a', null, value);
              link.href = href;
              link.target = href.indexOf('http') === 0 ? '_blank' : null;
              if (link.target) link.rel = 'noopener';
              dd.appendChild(link);
            } else {
              dd.textContent = value;
            }
            row.appendChild(dd);
            facts.appendChild(row);
          }
          fact('Phone', college.phone, college.phone ? 'tel:' + college.phone.replace(/[^0-9+]/g, '') : null);
          fact('Email', college.email, college.email ? 'mailto:' + college.email : null);
          fact('Principal', college.principal, null);
          fact('Affiliation', college.affiliation, null);
          card.appendChild(facts);

          var actions = el('div', 'college-actions');
          if (college.website) {
            var site = el('a', 'tag', 'Official site ↗');
            site.href = college.website;
            site.target = '_blank';
            site.rel = 'noopener';
            actions.appendChild(site);
          }
          if (college.maps_url) {
            var map = el('a', 'tag', 'Map ↗');
            map.href = college.maps_url;
            map.target = '_blank';
            map.rel = 'noopener';
            actions.appendChild(map);
          }
          card.appendChild(actions);

          card.classList.add('in');
          grid.appendChild(card);
        });
      })
      .catch(function (error) {
        grid.innerHTML = '';
        grid.appendChild(el('p', 'empty-note', 'Institutions could not be loaded: ' + error.message));
      });
  }

  /* ----------------------------------------------------------- one website */
  function showView(name) {
    var site = document.querySelector('.view[data-view="site"]');
    var consoleView = document.getElementById('console');
    var portalView = document.getElementById('portal');
    if (!site || !consoleView) return;

    var onConsole = name === 'console';
    var onPortal = name === 'portal';

    site.hidden = onConsole || onPortal;
    consoleView.hidden = !onConsole;
    if (portalView) portalView.hidden = !onPortal;
    document.body.classList.toggle('in-console', onConsole || onPortal);

    if (onConsole && window.EduSphereConsole) window.EduSphereConsole.open();
    if (onPortal && window.EduSpherePortal) window.EduSpherePortal.open();
    window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-view-link], #nav-console, #cta-console, #nav-portal'), function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      showView(link.getAttribute('data-view-link') || 'console');
      history.replaceState(null, '', '#' + (link.getAttribute('data-view-link') || 'console'));
    });
  });

  window.EduSphereShowView = showView;

  /* --------------------------------------------------------- number count-up */
  function countUp(node) {
    var target = Number(node.textContent);
    if (!isFinite(target) || target <= 0) return;
    var start = performance.now();
    var duration = 900;

    function frame(now) {
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      node.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(frame);
    }
    node.textContent = '0';
    requestAnimationFrame(frame);
  }

  function watchNumbers() {
    var nodes = document.querySelectorAll('.stat b, .kpi b');
    if (!('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          countUp(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    Array.prototype.forEach.call(nodes, function (node) { io.observe(node); });
  }

  structuralStats();
  loadColleges();
  load();
  watchNumbers();

  if (location.hash === '#console') showView('console');
  if (location.hash === '#portal') showView('portal');

  /* ------------------------------------------------------- installable app */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline support is optional */ });
    });
  }
  loadNotice();
  loadCampuses();
})();
