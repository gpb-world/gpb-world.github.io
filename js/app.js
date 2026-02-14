/**
 * app.js - Main renderer for Global Prosperity Barometer
 * Detects page, renders dynamic content, orchestrates data + i18n
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await Data.init();
    await I18n.init();
  } catch (e) {
    console.error('Init failed:', e);
    return;
  }

  if (typeof CountrySelector !== 'undefined') CountrySelector.init();

  const page = detectPage();
  if (page === 'index') renderIndex();
  else if (page === 'country') renderCountry();
  else if (page === 'pillar') renderPillar();
  else if (page === 'compare') renderCompare();
  else if (page === 'prosperity') renderProsperityPage();
  else if (page === 'trade') renderTradePage();

  // Re-render on language change
  document.addEventListener('gpb-lang-change', () => {
    if (page === 'index') renderIndex();
    else if (page === 'country') renderCountry();
    else if (page === 'pillar') renderPillar();
    else if (page === 'compare') renderCompare();
    else if (page === 'prosperity') renderProsperityPage();
    else if (page === 'trade') renderTradePage();
  });
});

function detectPage() {
  const path = window.location.pathname;
  if (path.includes('country.html')) return 'country';
  if (path.includes('pillar.html')) return 'pillar';
  if (path.includes('compare.html')) return 'compare';
  if (path.includes('prosperity.html')) return 'prosperity';
  if (path.includes('trade.html')) return 'trade';
  if (path.includes('index.html') || path.endsWith('/')) return 'index';
  return 'index';
}

function renderIndex() {
  renderGovernanceBar();
  renderPeaceBar();
  renderGlobalEconBar();
  renderOverviewCards();
  renderTopCountries();
  renderGlobalTrade();
  renderPillarCards();
}

function renderGovernanceBar() {
  const container = document.getElementById('governance-bar');
  if (!container) return;

  const politics = Data.getAllPolitics();
  const entries = Object.values(politics);
  if (!entries.length) { container.innerHTML = ''; return; }

  const regimes = { full_democracy: 0, flawed_democracy: 0, hybrid_regime: 0, authoritarian: 0 };
  const systems = {};
  entries.forEach(p => {
    regimes[p.regime] = (regimes[p.regime] || 0) + 1;
    systems[p.system] = (systems[p.system] || 0) + 1;
  });

  const total = entries.length;
  const regimeColors = { full_democracy: '#2E7D32', flawed_democracy: '#66BB6A', hybrid_regime: '#FFA726', authoritarian: '#E53935' };
  const regimeKeys = ['full_democracy', 'flawed_democracy', 'hybrid_regime', 'authoritarian'];

  const barSegments = regimeKeys.map(k => {
    const pct = (regimes[k] / total * 100).toFixed(1);
    return `<div class="regime-seg" style="width:${pct}%;background:${regimeColors[k]}" title="${I18n.t('pol.regime.' + k)}: ${regimes[k]}"></div>`;
  }).join('');

  const legendItems = regimeKeys.map(k =>
    `<div class="regime-legend-item"><span class="regime-dot" style="background:${regimeColors[k]}"></span>${I18n.t('pol.regime.' + k)}: <strong>${regimes[k]}</strong></div>`
  ).join('');

  // Top 3 government forms
  const topSystems = Object.entries(systems).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const systemTags = topSystems.map(([k, v]) =>
    `<span class="system-tag">${I18n.t('pol.system.' + k)} <strong>${v}</strong></span>`
  ).join('');

  const avgDemocracy = (entries.reduce((s, p) => s + p.democracy_score, 0) / total).toFixed(1);
  const avgCorruption = Math.round(entries.reduce((s, p) => s + p.corruption_rank, 0) / total);
  const avgPress = Math.round(entries.reduce((s, p) => s + p.press_freedom_rank, 0) / total);

  container.innerHTML = `
    <h3 class="global-section-title">${I18n.t('pol.title')}</h3>
    <div class="governance-content">
      <div class="regime-bar-wrap">
        <div class="regime-bar">${barSegments}</div>
        <div class="regime-legend">${legendItems}</div>
      </div>
      <div class="governance-stats">
        <div class="gov-stat"><span class="gov-stat-value">${avgDemocracy}/10</span><span class="gov-stat-label">${I18n.t('pol.avg_democracy')}</span></div>
        <div class="gov-stat"><span class="gov-stat-value">#${avgCorruption}</span><span class="gov-stat-label">${I18n.t('pol.avg_corruption')}</span></div>
        <div class="gov-stat"><span class="gov-stat-value">#${avgPress}</span><span class="gov-stat-label">${I18n.t('pol.avg_press')}</span></div>
      </div>
      <div class="system-tags">${systemTags}</div>
    </div>`;
}

function renderPeaceBar() {
  const container = document.getElementById('peace-bar');
  if (!container) return;

  const politics = Data.getAllPolitics();
  const countries = Data.getAllCountries();
  const entries = Object.entries(politics);
  if (!entries.length) { container.innerHTML = ''; return; }

  const conflicts = { peace: [], tension: [], minor_conflict: [], major_conflict: [], war: [] };
  entries.forEach(([id, p]) => {
    conflicts[p.conflict_status] = conflicts[p.conflict_status] || [];
    conflicts[p.conflict_status].push(id);
  });

  const statusColors = { peace: '#2E7D32', tension: '#FDD835', minor_conflict: '#FF9800', major_conflict: '#F44336', war: '#B71C1C' };
  const statusIcons = { peace: '🕊️', tension: '⚠️', minor_conflict: '🔶', major_conflict: '🔴', war: '💥' };
  const statusKeys = ['peace', 'tension', 'minor_conflict', 'major_conflict', 'war'];

  const total = entries.length;
  const atPeace = conflicts.peace.length;
  const inConflict = total - atPeace;

  // Avg security score from pillar data
  const avgSecurity = Math.round(countries.reduce((s, c) => s + (c.scores.security || 0), 0) / countries.length);
  const avgGovernance = Math.round(countries.reduce((s, c) => s + (c.scores.governance || 0), 0) / countries.length);

  const statusItems = statusKeys.filter(k => conflicts[k].length > 0).map(k => {
    const names = conflicts[k].map(id => {
      const c = Data.getCountry(id);
      return c ? I18n.getCountryName(c) : id;
    });
    const nameList = names.length <= 4 ? names.join(', ') : names.slice(0, 3).join(', ') + ` +${names.length - 3}`;
    return `<div class="peace-status-row">
      <span class="peace-icon">${statusIcons[k]}</span>
      <span class="peace-label">${I18n.t('peace.status.' + k)}</span>
      <strong class="peace-count">${conflicts[k].length}</strong>
      <span class="peace-countries">${nameList}</span>
    </div>`;
  }).join('');

  container.innerHTML = `
    <h3 class="global-section-title">${I18n.t('peace.title')}</h3>
    <div class="peace-content">
      <div class="peace-headline">
        <div class="peace-big-stat peace-good"><span class="peace-big-num">${atPeace}</span><span class="peace-big-label">${I18n.t('peace.at_peace')}</span></div>
        <div class="peace-big-stat peace-bad"><span class="peace-big-num">${inConflict}</span><span class="peace-big-label">${I18n.t('peace.in_conflict')}</span></div>
        <div class="peace-big-stat"><span class="peace-big-num">${avgSecurity}/100</span><span class="peace-big-label">${I18n.t('peace.avg_security')}</span></div>
        <div class="peace-big-stat"><span class="peace-big-num">${avgGovernance}/100</span><span class="peace-big-label">${I18n.t('peace.avg_governance')}</span></div>
      </div>
      <div class="peace-breakdown">${statusItems}</div>
    </div>`;
}

function renderGlobalEconBar() {
  const container = document.getElementById('global-econ-bar');
  if (!container) return;

  const countries = Data.getAllCountries();
  const allEcon = countries.map(c => Data.getEconomics(c.id)).filter(Boolean);
  if (!allEcon.length) { container.innerHTML = ''; return; }

  const n = allEcon.length;
  const totalGdp = allEcon.reduce((s, e) => s + e.gdp, 0);
  const avgInflation = (allEcon.reduce((s, e) => s + e.inflation, 0) / n).toFixed(1);
  const avgUnemployment = (allEcon.reduce((s, e) => s + e.unemployment, 0) / n).toFixed(1);
  const avgDebt = (allEcon.reduce((s, e) => s + e.public_debt_pct, 0) / n).toFixed(1);
  const avgGdpCap = Math.round(allEcon.reduce((s, e) => s + e.gdp_per_capita, 0) / n);

  function fmtT(v) { return `$${(v/1000).toFixed(1)}T`; }
  function fmtK(v) { return v >= 1000 ? `$${(v/1000).toFixed(1)}K` : `$${v}`; }

  const items = [
    { key: 'global.gdp_total', value: fmtT(totalGdp), icon: '🌍' },
    { key: 'global.avg_gdp_capita', value: fmtK(avgGdpCap), icon: '👤' },
    { key: 'global.avg_inflation', value: `${avgInflation}%`, icon: '📈' },
    { key: 'global.avg_unemployment', value: `${avgUnemployment}%`, icon: '💼' },
    { key: 'global.avg_debt', value: `${avgDebt}%`, icon: '🏦' }
  ];

  container.innerHTML = `
    <h3 class="global-econ-title">${I18n.t('global.econ_title')}</h3>
    <div class="global-econ-items">
      ${items.map(m => `
        <div class="global-econ-item">
          <span class="global-econ-icon">${m.icon}</span>
          <span class="global-econ-value">${m.value}</span>
          <span class="global-econ-label">${I18n.t(m.key)}</span>
        </div>`).join('')}
    </div>`;
}

function renderOverviewCards() {
  const container = document.getElementById('overview-cards');
  if (!container) return;

  // Remove previously rendered pillar cards (keep tile placeholders)
  container.querySelectorAll('.overview-pillar-card').forEach(el => el.remove());

  const avgs = Data.getGlobalAverages();
  const pillars = Data.getPillars();

  // Show first 6 pillars as overview cards
  const html = pillars.slice(0, 6).map(p => {
    const avg = avgs[p.id] || 0;
    return `
      <a href="pillar.html?id=${p.id}" class="card overview-card overview-pillar-card" style="text-decoration:none;color:inherit;border-left:4px solid ${p.color}">
        <div class="card-icon">${p.icon}</div>
        <h3 class="card-title">${I18n.t(p.name_key)}</h3>
        <div class="card-value">${avg}/100</div>
        <p class="card-description">${I18n.t(p.desc_key)}</p>
        <span class="card-link">${I18n.t('pillars.explore')} &rarr;</span>
      </a>`;
  }).join('');

  // Insert pillar cards at the beginning, before tile placeholders
  container.insertAdjacentHTML('afterbegin', html);
}

function renderTopCountries() {
  const container = document.getElementById('top-countries-tile');
  if (!container) return;

  const countries = Data.getAllCountries();
  const allEcon = countries.map(c => ({ country: c, econ: Data.getEconomics(c.id) })).filter(d => d.econ);
  if (!allEcon.length) { container.innerHTML = ''; return; }

  function fmtB(v) { return v >= 1000 ? `$${(v/1000).toFixed(1)}T` : `$${v.toFixed(0)}B`; }

  const totalGdp = allEcon.reduce((s, d) => s + d.econ.gdp, 0);
  const top5 = allEcon.sort((a, b) => b.econ.gdp - a.econ.gdp).slice(0, 5);
  const topList = top5.map(d => I18n.getCountryName(d.country)).join(', ');

  container.innerHTML = `
    <a href="prosperity.html" class="card overview-card" style="text-decoration:none;color:inherit;border-left:4px solid #009edb">
      <div class="card-icon">💰</div>
      <h3 class="card-title">${I18n.t('overview.top_countries')}</h3>
      <div class="card-value">${fmtB(totalGdp)}</div>
      <p class="card-description">${topList}</p>
      <span class="card-link">${I18n.t('overview.view_all')} &rarr;</span>
    </a>`;
}

function renderGlobalTrade() {
  const container = document.getElementById('global-trade-tile');
  if (!container) return;

  const countries = Data.getAllCountries();
  const allEcon = countries.map(c => Data.getEconomics(c.id)).filter(Boolean);
  if (!allEcon.length) { container.innerHTML = ''; return; }

  const totalExports = allEcon.reduce((s, e) => s + (e.exports || 0), 0);
  function fmtT(v) { return `$${(v/1000).toFixed(1)}T`; }

  const avgOpenness = (allEcon.reduce((s, e) => s + (e.exports_pct_gdp || 0), 0) / allEcon.length).toFixed(1);

  container.innerHTML = `
    <a href="trade.html" class="card overview-card" style="text-decoration:none;color:inherit;border-left:4px solid #2E7D32">
      <div class="card-icon">🚢</div>
      <h3 class="card-title">${I18n.t('trade.global_title')}</h3>
      <div class="card-value">${fmtT(totalExports)}</div>
      <p class="card-description">${I18n.t('trade.avg_openness')}: ${avgOpenness}%</p>
      <span class="card-link">${I18n.t('overview.view_all')} &rarr;</span>
    </a>`;
}

function renderProsperityPage() {
  const container = document.getElementById('prosperity-content');
  if (!container) return;

  const countries = Data.getAllCountries();
  const withEcon = countries.map(c => ({ country: c, econ: Data.getEconomics(c.id) })).filter(d => d.econ);
  if (!withEcon.length) { container.innerHTML = ''; return; }

  function fmtB(v) { return v >= 1000 ? `$${(v/1000).toFixed(1)}T` : `$${v.toFixed(0)}B`; }
  function fmtK(v) { return v >= 1000 ? `$${(v/1000).toFixed(1)}K` : `$${v}`; }

  // Summary stats
  const n = withEcon.length;
  const totalGdp = withEcon.reduce((s, d) => s + d.econ.gdp, 0);
  const avgGdpCap = Math.round(withEcon.reduce((s, d) => s + d.econ.gdp_per_capita, 0) / n);
  const avgInflation = (withEcon.reduce((s, d) => s + d.econ.inflation, 0) / n).toFixed(1);
  const avgUnemployment = (withEcon.reduce((s, d) => s + d.econ.unemployment, 0) / n).toFixed(1);
  const avgDebt = (withEcon.reduce((s, d) => s + d.econ.public_debt_pct, 0) / n).toFixed(1);

  const statsHtml = [
    { icon: '\uD83C\uDF0D', value: fmtB(totalGdp), key: 'global.gdp_total' },
    { icon: '\uD83D\uDC64', value: fmtK(avgGdpCap), key: 'global.avg_gdp_capita' },
    { icon: '\uD83D\uDCC8', value: `${avgInflation}%`, key: 'global.avg_inflation' },
    { icon: '\uD83D\uDCBC', value: `${avgUnemployment}%`, key: 'global.avg_unemployment' },
    { icon: '\uD83C\uDFE6', value: `${avgDebt}%`, key: 'global.avg_debt' }
  ].map(m => `
    <div class="trade-tile-stat">
      <span class="trade-tile-icon">${m.icon}</span>
      <span class="trade-tile-value">${m.value}</span>
      <span class="trade-tile-label">${I18n.t(m.key)}</span>
    </div>`).join('');

  // Rank by GDP descending
  const sorted = withEcon.sort((a, b) => b.econ.gdp - a.econ.gdp);

  const rows = sorted.map((d, i) => {
    const e = d.econ;
    const name = I18n.getCountryName(d.country);
    return `<tr>
      <td class="rank-num">${i + 1}</td>
      <td><a href="country.html?id=${d.country.id}">${name}</a></td>
      <td class="top-gdp-cell">${fmtB(e.gdp)}</td>
      <td>${fmtK(e.gdp_per_capita)}</td>
      <td>${e.public_debt_pct}%</td>
      <td>${e.unemployment}%</td>
      <td>${e.inflation}%</td>
    </tr>`;
  }).join('');

  document.title = `${I18n.t('overview.top_countries')} - Global Prosperity Barometer`;

  container.innerHTML = `
    <a href="index.html" class="back-link">&larr; ${I18n.t('ranking.back')}</a>
    <h1>${I18n.t('overview.top_countries')}</h1>
    <div class="trade-tile-stats" style="margin:1.5rem 0">${statsHtml}</div>
    <table class="ranking-table">
      <thead>
        <tr>
          <th>${I18n.t('overview.rank')}</th>
          <th>${I18n.t('overview.country')}</th>
          <th>GDP</th>
          <th>${I18n.t('overview.gdp_capita')}</th>
          <th>${I18n.t('econ.public_debt')}</th>
          <th>${I18n.t('econ.unemployment')}</th>
          <th>${I18n.t('econ.inflation')}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderTradePage() {
  const container = document.getElementById('trade-content');
  if (!container) return;

  const countries = Data.getAllCountries();
  const allEcon = countries.map(c => Data.getEconomics(c.id)).filter(Boolean);
  if (!allEcon.length) { container.innerHTML = ''; return; }

  function fmtB(v) { return v >= 1000 ? `$${(v/1000).toFixed(1)}T` : `$${v.toFixed(0)}B`; }

  const totalExports = allEcon.reduce((s, e) => s + (e.exports || 0), 0);
  const totalImports = allEcon.reduce((s, e) => s + (e.imports || 0), 0);
  const avgOpenness = (allEcon.reduce((s, e) => s + (e.exports_pct_gdp || 0), 0) / allEcon.length).toFixed(1);

  const statsHtml = [
    { icon: '\uD83D\uDCE6', value: fmtB(totalExports), key: 'trade.total_exports' },
    { icon: '\uD83D\uDEA2', value: fmtB(totalImports), key: 'trade.total_imports' },
    { icon: '\uD83D\uDD04', value: `${avgOpenness}%`, key: 'trade.avg_openness' }
  ].map(m => `
    <div class="trade-tile-stat">
      <span class="trade-tile-icon">${m.icon}</span>
      <span class="trade-tile-value">${m.value}</span>
      <span class="trade-tile-label">${I18n.t(m.key)}</span>
    </div>`).join('');

  // Full trade table — sorted by exports % GDP
  const withCountry = allEcon.map(e => {
    const country = countries.find(c => Data.getEconomics(c.id) === e);
    return { e, country };
  }).filter(d => d.country);
  const sorted = withCountry.sort((a, b) => (b.e.exports_pct_gdp || 0) - (a.e.exports_pct_gdp || 0));

  const rows = sorted.map((d, i) => {
    const name = I18n.getCountryName(d.country);
    const e = d.e;
    const balance = e.trade_balance != null ? e.trade_balance : (e.exports && e.imports ? e.exports - e.imports : null);
    const balanceStr = balance != null ? `${balance >= 0 ? '+' : ''}${fmtB(Math.abs(balance))}` : '\u2014';
    const balanceColor = balance != null ? (balance >= 0 ? '#2E7D32' : '#E53935') : '';
    const topExports = (e.top_exports || []).slice(0, 3).join(', ');
    return `<tr>
      <td class="rank-num">${i + 1}</td>
      <td><a href="country.html?id=${d.country.id}">${name}</a></td>
      <td class="trade-val">${e.exports_pct_gdp || '\u2014'}%</td>
      <td>${e.exports != null ? fmtB(e.exports) : '\u2014'}</td>
      <td>${e.imports != null ? fmtB(e.imports) : '\u2014'}</td>
      <td style="color:${balanceColor};font-weight:600">${balanceStr}</td>
      <td class="trade-products">${topExports}</td>
    </tr>`;
  }).join('');

  document.title = `${I18n.t('trade.global_title')} - Global Prosperity Barometer`;

  container.innerHTML = `
    <a href="index.html" class="back-link">&larr; ${I18n.t('ranking.back')}</a>
    <h1>${I18n.t('trade.global_title')}</h1>
    <div class="trade-tile-stats" style="margin:1.5rem 0">${statsHtml}</div>
    <table class="ranking-table">
      <thead>
        <tr>
          <th>${I18n.t('overview.rank')}</th>
          <th>${I18n.t('overview.country')}</th>
          <th>${I18n.t('trade.openness')}</th>
          <th>${I18n.t('trade.exports')}</th>
          <th>${I18n.t('trade.imports')}</th>
          <th>${I18n.t('trade.balance')}</th>
          <th>${I18n.t('trade.top_exports')}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderPillarCards() {
  const container = document.getElementById('pillar-cards');
  if (!container) return;

  const pillars = Data.getPillars();
  const avgs = Data.getGlobalAverages();

  const html = pillars.map(p => {
    const avg = avgs[p.id] || 0;
    return `
      <a href="pillar.html?id=${p.id}" class="card pillar-card" style="text-decoration:none;color:inherit;border-left:4px solid ${p.color}">
        <div class="card-icon">${p.icon}</div>
        <h3 class="card-title">${I18n.t(p.name_key)}</h3>
        <p class="card-description">${I18n.t(p.desc_key)}</p>
        <div class="card-avg"><span class="avg-label">${I18n.t('pillars.global_avg')}:</span> <strong>${avg}</strong>/100</div>
      </a>`;
  }).join('');

  container.innerHTML = html;
}

function renderCountry() {
  const container = document.getElementById('country-content');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const country = Data.getCountry(id);

  if (!country) {
    container.innerHTML = `<p class="not-found">${I18n.t('country.not_found')}</p>`;
    return;
  }

  const overall = Data.getOverallScore(country);
  const ranking = Data.getRanking('overall');
  const rank = ranking.findIndex(r => r.id === id) + 1;
  const pillars = Data.getPillars();

  const pillarBars = pillars.map(p => {
    const score = country.scores[p.id] || 0;
    const label = Data.getScoreLabel(score);
    return `
      <div class="score-row">
        <a href="pillar.html?id=${p.id}" class="score-label">${p.icon} ${I18n.t(p.name_key)}</a>
        <div class="score-bar-track">
          <div class="score-bar-fill score-${label}" style="width:${score}%"></div>
        </div>
        <span class="score-value">${score}</span>
      </div>`;
  }).join('');

  const name = I18n.getCountryName(country);
  document.title = `${name} - Global Prosperity Barometer`;

  container.innerHTML = `
    <a href="index.html" class="back-link">&larr; ${I18n.t('country.back')}</a>
    <h1 class="country-name">${name}</h1>
    <div class="country-meta">
      <div class="meta-card">
        <div class="meta-label">${I18n.t('country.overall')}</div>
        <div class="meta-value score-${Data.getScoreLabel(overall)}-text">${overall}/100</div>
      </div>
      <div class="meta-card">
        <div class="meta-label">${I18n.t('country.rank')}</div>
        <div class="meta-value">#${rank} / ${ranking.length}</div>
      </div>
    </div>
    <h2 class="scores-heading">${I18n.t('country.pillar_scores')}</h2>
    <div class="score-bars">${pillarBars}</div>
    <div id="econ-dashboard"></div>`;

  renderEconomicDashboard(country);
}

// Track chart instances for cleanup on re-render
let _econCharts = [];

function renderEconomicDashboard(country) {
  const container = document.getElementById('econ-dashboard');
  if (!container) return;

  const econ = Data.getEconomics(country.id);
  if (!econ) {
    container.innerHTML = '';
    return;
  }

  // Destroy old charts
  _econCharts.forEach(c => c.destroy());
  _econCharts = [];

  function fmtB(v) { return v >= 1000 ? `$${(v/1000).toFixed(1)}T` : `$${v.toFixed(0)}B`; }
  function fmtK(v) { return v >= 1000 ? `$${(v/1000).toFixed(1)}K` : `$${v.toFixed(0)}`; }

  const metrics = [
    { key: 'econ.gdp', value: fmtB(econ.gdp) },
    { key: 'econ.gdp_per_capita', value: fmtK(econ.gdp_per_capita) },
    { key: 'econ.public_debt', value: `${econ.public_debt_pct}%` },
    { key: 'econ.unemployment', value: `${econ.unemployment}%` },
    { key: 'econ.inflation', value: `${econ.inflation}%` },
    { key: 'econ.gni_per_capita', value: fmtK(econ.gni_per_capita) }
  ];

  const metricCards = metrics.map(m => `
    <div class="econ-metric">
      <div class="econ-metric-label">${I18n.t(m.key)}</div>
      <div class="econ-metric-value">${m.value}</div>
    </div>`).join('');

  const revKeys = ['taxes', 'social_contributions', 'grants', 'other'];
  const expKeys = ['social_protection', 'health', 'education', 'defense', 'infrastructure', 'public_services', 'debt_service', 'other'];

  const revLegend = revKeys.map((k, i) => {
    const colors = ['#2E7D32', '#4CAF50', '#81C784', '#C8E6C9'];
    return `<div class="econ-legend-item"><span class="econ-legend-dot" style="background:${colors[i]}"></span>${I18n.t('econ.rev.' + k)}: ${econ.revenue[k]}%</div>`;
  }).join('');

  const expColors = ['#1565C0', '#42A5F5', '#7E57C2', '#EF5350', '#FF7043', '#FFA726', '#78909C', '#BDBDBD'];
  const expLegend = expKeys.map((k, i) =>
    `<div class="econ-legend-item"><span class="econ-legend-dot" style="background:${expColors[i]}"></span>${I18n.t('econ.exp.' + k)}: ${econ.expenditure[k]}%</div>`
  ).join('');

  // Trade section
  let tradeHtml = '';
  if (econ.exports != null) {
    const balance = econ.trade_balance || (econ.exports - econ.imports);
    const balanceSign = balance >= 0 ? '+' : '';
    const balanceColor = balance >= 0 ? '#2E7D32' : '#E53935';
    const topExports = (econ.top_exports || []).map(t => `<span class="trade-tag">${t}</span>`).join('');

    tradeHtml = `
    <h2 class="scores-heading">${I18n.t('trade.title')}</h2>
    <div class="econ-metrics">
      <div class="econ-metric">
        <div class="econ-metric-label">${I18n.t('trade.exports')}</div>
        <div class="econ-metric-value">${fmtB(econ.exports)}</div>
      </div>
      <div class="econ-metric">
        <div class="econ-metric-label">${I18n.t('trade.imports')}</div>
        <div class="econ-metric-value">${fmtB(econ.imports)}</div>
      </div>
      <div class="econ-metric">
        <div class="econ-metric-label">${I18n.t('trade.balance')}</div>
        <div class="econ-metric-value" style="color:${balanceColor}">${balanceSign}${fmtB(Math.abs(balance))}</div>
      </div>
      <div class="econ-metric">
        <div class="econ-metric-label">${I18n.t('trade.openness')}</div>
        <div class="econ-metric-value">${econ.exports_pct_gdp || '—'}%</div>
      </div>
    </div>
    ${topExports ? `<div class="trade-tags-section"><span class="trade-tags-label">${I18n.t('trade.top_exports')}:</span> ${topExports}</div>` : ''}`;
  }

  container.innerHTML = `
    <h2 class="scores-heading">${I18n.t('econ.title')}</h2>
    <div class="econ-metrics">${metricCards}</div>
    <div class="econ-charts">
      <div class="econ-chart-box">
        <h3>${I18n.t('econ.revenue_title')}</h3>
        <canvas id="chart-revenue"></canvas>
        <div class="econ-legend">${revLegend}</div>
      </div>
      <div class="econ-chart-box">
        <h3>${I18n.t('econ.expenditure_title')}</h3>
        <canvas id="chart-expenditure"></canvas>
        <div class="econ-legend">${expLegend}</div>
      </div>
    </div>
    ${tradeHtml}`;

  // Create charts after DOM insertion
  if (typeof Chart !== 'undefined') {
    const revCtx = document.getElementById('chart-revenue');
    const expCtx = document.getElementById('chart-expenditure');

    if (revCtx) {
      _econCharts.push(new Chart(revCtx, {
        type: 'doughnut',
        data: {
          labels: revKeys.map(k => I18n.t('econ.rev.' + k)),
          datasets: [{
            data: revKeys.map(k => econ.revenue[k]),
            backgroundColor: ['#2E7D32', '#4CAF50', '#81C784', '#C8E6C9'],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed}%` } }
          }
        }
      }));
    }

    if (expCtx) {
      _econCharts.push(new Chart(expCtx, {
        type: 'doughnut',
        data: {
          labels: expKeys.map(k => I18n.t('econ.exp.' + k)),
          datasets: [{
            data: expKeys.map(k => econ.expenditure[k]),
            backgroundColor: expColors,
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed}%` } }
          }
        }
      }));
    }
  }
}

function renderPillar() {
  const container = document.getElementById('pillar-content');
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || 'overall';
  const pillar = Data.getPillar(id);
  const pillars = Data.getPillars();

  const pillarName = pillar ? I18n.t(pillar.name_key) : I18n.t('ranking.all_pillars');
  const pillarIcon = pillar ? pillar.icon : '\ud83c\udf10';
  document.title = `${pillarName} - Global Prosperity Barometer`;

  const ranking = Data.getRanking(id);

  // Pillar selector tabs
  const tabs = `
    <div class="pillar-tabs">
      <a href="pillar.html?id=overall" class="pillar-tab ${id === 'overall' ? 'active' : ''}">\ud83c\udf10 ${I18n.t('ranking.all_pillars')}</a>
      ${pillars.map(p => `
        <a href="pillar.html?id=${p.id}" class="pillar-tab ${p.id === id ? 'active' : ''}" style="${p.id === id ? 'border-color:' + p.color : ''}">${p.icon} ${I18n.t(p.name_key)}</a>
      `).join('')}
    </div>`;

  const rows = ranking.map((r, i) => `
    <tr>
      <td class="rank-num">${i + 1}</td>
      <td><a href="country.html?id=${r.id}">${I18n.getCountryName({ name: r.name, id: r.id })}</a></td>
      <td>
        <div class="rank-bar-wrap">
          <div class="rank-bar score-${Data.getScoreLabel(r.score)}" style="width:${r.score}%"></div>
          <span class="rank-score">${r.score}</span>
        </div>
      </td>
    </tr>`).join('');

  const sourcesHtml = pillar && pillar.sources
    ? `<div class="sources"><h3>${I18n.t('ranking.sources')}</h3><ul>${pillar.sources.map(s => `<li>${s}</li>`).join('')}</ul></div>`
    : '';

  container.innerHTML = `
    <a href="index.html" class="back-link">&larr; ${I18n.t('ranking.back')}</a>
    <h1>${pillarIcon} ${pillarName}</h1>
    ${pillar ? `<p class="pillar-desc">${I18n.t(pillar.desc_key)}</p>` : ''}
    ${tabs}
    <table class="ranking-table">
      <thead>
        <tr>
          <th>${I18n.t('ranking.rank')}</th>
          <th>${I18n.t('ranking.country')}</th>
          <th>${I18n.t('ranking.score')}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${sourcesHtml}`;
}

// Track compare chart instances for cleanup
let _compareCharts = [];

function renderCompare() {
  const container = document.getElementById('compare-content');
  if (!container) return;

  // Destroy old charts
  _compareCharts.forEach(c => c.destroy());
  _compareCharts = [];

  const params = new URLSearchParams(window.location.search);
  const ids = params.getAll('c').slice(0, 3);
  const countries = Data.getAllCountries();
  const lang = I18n.getLang();
  const pillars = Data.getPillars();

  const sorted = countries.slice().sort((a, b) =>
    I18n.getCountryName(a).localeCompare(I18n.getCountryName(b), lang)
  );

  // Build picker selects
  const selCount = 3;
  const selectsHtml = Array.from({ length: selCount }, (_, i) => {
    const sel = ids[i] || '';
    const options = sorted.map(c => {
      const name = I18n.getCountryName(c);
      return `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${name}</option>`;
    }).join('');
    return `<select id="compare-sel-${i}">
      <option value="">${i < 2 ? I18n.t('compare.select_country') : I18n.t('compare.add_country')}</option>
      ${options}
    </select>`;
  }).join('');

  container.innerHTML = `
    <a href="index.html" class="back-link">&larr; ${I18n.t('country.back')}</a>
    <h1 class="page-title">${I18n.t('compare.title')}</h1>
    <p class="page-intro">${I18n.t('compare.intro')}</p>
    <div class="compare-picker">
      ${selectsHtml}
      <button class="compare-btn" id="compare-go">${I18n.t('compare.btn')}</button>
    </div>
    <div id="compare-results"></div>`;

  document.getElementById('compare-go').addEventListener('click', () => {
    const chosen = [];
    for (let i = 0; i < selCount; i++) {
      const v = document.getElementById(`compare-sel-${i}`).value;
      if (v) chosen.push(v);
    }
    if (chosen.length < 2) return;
    const url = 'compare.html?' + chosen.map(c => `c=${c}`).join('&');
    window.location.href = url;
  });

  // If we have valid selections, render results
  const selected = ids.map(id => Data.getCountry(id)).filter(Boolean);
  if (selected.length < 2) {
    document.getElementById('compare-results').innerHTML =
      `<div class="compare-hint">${I18n.t('compare.select_hint')}</div>`;
    return;
  }

  const compareColors = ['#009edb', '#e53935', '#2E7D32'];

  // Radar chart
  const radarHtml = `
    <div class="compare-section">
      <h2>${I18n.t('compare.radar_title')}</h2>
      <div class="compare-radar-wrap"><canvas id="compare-radar"></canvas></div>
    </div>`;

  // Grouped pillar bars
  const barsHtml = pillars.map(p => {
    const bars = selected.map((c, i) => {
      const score = c.scores[p.id] || 0;
      const label = Data.getScoreLabel(score);
      const name = I18n.getCountryName(c);
      return `<div class="compare-bar-entry">
        <span class="compare-bar-name">${name}</span>
        <div class="compare-bar-track">
          <div class="compare-bar-fill" style="width:${score}%;background:${compareColors[i]}"></div>
        </div>
        <span class="compare-bar-value">${score}</span>
      </div>`;
    }).join('');
    return `<div class="compare-bar-row">
      <div class="compare-bar-label">${p.icon} ${I18n.t(p.name_key)}</div>
      <div class="compare-bar-group">${bars}</div>
    </div>`;
  }).join('');

  // Economic comparison table
  const econData = selected.map(c => ({ country: c, econ: Data.getEconomics(c.id) }));
  const hasEcon = econData.some(d => d.econ);

  function fmtB(v) { return v >= 1000 ? `$${(v/1000).toFixed(1)}T` : `$${v.toFixed(0)}B`; }
  function fmtK(v) { return v >= 1000 ? `$${(v/1000).toFixed(1)}K` : `$${v.toFixed(0)}`; }

  const econMetrics = [
    { key: 'econ.gdp', fn: e => fmtB(e.gdp) },
    { key: 'econ.gdp_per_capita', fn: e => fmtK(e.gdp_per_capita) },
    { key: 'econ.public_debt', fn: e => `${e.public_debt_pct}%` },
    { key: 'econ.unemployment', fn: e => `${e.unemployment}%` },
    { key: 'econ.inflation', fn: e => `${e.inflation}%` },
    { key: 'econ.gni_per_capita', fn: e => fmtK(e.gni_per_capita) },
    { key: 'trade.exports', fn: e => e.exports != null ? fmtB(e.exports) : '—' },
    { key: 'trade.imports', fn: e => e.imports != null ? fmtB(e.imports) : '—' },
    { key: 'trade.balance', fn: e => e.trade_balance != null ? `${e.trade_balance >= 0 ? '+' : ''}${fmtB(Math.abs(e.trade_balance))}` : '—' }
  ];

  let econTableHtml = '';
  if (hasEcon) {
    const headerCols = selected.map(c => `<th>${I18n.getCountryName(c)}</th>`).join('');
    const rows = econMetrics.map(m => {
      const cells = econData.map(d => {
        if (!d.econ) return '<td>-</td>';
        return `<td>${m.fn(d.econ)}</td>`;
      }).join('');
      return `<tr><td><strong>${I18n.t(m.key)}</strong></td>${cells}</tr>`;
    }).join('');

    econTableHtml = `
      <div class="compare-section">
        <h2>${I18n.t('compare.econ_title')}</h2>
        <table class="compare-econ-table">
          <thead><tr><th></th>${headerCols}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  document.getElementById('compare-results').innerHTML = `
    ${radarHtml}
    <div class="compare-section">
      <h2>${I18n.t('compare.pillars_title')}</h2>
      <div class="compare-bars">${barsHtml}</div>
    </div>
    ${econTableHtml}`;

  // Draw radar chart
  if (typeof Chart !== 'undefined') {
    const radarCtx = document.getElementById('compare-radar');
    if (radarCtx) {
      const datasets = selected.map((c, i) => ({
        label: I18n.getCountryName(c),
        data: pillars.map(p => c.scores[p.id] || 0),
        borderColor: compareColors[i],
        backgroundColor: compareColors[i] + '22',
        pointBackgroundColor: compareColors[i],
        borderWidth: 2
      }));

      _compareCharts.push(new Chart(radarCtx, {
        type: 'radar',
        data: {
          labels: pillars.map(p => I18n.t(p.name_key)),
          datasets
        },
        options: {
          responsive: true,
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: { stepSize: 20, font: { size: 10 } },
              pointLabels: { font: { size: 11 } }
            }
          },
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      }));
    }
  }
}
