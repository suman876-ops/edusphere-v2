/* Thin Supabase REST client — fetch only, no SDK, no build step. */
(function (global) {
  'use strict';

  var cfg = global.EDUSPHERE_CONFIG || {};
  var tables = cfg.tables || {};

  function base(path) {
    return String(cfg.supabaseUrl || '').replace(/\/$/, '') + '/rest/v1/' + path;
  }

  function headers(extra) {
    var h = {
      apikey: cfg.supabaseKey,
      Authorization: 'Bearer ' + cfg.supabaseKey,
      'Content-Type': 'application/json'
    };
    if (extra) {
      Object.keys(extra).forEach(function (k) { h[k] = extra[k]; });
    }
    return h;
  }

  function describe(status, payload) {
    if (payload && (payload.message || payload.hint)) {
      return payload.message || payload.hint;
    }
    if (status === 0) return 'Network unreachable';
    if (status === 401 || status === 403) return 'Not allowed';
    return 'Request failed (' + status + ')';
  }

  async function get(path) {
    var response = await fetch(base(path), { headers: headers(), cache: 'no-store' });
    var text = await response.text();
    var payload = null;
    try { payload = text ? JSON.parse(text) : null; } catch (e) { payload = null; }
    if (!response.ok) throw new Error(describe(response.status, payload));
    return payload || [];
  }

  async function post(path, body) {
    var response = await fetch(base(path), {
      method: 'POST',
      headers: headers({ Prefer: 'return=minimal' }),
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      var text = await response.text();
      var payload = null;
      try { payload = text ? JSON.parse(text) : null; } catch (e) { payload = null; }
      throw new Error(describe(response.status, payload));
    }
    return true;
  }

  var api = {
    modules: function () {
      return get(tables.modules + '?select=id,category,icon,title,description&is_published=eq.true&order=sort_order.asc');
    },
    campuses: function () {
      return get(tables.campuses + '?select=slug,name&is_published=eq.true&order=name.asc');
    },
    latestNotice: async function () {
      var rows = await get(tables.notices + '?select=title,body,published_at&order=published_at.desc&limit=1');
      return rows && rows.length ? rows[0] : null;
    },
    submitEnquiry: function (enquiry) {
      return post(tables.enquiries, enquiry);
    }
  };

  global.EduSphereApi = api;
})(window);
