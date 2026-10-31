# Security notes

The site is static and talks to Supabase from the browser. The API key in `assets/js/config.js` is
public by design, so the real boundary is PostgreSQL row-level security. This is what that boundary
is, and what the last audit found.

## The key

`config.js` holds a **publishable** key (`sb_publishable_…`). It carries no privileges of its own;
every request it makes is filtered by the policies below. The `service_role` key is never in this
repository, and `tools/build.py` fails the build if one appears.

## Two levels of access control

1. **Campus.** A row belongs to a campus, and `erp_has_campus()` decides whether the signed-in person
   is staff there. Students and parents are excluded from that function on purpose — they get their
   rows from the self and child policies instead.
2. **Module.** A row also belongs to a module (fees, library, hostel, exams…), and `erp_can_read()`
   checks the role matrix in `erp_role_modules`. A librarian may read the library module; the fee
   ledger is not theirs.

| Role | Modules it may read |
| --- | --- |
| admin | all |
| registrar | students, academics, admissions, timetable, comms, files, iam |
| accountant | fees, students, comms |
| faculty | students, attendance, exams, timetable, lms, comms |
| librarian | library, students, comms |
| warden | hostel, students, comms |
| transport | transport, students, comms |
| student / parent | own rows only, through separate policies |

Writes are narrower still: a role may write only inside a campus it belongs to, and delete is
reserved for admins.

## The public surface

| Function / table | anon can | Notes |
| --- | --- | --- |
| `site_public_colleges()` | execute | returns only published institution fields |
| `site_public_programmes()` | execute | programme, level, seats |
| `site_modules`, `site_campuses`, `site_notices` | select | published rows only |
| `site_applications` | insert only | cannot be read back by anyone anonymous |
| `site_enquiries` | insert only | same |
| every `erp_*` table | **nothing** | grants revoked from anon |

## Abuse control

- An application is refused if the same email already applied for that programme in the last day,
  or has sent five applications in the last hour.
- Enquiries are capped at five per email per hour.
- Both guards are `SECURITY DEFINER` with `search_path` pinned, and `EXECUTE` is revoked from
  `public`, `anon` and `authenticated`.

## What the audit tested

Run as each role inside the database, not inferred from the policy text:

| Test | Result |
| --- | --- |
| anon reads `erp_students` | refused — permission denied |
| anon reads `site_applications` | refused |
| anon reads the college directory | 4 colleges |
| student reads the roll | 1 row — their own |
| parent updates a mark | no rows affected |
| librarian reads fee invoices | 0 rows |
| librarian reads books | 5 rows |
| accountant reads students / invoices | 12 / 36 rows |
| faculty reads marks / invoices | 48 / 0 rows |
| principal reads invoices | 145 rows, all four campuses |
| dashboard visible before sign-in | fixed — `[hidden]` now wins over display rules |

## Client hardening

- A Content-Security-Policy limits scripts to the site itself, styles to the site and Google Fonts,
  and network calls to Supabase. No inline script is permitted anywhere.
- Every external link opens with `rel="noopener noreferrer"`.
- User-supplied text is written with `textContent`, never `innerHTML`.
- The build refuses a page with a dead internal link, a missing anchor target, an unresolved icon,
  a missing form label, or a committed secret.

## Still open, and why

- **Leaked-password protection** is off. It is a dashboard switch (Authentication → Policies), not
  something SQL can turn on.
- **The demo accounts** are published in the README with a known password. They must be deleted
  before real use: `delete from auth.users where email like '%@edusphere.demo';`
- **Rate limiting is per email**, not per IP. A determined attacker with many addresses is not slowed
  by it; a CAPTCHA on the application form is the next step.
- **Legacy objects** from the earlier schema — `app_sequences`, `job_queue`, `auth_*` helper
  functions — still appear in the Supabase advisor. They are not part of this site and were left
  untouched rather than dropped, since another project may depend on them.
- **TOTP and SSO** from the project brief are not built. Authentication is email and password only.

## Reporting

Open a private security advisory on the repository rather than a public issue.
