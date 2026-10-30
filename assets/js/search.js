/*
 * Compiled from src/search.ts — do not edit by hand.
 *   npx tsc src/search.ts --outDir assets/js --target ES2019
 */
(function (global) {
  'use strict';

  function normalise(value) {
    return String(value == null ? '' : value)
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function matches(query, haystack) {
    var q = normalise(query);
    if (!q) return true;
    var text = normalise(haystack);
    return q.split(' ').every(function (token) { return text.indexOf(token) !== -1; });
  }

  var api = { normalise: normalise, matches: matches };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    global.EduSphereSearch = api;
  }
})(typeof window !== 'undefined' ? window : this);
