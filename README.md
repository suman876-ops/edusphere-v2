# EduSphere — site

The public page for EduSphere, a multi-campus college ERP. Static HTML, no framework, and the
content is read live from Supabase at page load.

**Live:** https://suman876-ops.github.io/edusphere-v2/

## What is live data and what is not

| On the page | Source |
| --- | --- |
| Module cards (18) | `site_modules` in Supabase |
| The notice card | latest row in `site_notices` |
| Campus dropdown | `site_campuses` |
| Enquiry form | inserts into `site_enquiries` |
| Portals, roles, lifecycle counts | counted from the page itself |
| Everything else | static copy |

The public page carries no invented figures. If the API is unreachable the module grid says so and
offers a retry rather than falling back to a snapshot.

The **console** is different: it ships with a seeded demo campus so every screen has something to
show. Those rows are real database records, listed below, and are deleted with two statements before
a real college starts using the system.

## Institutions in the database

Four colleges, each modelled as a campus under one trust. Departments, programmes and intake
figures come from the colleges' own admission pages and prospectuses; contact details and grades are
as published by them.

| Campus | Established | NAAC | Departments | Programmes | Source |
| --- | --- | --- | --- | --- | --- |
| Midnapore College (Autonomous) | 1873 | A (3.58) | 24 | 39 | midnaporecollege.ac.in |
| Raja Narendra Lal Khan Women's College (Autonomous) | 1957 | A+ (3.39) | 23 | 36 | rnlkwc.ac.in |
| Midnapore City College | 2017 | — | 17 | 25 | mcconline.org.in |
| K.D. College of Commerce & General Studies | 1961 | B+ | 8 | 7 | kdcollege.ac.in |

Programme intake is recorded where the college publishes it — for example Physics 50, Chemistry 50,
Mathematics 60 and English 70 at Midnapore College; B.Sc. Computer Science 110 and BCA 198 at
Midnapore City College. Where a college does not publish a figure the column is left empty rather
than guessed.

**What is real and what is sample.** Institution records — campuses, departments, programmes, intake,
contacts — are transcribed from the official websites. Student, staff and notice rows are marked
`SAMPLE-` and exist so the screens have something to show. No real student data was collected from
any college.

## Demo accounts

The console signs in against the seeded database. Accounts are created per role; the table below
describes the demo accounts that were used during development and are recreated by the seed script. Every password is
`EduSphere@123`. The console's sign-in screen lists these; tap a role to fill the form.

| Email | Role | Campus |
| --- | --- | --- |
| principal@edusphere.demo | admin | Main |
| registrar@edusphere.demo | registrar | Main |
| accounts@edusphere.demo | accountant | Main |
| faculty@edusphere.demo | faculty | Main and North |
| library@edusphere.demo | librarian | Main |
| hostel@edusphere.demo | warden | Main |
| transport@edusphere.demo | transport | Main |
| north.admin@edusphere.demo | admin | North |
| student@edusphere.demo | student | Main |
| parent@edusphere.demo | parent | Main |

What is seeded: 2 campuses, 4 departments, 3 programs, 3 batches, 4 sections, 11 students with
guardians, 4 staff, 5 subjects, 6 timetable slots, 3 attendance sessions with 15 records,
2 exams with 10 marks, 3 fee heads, 24 invoices, 12 payments, 5 books, 4 loans, 2 hostels,
3 rooms, 3 allocations, 2 routes, 4 stops, 2 courses, 2 assignments, 3 submissions, 4 notices
and 5 admission applications.

To remove every seeded row before real use:

```sql
delete from erp_groups where id = 'a0000000-0000-4000-8000-000000000001';
delete from auth.users where email like '%@edusphere.demo';
```

These accounts exist so the console can be demonstrated. They are not a security boundary — the
passwords are published in this file — and they must be deleted before a real college uses it.

## Languages

| Language | Where | What it does |
| --- | --- | --- |
| HTML | `index.html` | markup and the inline SVG icon sprite |
| CSS | `assets/css/styles.css` | design tokens, warm palette, glass cards, form |
| JavaScript | `assets/js/app.js` | renders modules, notice, campuses; filters; search; form submit |
| JavaScript | `assets/js/api.js` | fetch client for Supabase REST |
| JavaScript | `assets/js/config.js` | public URL and publishable key |
| TypeScript | `src/search.ts` → `assets/js/search.js` | typed search core |
| Python | `tools/build.py` | eight checks: assets, icons, secrets, config, a11y, more |
| Bash | `tools/serve.sh` | local preview |
| YAML | `.github/workflows/ci.yml` | runs the checks on every push |
| Make | `Makefile` | shortcuts |
| Markdown | `README.md`, `SECURITY.md` | docs |

## Layout

```
.
├── index.html
├── assets/
│   ├── css/styles.css
│   └── js/{config.js, api.js, app.js, search.js}
├── src/search.ts
├── tools/{build.py, serve.sh}
├── .github/workflows/ci.yml
├── SECURITY.md
└── Makefile
```

## Working on it

```bash
make            # run the checks
make serve      # http://localhost:8080
make zip        # dist/edusphere-site.zip
```

Content lives in the database, not in the repository. To change a module or a notice, edit the row
in Supabase; the page picks it up on the next load.

## Before real traffic

- add a CAPTCHA to the enquiry form
- rate limit per IP as well as per email
- wire enquiries to an email or a dashboard, so nobody has to read the table by hand

See [SECURITY.md](SECURITY.md) for what the policies allow and what was tested.

## Licence

MIT
