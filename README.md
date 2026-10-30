# EduSphere — site

The public page for EduSphere, a multi-campus college ERP. Static, no framework, no build
dependencies beyond Python 3 for the generator.

**Live:** https://suman876-ops.github.io/edusphere-v2/

## Languages in this project

| Language | Where | What it does |
| --- | --- | --- |
| HTML | `index.html` | The page: hero, notice, roles, portals, modules, data layer, lifecycle, mapping table |
| CSS | `assets/css/styles.css` | Design tokens, warm paper palette, glass cards, responsive layout |
| JavaScript | `assets/js/app.js` | Scroll reveal, module filters, live search, progress bar, back-to-top |
| TypeScript | `src/search.ts` → `assets/js/search.js` | Typed search core, compiled to plain JS |
| JSON | `data/modules.json` | The eighteen-module catalogue — the single source for the module grid |
| Python | `tools/build.py` | Renders the grid from JSON and verifies the whole site |
| Bash | `tools/serve.sh` | Local preview server |
| YAML | `.github/workflows/ci.yml` | CI: rebuild, verify, refuse a stale commit |
| Make | `Makefile` | `make build`, `make check`, `make serve`, `make zip`, `make deploy` |
| Markdown | `README.md` | This file |

## Layout

```
.
├── index.html                  the page
├── assets/
│   ├── css/styles.css
│   └── js/{app.js, search.js}
├── data/modules.json           module catalogue
├── src/search.ts               TypeScript source for search.js
├── tools/
│   ├── build.py                generate + verify
│   └── serve.sh                local preview
├── .github/workflows/ci.yml
└── Makefile
```

## Working on it

```bash
make            # regenerate the module grid and verify everything
make serve      # http://localhost:8080
make zip        # dist/edusphere-site.zip
```

To add or change a module, edit `data/modules.json` and run `make build`. Never edit the cards
between the `modules:start` and `modules:end` markers in `index.html` — the next build overwrites
them. CI fails the build if `index.html` and the JSON disagree.

## Notes

- The page works offline: no framework, no fetch calls, no runtime dependency on a CDN. The only
  network request is the Google Fonts stylesheet, and the font stack falls back to Georgia.
- Module filters and search are client-side; both work together, and the filter chips stay
  consistent with the search box.
- Colours, spacing and type live as CSS custom properties at the top of `styles.css`.

## Licence

MIT
