/* EduSphere console — auth, workspace, and one generic CRUD renderer. */
(function () {
  'use strict';

  var cfg = window.EDUSPHERE_CONFIG || {};
  var BASE = String(cfg.supabaseUrl || '').replace(/\/$/, '');
  var KEY = cfg.supabaseKey;
  var SESSION_KEY = 'edusphere.session';
  var RESOURCES = window.ERP_RESOURCES || [];

  var state = {
    session: null,
    campuses: [],
    campusId: null,
    roles: [],
    current: null,
    refCache: {},
    search: ''
  };

  var $ = function (id) { return document.getElementById(id); };
  var el = function (tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  /* ------------------------------------------------------------- session */
  function loadSession() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      state.session = raw ? JSON.parse(raw) : null;
    } catch (e) { state.session = null; }
  }

  function saveSession(s) {
    state.session = s;
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  }

  /* ---------------------------------------------------------------- http */
  async function authRequest(path, options) {
    options = options || {};
    var headers = { 'Content-Type': 'application/json', apikey: KEY };
    if (options.token) headers.Authorization = 'Bearer ' + options.token;
    else if (state.session) headers.Authorization = 'Bearer ' + state.session.access_token;

    var response = await fetch(BASE + path, {
      method: options.method || 'GET',
      headers: Object.assign(headers, options.headers || {}),
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: 'no-store'
    });

    var text = await response.text();
    var payload = null;
    try { payload = text ? JSON.parse(text) : null; } catch (e) { payload = null; }

    if (!response.ok) {
      var message = (payload && (payload.message || payload.error_description || payload.msg || payload.hint))
        || ('Request failed (' + response.status + ')');
      var error = new Error(message);
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  async function refreshSession() {
    if (!state.session || !state.session.refresh_token) throw new Error('Session expired');
    var data = await authRequest('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', token: KEY, body: { refresh_token: state.session.refresh_token }
    });
    saveSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      email: (data.user && data.user.email) || state.session.email,
      user_id: (data.user && data.user.id) || state.session.user_id
    });
  }

  async function api(path, options) {
    try {
      return await authRequest(path, options);
    } catch (error) {
      if (error.status === 401 && state.session && state.session.refresh_token) {
        await refreshSession();
        return await authRequest(path, options);
      }
      throw error;
    }
  }

  function rpc(name, args) {
    return api('/rest/v1/rpc/' + name, { method: 'POST', body: args || {} });
  }

  /* ----------------------------------------------------------------- auth */
  async function signIn(email, password) {
    var data = await authRequest('/auth/v1/token?grant_type=password', {
      method: 'POST', token: KEY, body: { email: email, password: password }
    });
    saveSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      email: data.user && data.user.email,
      user_id: data.user && data.user.id
    });
  }

  async function signUp(email, password, fullName) {
    return authRequest('/auth/v1/signup', {
      method: 'POST', token: KEY,
      body: { email: email, password: password, data: { full_name: fullName } }
    });
  }

  async function signOut() {
    try {
      await fetch(BASE + '/auth/v1/logout', {
        method: 'POST',
        headers: { apikey: KEY, Authorization: 'Bearer ' + state.session.access_token }
      });
    } catch (e) { /* the token may already be gone; the local session is what matters */ }
    saveSession(null);
    showAuth();
  }

  /* ------------------------------------------------------------ workspace */
  async function loadWorkspace() {
    var rows = await rpc('erp_my_workspace');
    state.campuses = rows || [];
    if (!state.campuses.length) {
      $('setup-modal').hidden = false;
      return false;
    }
    var saved = localStorage.getItem('edusphere.campus');
    var match = state.campuses.filter(function (c) { return c.campus_id === saved; })[0];
    var active = match || state.campuses[0];
    state.campusId = active.campus_id;
    state.roles = active.roles || [];
    localStorage.setItem('edusphere.campus', state.campusId);
    $('side-campus').textContent = active.campus_name;
    $('who').textContent = state.session.email + ' · ' + state.roles.join(', ');
    renderCampusSwitch(active.campus_id);
    return true;
  }

  function renderCampusSwitch(selected) {
    var select = $('campus-switch');
    if (!select) return;
    if (state.campuses.length < 2) {
      select.hidden = true;
      return;
    }
    select.innerHTML = '';
    state.campuses.forEach(function (campus) {
      var option = document.createElement('option');
      option.value = campus.campus_id;
      option.textContent = campus.campus_name;
      if (campus.campus_id === selected) option.selected = true;
      select.appendChild(option);
    });
    select.hidden = false;
    select.onchange = function () {
      var chosen = state.campuses.filter(function (c) { return c.campus_id === select.value; })[0];
      if (!chosen) return;
      state.campusId = chosen.campus_id;
      state.roles = chosen.roles || [];
      state.refCache = {};
      localStorage.setItem('edusphere.campus', state.campusId);
      $('side-campus').textContent = chosen.campus_name;
      $('who').textContent = state.session.email + ' · ' + state.roles.join(', ');
      if (state.current) {
        var resource = RESOURCES.filter(function (r) { return r.key === state.current; })[0];
        if (resource) renderTable(resource);
      } else {
        openDashboard();
      }
    };
  }

  /* -------------------------------------------------------------- sprite */
  var SPRITE_NAMES = ['cap','users','file','building','layers','calendar','book','qr','clipboard',
                      'award','chart','rupee','receipt','card','bed','bus','pin','play','bell','lock','shield'];

  function spriteReady() {
    var defs = document.getElementById('sprite-defs');
    if (!defs || defs.childElementCount) return;
    fetch('../index.html').then(function (r) { return r.text(); }).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var src = doc.getElementById('sprite-defs') || doc.querySelector('.sprite defs');
      if (src) {
        defs.innerHTML = src.innerHTML;
        renderSidebar();
      }
    }).catch(function () { /* icons are cosmetic */ });
  }

  function icon(name) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'ic');
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#i-' + (SPRITE_NAMES.indexOf(name) === -1 ? 'layers' : name));
    svg.appendChild(use);
    return svg;
  }

  /* ------------------------------------------------------------- sidebar */
  function renderSidebar() {
    var nav = $('side-nav');
    nav.innerHTML = '';

    var dash = el('button');
    dash.appendChild(icon('chart'));
    dash.appendChild(el('span', null, 'Dashboard'));
    dash.addEventListener('click', function () { openDashboard(); });
    dash.setAttribute('aria-current', String(state.current === null));
    nav.appendChild(dash);

    RESOURCES.forEach(function (resource) {
      var button = el('button');
      button.appendChild(icon(resource.icon));
      button.appendChild(el('span', null, resource.label));
      button.setAttribute('aria-current', String(state.current === resource.key));
      button.addEventListener('click', function () { openResource(resource); });
      nav.appendChild(button);
    });
  }

  /* ----------------------------------------------------------- dashboard */
  async function countOf(resource) {
    try {
      var response = await fetch(
        BASE + '/rest/v1/' + resource.table + '?select=id&campus_id=eq.' + state.campusId + '&limit=1',
        {
          headers: {
            apikey: KEY,
            Authorization: 'Bearer ' + state.session.access_token,
            Prefer: 'count=exact'
          }
        }
      );
      var range = response.headers.get('content-range') || '';
      var total = range.split('/')[1];
      return total === '*' || total == null ? '—' : Number(total);
    } catch (e) {
      return '—';
    }
  }

  async function openDashboard() {
    state.current = null;
    renderSidebar();
    $('panel-title').textContent = 'Dashboard';
    $('panel-sub').textContent = 'Your campus at a glance';
    $('primary-action').hidden = true;

    var body = $('panel-body');
    body.innerHTML = '';
    var grid = el('div', 'kpi-grid');
    body.appendChild(grid);

    var wanted = ['students', 'staff', 'applications', 'invoices', 'books', 'notices'];
    var cards = wanted.map(function (key) {
      return RESOURCES.filter(function (r) { return r.key === key; })[0];
    }).filter(Boolean);

    var results = await Promise.all(cards.map(countOf));
    cards.forEach(function (resource, index) {
      var card = el('div', 'kpi');
      card.appendChild(el('b', null, String(results[index])));
      card.appendChild(el('span', null, resource.label));
      grid.appendChild(card);
    });
  }

  /* ------------------------------------------------------------ resource */
  async function openResource(resource) {
    state.current = resource.key;
    state.search = '';
    renderSidebar();
    $('panel-title').textContent = resource.label;
    $('panel-sub').textContent = 'Campus-scoped records from ' + resource.table;
    $('primary-action').hidden = !!resource.readOnly || !!resource.noCreate;
    $('primary-action').onclick = function () { openRecord(resource, null); };
    await renderTable(resource);
  }

  function valueCell(row, column) {
    var value = row[column.name];
    if (value == null || value === '') return '—';
    if (column.type === 'boolean') return value ? 'Yes' : 'No';
    if (column.type === 'datetime') return new Date(value).toLocaleString('en-IN');
    if (column.type === 'date') return new Date(value).toLocaleDateString('en-IN');
    if (column.type === 'ref') return row.__refs && row.__refs[column.name] ? row.__refs[column.name] : String(value).slice(0, 8) + '…';
    if (column.name === 'amount_paise' || column.name === 'fine_paise') {
      return '₹' + (Number(value) / 100).toLocaleString('en-IN');
    }
    return String(value);
  }

  async function resolveRefs(resource, rows) {
    var refColumns = resource.columns.filter(function (c) { return c.type === 'ref'; });
    for (var i = 0; i < refColumns.length; i += 1) {
      var column = refColumns[i];
      var ids = rows.map(function (r) { return r[column.name]; }).filter(Boolean);
      if (!ids.length) continue;
      var unique = ids.filter(function (v, idx) { return ids.indexOf(v) === idx; });
      try {
        var data = await api('/rest/v1/' + column.ref +
          '?select=id,' + column.refLabel + '&id=in.(' + unique.join(',') + ')');
        var map = {};
        data.forEach(function (row) { map[row.id] = row[column.refLabel]; });
        rows.forEach(function (row) {
          row.__refs = row.__refs || {};
          if (row[column.name] && map[row[column.name]]) row.__refs[column.name] = map[row[column.name]];
        });
      } catch (e) { /* leave the id visible */ }
    }
  }

  async function renderTable(resource) {
    var body = $('panel-body');
    body.innerHTML = '';

    var toolbar = el('div', 'toolbar');
    var search = el('input');
    search.type = 'search';
    search.placeholder = 'Search ' + resource.label.toLowerCase() + '…';
    search.value = state.search;
    search.addEventListener('input', function () {
      state.search = search.value;
      clearTimeout(search._t);
      search._t = setTimeout(function () { renderTable(resource); }, 250);
    });
    toolbar.appendChild(search);
    body.appendChild(toolbar);

    var wrap = el('div', 'table-wrap');
    var table = el('table', 'data-table');
    var thead = el('thead');
    var headRow = el('tr');
    resource.columns.forEach(function (c) { headRow.appendChild(el('th', null, c.label)); });
    headRow.appendChild(el('th', null, ''));
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = el('tbody');
    table.appendChild(tbody);
    wrap.appendChild(table);
    body.appendChild(wrap);

    var loading = el('p', 'empty-note', 'Loading…');
    tbody.appendChild((function () {
      var tr = el('tr');
      var td = el('td');
      td.colSpan = resource.columns.length + 1;
      td.appendChild(loading);
      tr.appendChild(td);
      return tr;
    })());

    var query = '/rest/v1/' + resource.table + '?select=*&limit=100';
    if (resource.campusScoped !== false) query += '&campus_id=eq.' + state.campusId;
    if (resource.order) query += '&order=' + resource.order;
    if (state.search && resource.search) {
      query += '&' + resource.search + '=ilike.*' + encodeURIComponent(state.search) + '*';
    }

    var rows;
    try {
      rows = await api(query);
    } catch (error) {
      tbody.innerHTML = '';
      var tr = el('tr');
      var td = el('td');
      td.colSpan = resource.columns.length + 1;
      td.appendChild(el('p', 'empty-note', 'Could not load: ' + error.message));
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    await resolveRefs(resource, rows);
    tbody.innerHTML = '';

    if (!rows.length) {
      var empty = el('tr');
      var cell = el('td');
      cell.colSpan = resource.columns.length + 1;
      cell.appendChild(el('p', 'empty-note', 'No records yet.'));
      empty.appendChild(cell);
      tbody.appendChild(empty);
      return;
    }

    rows.forEach(function (row) {
      var tr = el('tr');
      resource.columns.forEach(function (c) { tr.appendChild(el('td', null, valueCell(row, c))); });
      var actions = el('td', 'actions');
      if (!resource.readOnly) {
        var edit = el('button', 'row-btn', 'Edit');
        edit.type = 'button';
        edit.addEventListener('click', function () { openRecord(resource, row); });
        actions.appendChild(edit);

        var del = el('button', 'row-btn', 'Delete');
        del.type = 'button';
        del.addEventListener('click', function () { removeRow(resource, row); });
        actions.appendChild(del);
      }
      tr.appendChild(actions);
      tbody.appendChild(tr);
    });
  }

  /* ---------------------------------------------------------------- form */
  async function refOptions(column) {
    if (state.refCache[column.ref]) return state.refCache[column.ref];
    try {
      var data = await api('/rest/v1/' + column.ref + '?select=id,' + column.refLabel + '&limit=200');
      state.refCache[column.ref] = data;
      return data;
    } catch (e) {
      return [];
    }
  }

  async function openRecord(resource, row) {
    $('record-title').textContent = (row ? 'Edit ' : 'New ') + resource.label.toLowerCase().replace(/s$/, '');
    $('record-status').textContent = '';
    var fields = $('record-fields');
    fields.innerHTML = '';
    fields.dataset.resource = resource.key;
    fields.dataset.id = row ? row.id : '';

    for (var i = 0; i < resource.columns.length; i += 1) {
      var column = resource.columns[i];
      var field = el('div', 'field' + (column.type === 'textarea' ? ' field-full' : ''));
      var id = 'fld-' + column.name;
      var label = el('label', null, column.label);
      label.setAttribute('for', id);
      field.appendChild(label);

      var input;
      if (column.type === 'select') {
        input = el('select');
        (column.options || []).forEach(function (option) {
          var opt = el('option', null, option);
          opt.value = option;
          input.appendChild(opt);
        });
      } else if (column.type === 'boolean') {
        input = el('select');
        [['true', 'Yes'], ['false', 'No']].forEach(function (pair) {
          var opt = el('option', null, pair[1]);
          opt.value = pair[0];
          input.appendChild(opt);
        });
      } else if (column.type === 'ref') {
        input = el('select');
        var blank = el('option', null, '— none —');
        blank.value = '';
        input.appendChild(blank);
        var options = await refOptions(column);
        options.forEach(function (option) {
          var opt = el('option', null, option[column.refLabel] || option.id);
          opt.value = option.id;
          input.appendChild(opt);
        });
      } else if (column.type === 'textarea') {
        input = el('textarea');
        input.rows = 3;
      } else {
        input = el('input');
        input.type = column.type === 'number' ? 'number'
          : column.type === 'date' ? 'date'
          : column.type === 'time' ? 'time'
          : column.type === 'datetime' ? 'datetime-local'
          : column.type === 'email' ? 'email'
          : 'text';
        if (column.type === 'number') input.step = 'any';
      }

      input.id = id;
      input.name = column.name;
      if (column.required) input.required = true;

      var current = row ? row[column.name] : column.default;
      if (current != null && current !== '') {
        if (column.type === 'datetime') {
          input.value = new Date(current).toISOString().slice(0, 16);
        } else if (column.type === 'boolean') {
          input.value = String(current);
        } else {
          input.value = current;
        }
      }

      field.appendChild(input);
      fields.appendChild(field);
    }

    $('record-modal').hidden = false;
    var first = fields.querySelector('input, select, textarea');
    if (first) first.focus();
  }

  function readForm(resource, isEdit) {
    var fields = $('record-fields');
    var data = {};
    resource.columns.forEach(function (column) {
      var input = document.getElementById('fld-' + column.name);
      if (!input) return;
      var value = input.value;
      if (value === '') {
        // On an edit, an emptied field means "clear it", not "leave it alone".
        // On a create, an empty optional field is simply absent.
        if (isEdit && !column.required) data[column.name] = null;
        return;
      }
      if (column.type === 'number') value = Number(value);
      else if (column.type === 'datetime') value = new Date(value).toISOString();
      else if (column.type === 'boolean') value = value === 'true';
      data[column.name] = value;
    });
    return data;
  }

  async function saveRecord(event) {
    event.preventDefault();
    var fields = $('record-fields');
    var resource = RESOURCES.filter(function (r) { return r.key === fields.dataset.resource; })[0];
    var id = fields.dataset.id;
    if (!resource) return;

    var payload = readForm(resource, !!id);
    if (!id) payload.campus_id = state.campusId;

    var save = $('record-save');
    save.disabled = true;
    $('record-status').textContent = 'Saving…';

    try {
      if (id) {
        await api('/rest/v1/' + resource.table + '?id=eq.' + id, {
          method: 'PATCH', body: payload, headers: { Prefer: 'return=minimal' }
        });
      } else {
        await api('/rest/v1/' + resource.table, {
          method: 'POST', body: payload, headers: { Prefer: 'return=minimal' }
        });
      }
      state.refCache = {};
      $('record-modal').hidden = true;
      await renderTable(resource);
    } catch (error) {
      $('record-status').textContent = 'Could not save: ' + error.message;
    } finally {
      save.disabled = false;
    }
  }

  async function removeRow(resource, row) {
    if (!window.confirm('Delete this record? This cannot be undone.')) return;
    try {
      await api('/rest/v1/' + resource.table + '?id=eq.' + row.id, { method: 'DELETE' });
      await renderTable(resource);
    } catch (error) {
      window.alert('Could not delete: ' + error.message);
    }
  }

  /* ---------------------------------------------------------------- boot */
  function showAuth() {
    $('auth-screen').hidden = false;
    $('console-shell').hidden = true;
    $('setup-modal').hidden = true;
  }

  async function showConsole() {
    $('auth-screen').hidden = true;
    $('console-shell').hidden = false;
    spriteReady();
    var ok = await loadWorkspace();
    renderSidebar();
    if (ok) await openDashboard();
  }

  function bindAuth() {
    $('signin-form').addEventListener('submit', async function (event) {
      event.preventDefault();
      var status = $('auth-status');
      status.textContent = 'Signing in…';
      try {
        await signIn($('auth-email').value.trim(), $('auth-password').value);
        status.textContent = '';
        await showConsole();
      } catch (error) {
        status.textContent = error.message;
      }
    });

    $('signup-form').addEventListener('submit', async function (event) {
      event.preventDefault();
      var status = $('signup-status');
      status.textContent = 'Creating account…';
      try {
        var result = await signUp($('su-email').value.trim(), $('su-password').value, $('su-name').value.trim());
        if (result && result.access_token) {
          saveSession({
            access_token: result.access_token,
            refresh_token: result.refresh_token,
            email: result.user && result.user.email,
            user_id: result.user && result.user.id
          });
          await showConsole();
        } else {
          status.textContent = 'Account created — check your email to confirm, then sign in.';
        }
      } catch (error) {
        status.textContent = error.message;
      }
    });

    $('to-signup').addEventListener('click', function () {
      $('signin-form').hidden = true;
      $('signup-form').hidden = false;
    });
    $('to-signin').addEventListener('click', function () {
      $('signup-form').hidden = true;
      $('signin-form').hidden = false;
    });

    Array.prototype.forEach.call(document.querySelectorAll('.demo-chip'), function (chip) {
      chip.addEventListener('click', function () {
        $('auth-email').value = chip.getAttribute('data-email');
        $('auth-password').value = 'EduSphere@123';
        $('signin-form').hidden = false;
        $('signup-form').hidden = true;
        $('auth-password').focus();
      });
    });

    $('signout').addEventListener('click', signOut);

    $('record-form').addEventListener('submit', saveRecord);
    $('record-cancel').addEventListener('click', function () {
      $('record-modal').hidden = true;
    });

    $('setup-form').addEventListener('submit', async function (event) {
      event.preventDefault();
      var status = $('setup-status');
      status.textContent = 'Creating campus…';
      try {
        await rpc('erp_bootstrap', {
          p_group: $('setup-group').value.trim(),
          p_campus: $('setup-campus').value.trim(),
          p_slug: $('setup-slug').value.trim().toLowerCase()
        });
        $('setup-modal').hidden = true;
        await loadWorkspace();
        renderSidebar();
        await openDashboard();
      } catch (error) {
        status.textContent = error.message;
      }
    });
  }

  loadSession();
  bindAuth();
  if (state.session && state.session.access_token) {
    showConsole().catch(function () { showAuth(); });
  } else {
    showAuth();
  }
})();
