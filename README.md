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

There is no sample data and no "demo mode". If the API is unreachable the module grid says so and
offers a retry, rather than showing invented content.

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
