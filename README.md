# EduSphere — Multi-Campus College ERP

One platform for every college that joins it. A visitor searches across all colleges, compares
programmes and seats, and applies once. After admission the same account carries attendance, marks
and fees.

**Live:** https://suman876-ops.github.io/edusphere-v2/

## What is on the site

| Page | What it does | Where the data comes from |
| --- | --- | --- |
| Home | headline, admission call to action | static copy |
| Colleges | every college on the platform, with code, principal, NAAC, address, phone, email, map link | `site_public_colleges()` |
| Programmes | 107 programmes across the four colleges, searchable, filterable by level | `site_public_programmes()` |
| Admission | three-step explainer and a working application form | writes `site_applications` |
| Notices | notice board | `site_notices` |
| Sign in | one door: students and parents reach the portal, staff reach the console | Supabase Auth |

## The four colleges

| Campus code | College | Established | NAAC |
| --- | --- | --- | --- |
| CMP-PM-01 | Midnapore College (Autonomous) | 1873 | A+ (3.60) |
| CMP-PM-02 | Raja Narendra Lal Khan Women's College (Autonomous) | 1957 | A+ (3.39) |
| CMP-PM-03 | Midnapore City College | 2017 | not accredited |
| CMP-PM-04 | K.D. College of Commerce & General Studies | 1961 | B+ (2.51) |

Departments, programmes, intake and contact details are transcribed from each college's own
admission page and prospectus. Student and staff rows are labelled `SAMPLE-` — no real student data
was collected from any college.

## Roles and dashboards

Each role in the workflow has its own account, its own sidebar and its own dashboard tiles.
Password for every demo account: `EduSphere@123`.

| Email | Role | Sees |
| --- | --- | --- |
| principal@edusphere.demo | admin | every module |
| admin@edusphere.demo | admin (cluster) | every module, all four campuses |
| midnapore@edusphere.demo | registrar | students, admissions, academic structure |
| accounts@edusphere.demo | accountant | fee heads, invoices, payments |
| mcc@edusphere.demo | accountant | same, at Midnapore City College |
| faculty@edusphere.demo | faculty | attendance, exams, marks, timetable, LMS |
| hod@edusphere.demo | faculty (HoD) | same, department level |
| librarian@edusphere.demo | librarian | books, issues, students |
| warden@edusphere.demo | warden | hostels, rooms, allocations |
| transport@edusphere.demo | transport | routes, stops, students |
| student@edusphere.demo | student | own attendance, marks, fees, notices |
| parent@edusphere.demo | parent | the same for their child, read-only |

## How the system is built

| Layer | What runs |
| --- | --- |
| Interface | one static page, three views (public, portal, console) |
| Data | PostgreSQL 16 with row-level security on 34 tables |
| Identity | Supabase Auth, email and password, confirmed addresses |
| Delivery | GitHub Pages, with a service worker for the installed app |
| Verification | 13 build checks and a CI workflow that blocks a stale commit |

Row-level security is the boundary, not the interface: a student can read only their own rows, a
parent only their child's, and staff only the campuses they belong to. That is enforced in the
database and tested by running queries as each role.

## Repository layout

```
.
├── index.html                  public site, portal and console in one page
├── assets/
│   ├── css/styles.css          design system, layout, motion
│   ├── css/console.css         console and portal styling
│   └── js/                     config, api, app, console, portal, resources, search
├── src/search.ts               typed search core, compiled to assets/js/search.js
├── tools/build.py              13 checks: links, anchors, icons, secrets, a11y
├── tools/serve.sh              local preview
├── manifest.webmanifest        installable app
├── sw.js                       offline shell
├── SECURITY.md                 policies and what was tested
└── Makefile                    make, make serve, make zip
```

## Working on it

```bash
make            # run the checks
make serve      # http://localhost:8080
make zip        # dist/edusphere-site.zip
```

Content lives in the database. To add a college, add its campus, departments and programmes; the
directory, the programme search and the application form pick it up without a code change.

## Before real traffic

- add a CAPTCHA to the application form and rate limit per IP
- turn on leaked-password protection in Supabase Auth
- delete the demo accounts and their sample rows
- wire applications to an email or a dashboard so nobody reads the table by hand

## Licence

MIT
