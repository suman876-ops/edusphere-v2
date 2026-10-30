/* Student and parent portal — reads only the rows RLS allows for this account. */
(function () {
  'use strict';

  var cfg = window.EDUSPHERE_CONFIG || {};
  var BASE = String(cfg.supabaseUrl || '').replace(/\/$/, '');
  var KEY = cfg.supabaseKey;
  var SESSION_KEY = 'edusphere.session';
  var root = document.getElementById('portal-body');
  if (!root) return;

  function session() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { return null; }
  }

  async function get(path) {
    var s = session();
    var response = await fetch(BASE + '/rest/v1/' + path, {
      headers: {
        apikey: KEY,
        Authorization: 'Bearer ' + (s ? s.access_token : KEY)
      },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Request failed (' + response.status + ')');
    return response.json();
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function rupees(paise) {
    return '₹' + (Number(paise) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  function card(title, body) {
    var box = el('div', 'card reveal in');
    box.appendChild(el('h3', null, title));
    box.appendChild(body);
    return box;
  }

  async function open() {
    var s = session();
    root.innerHTML = '';
    if (!s || !s.access_token) {
      root.appendChild(el('p', 'empty-note', 'Sign in to see your portal.'));
      return;
    }

    var loading = el('p', 'empty-note', 'Loading your records…');
    root.appendChild(loading);

    try {
      var students = await get('erp_students?select=id,full_name,enrolment_no,status,admitted_on,campus_id,section_id&limit=1');
      if (!students.length) {
        root.innerHTML = '';
        root.appendChild(el('p', 'empty-note', 'No student record is linked to this account yet. Ask the college office to link it.'));
        return;
      }
      var student = students[0];
      var studentId = student.id;

      var results = await Promise.all([
        get('erp_attendance_records?select=status&student_id=eq.' + studentId),
        get('erp_exam_marks?select=marks,exam_id&student_id=eq.' + studentId),
        get('erp_fee_invoices?select=title,amount_paise,due_on&student_id=eq.' + studentId + '&order=due_on.asc'),
        get('erp_payments?select=amount_paise'),
        get('erp_notices?select=title,body,published_at&order=published_at.desc&limit=4'),
        get('erp_campuses?select=name&limit=1')
      ]);

      var attendance = results[0], marks = results[1], invoices = results[2],
          payments = results[3], notices = results[4], campuses = results[5];

      root.innerHTML = '';

      /* profile */
      var profile = el('div');
      profile.appendChild(el('p', null, student.enrolment_no + ' · ' + (campuses[0] ? campuses[0].name : '')));
      profile.appendChild(el('p', null, 'Status: ' + student.status + ' · admitted ' +
        new Date(student.admitted_on).toLocaleDateString('en-IN')));
      root.appendChild(card(student.full_name, profile));

      /* attendance */
      var present = attendance.filter(function (r) { return r.status === 'present'; }).length;
      var pct = attendance.length ? Math.round((present / attendance.length) * 100) : 0;
      var att = el('div');
      att.appendChild(el('b', 'portal-figure', pct + '%'));
      att.appendChild(el('p', null, present + ' present of ' + attendance.length + ' recorded sessions'));
      root.appendChild(card('Attendance', att));

      /* marks */
      var markBox = el('div');
      if (marks.length) {
        marks.slice(0, 8).forEach(function (m) {
          var row = el('div', 'portal-row');
          row.appendChild(el('span', null, 'Exam ' + String(m.exam_id).slice(0, 8)));
          row.appendChild(el('span', 'portal-value', String(m.marks)));
          markBox.appendChild(row);
        });
      } else {
        markBox.appendChild(el('p', null, 'No marks published yet.'));
      }
      root.appendChild(card('Marks', markBox));

      /* fees */
      var billed = invoices.reduce(function (sum, i) { return sum + Number(i.amount_paise); }, 0);
      var paid = payments.reduce(function (sum, p) { return sum + Number(p.amount_paise); }, 0);
      var fees = el('div');
      fees.appendChild(el('b', 'portal-figure', rupees(Math.max(billed - paid, 0))));
      fees.appendChild(el('p', null, 'outstanding of ' + rupees(billed) + ' billed'));
      invoices.slice(0, 4).forEach(function (i) {
        var row = el('div', 'portal-row');
        row.appendChild(el('span', null, i.title));
        row.appendChild(el('span', 'portal-value', rupees(i.amount_paise)));
        fees.appendChild(row);
      });
      root.appendChild(card('Fees', fees));

      /* notices */
      var noticeBox = el('div');
      if (notices.length) {
        notices.forEach(function (n) {
          var item = el('div', 'portal-notice');
          item.appendChild(el('b', null, n.title));
          item.appendChild(el('p', null, n.body));
          item.appendChild(el('small', null, new Date(n.published_at).toLocaleDateString('en-IN')));
          noticeBox.appendChild(item);
        });
      } else {
        noticeBox.appendChild(el('p', null, 'No notices.'));
      }
      root.appendChild(card('Notices', noticeBox));
    } catch (error) {
      root.innerHTML = '';
      root.appendChild(el('p', 'empty-note', 'Could not load your records: ' + error.message));
    }
  }

  window.EduSpherePortal = { open: open };
})();
