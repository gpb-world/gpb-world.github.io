# Global Prosperity Barometer

Open-data civic platform monitoring prosperity indicators across 50 countries.

## Structure

```
index.html          Homepage with overview cards and interactive map
country.html        Country detail page (?id=norway)
pillar.html         Pillar rankings page (?id=governance)
map.html            Leaflet interactive map (embedded + standalone)
about.html          About the project
methodology.html    Data methodology
impressum.html      Legal notice
privacy.html        Privacy policy

js/
  data.js           Data loader and cache
  i18n.js           Translation engine (12 languages)
  app.js            Main page renderer
  map.js            Leaflet map logic

data/
  countries.json    50 countries with scores, coords, translated names
  pillars.json      12 pillar definitions
  lang/
    index.json      Language manifest
    en.json          English UI strings (+ 11 more languages)

css/
  main.css          Single stylesheet
```

## 12 Pillars of Prosperity

1. Governance
2. Security & Safety
3. Education
4. Health
5. Environment
6. Economic Opportunity
7. Social Inclusion
8. Infrastructure
9. Innovation
10. Economic Equity
11. Energy & Resources
12. Housing & Urban Development

## Adding Data

| Operation | Files to touch |
|-----------|---------------|
| Add a country | `countries.json` |
| Add a language | `lang/xx.json` + `lang/index.json` |
| Add a pillar | `pillars.json` + `countries.json` + `lang/*.json` |

## Development

```bash
python3 -m http.server 8000
# Open http://localhost:8000
```

## Data Sources

- [World Bank Open Data](https://data.worldbank.org)
- [UN Data](https://data.un.org)
- [Freedom House](https://freedomhouse.org)
- [V-Dem Institute](https://v-dem.net)
- [WHO](https://www.who.int/data)
- [IEA](https://iea.org)

## License

Open data platform. All source data comes from publicly accessible international databases.
