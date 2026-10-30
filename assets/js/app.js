/* EduSphere site behaviour: reveal, module filters, search, scroll progress. */
(function () {
  'use strict';

  var cards = Array.prototype.slice.call(document.querySelectorAll('#module-grid .card'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  var searchInput = document.getElementById('module-search');
  var grid = document.getElementById('module-grid');
  var state = { category: 'all', query: '' };

  /* ---------------------------------------------------------- reveal */
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

    reveals.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 6, 5) * 40 + 'ms';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ------------------------------------------------------ module filter */
  function applyFilters() {
    if (!cards.length) return;
    var engine = window.EduSphereSearch;
    var shown = 0;

    cards.forEach(function (card) {
      var inCategory = state.category === 'all' || card.getAttribute('data-cat') === state.category;
      var text = card.textContent || '';
      var inQuery = !state.query || !engine || engine.matches(state.query, text);
      var visible = inCategory && inQuery;
      card.style.display = visible ? '' : 'none';
      if (visible) shown += 1;
    });

    if (grid) {
      var note = grid.querySelector('.empty-note');
      if (!shown && !note) {
        note = document.createElement('p');
        note.className = 'empty-note';
        note.textContent = 'No module matches that search.';
        grid.appendChild(note);
      } else if (shown && note) {
        note.remove();
      }
    }
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      state.category = chip.getAttribute('data-filter') || 'all';
      applyFilters();
    });
  });

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

  /* ------------------------------------------- progress + back to top */
  var bar = document.getElementById('bar');
  var toTop = document.getElementById('to-top');

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var top = doc.scrollTop || document.body.scrollTop || 0;
    if (bar) bar.style.width = (max > 0 ? (top / max) * 100 : 0) + '%';
    if (toTop) toTop.classList.toggle('show', top > 500);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ------------------------------------------------------ year in footer */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
