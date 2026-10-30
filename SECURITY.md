# Security notes

The site is static and talks to Supabase directly from the browser. That means the API key in
`assets/js/config.js` is public, and the only thing standing between a visitor and the data is
PostgreSQL row-level security. This document records what that means and what was checked.

## The key

`config.js` holds a **publishable** key (`sb_publishable_…`). It is safe to publish: it carries no
privileges of its own, and every request it makes is filtered by the policies below. The
`service_role` key — which bypasses RLS entirely — is never in this repository, and `tools/build.py`
fails the build if the string appears in any file.

## Tables and policies

| Table | anon can read | anon can write | Notes |
| --- | --- | --- | --- |
| `site_modules` | published rows only | no | the module catalogue |
| `site_campuses` | published rows only | no | campus list for the enquiry form |
| `site_notices` | published, already live, not expired | no | the notice card |
| `site_enquiries` | **no** | insert, `status = 'new'` only | staff read through the service role |

`site_enquiries` deliberately has no `SELECT` policy for `anon` or `authenticated`. RLS plus the
absence of a `GRANT` means a visitor cannot read back enquiries, their own or anyone else's — the
form posts with `Prefer: return=minimal` so it does not need the row back.

## Abuse control

A `BEFORE INSERT` trigger caps an email address at five enquiries per hour. Beyond that the insert
raises, and the form shows a plain message instead of a stack trace. The function is
`SECURITY DEFINER` with `search_path` pinned to `public, pg_temp`, and `EXECUTE` is revoked from
`anon` and `authenticated`.

## What was verified

| Check | Result |
| --- | --- |
| RLS enabled on all four tables | yes |
| anon can read `site_modules` | 18 rows |
| anon can read `site_enquiries` | denied — `permission denied for table site_enquiries` |
| anon can insert an enquiry with `status = 'new'` | accepted |
| anon can insert with `status = 'closed'` | rejected — RLS policy violation |
| anon can update or delete any row | no policy, no grant |
| enquiry rate limit | 5 per email per hour, enforced in a trigger |
| service key in the repository | none; the build fails if one appears |

## Known limits

- The publishable key is public and can be scraped. That is by design; the rate limit and RLS are
  the defence, not secrecy.
- The rate limit is per email address, not per IP — an attacker with many addresses is not slowed by
  it. Supabase's own rate limiting at the edge is the next layer, and a CAPTCHA belongs on the form
  before this goes in front of real traffic.
- Enquiries are not emailed anywhere yet; they land in the table.
- Content is edited with SQL or the Supabase dashboard. There is no admin UI, and therefore no admin
  UI to secure.

## Reporting

Security issues: open a private advisory on the repository rather than a public issue.
