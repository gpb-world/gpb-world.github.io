/**
 * app.js - Main renderer for Global Prosperity Barometer
 * Detects page, renders dynamic content, orchestrates data + i18n
 */
document.addEventListener('DOMContentLoaded', async () => {
  await Data.init();
  await I18n.init();

  const page = detectPage();
  if (page === 'index') renderIndex();
  else if (page === 'country') renderCountry();
  else if (page === 'pillar') renderPillar();

  // Re-render on language change
  document.addEventListener('gpb-lang-change', () => {
    if (page === 'index') renderIndex();
    else if (page === 'country') renderCountry();
    else if (page === 'pillar') renderPillar();
  });
});

function detectPage() {
  const path = window.location.pathname;
  if (path.includes('country.html')) return 'country';
  if (path.includes('pillar.html')) return 'pillar';
  if (path.includes('index.html') || path.endsWith('/')) return 'index';
  return 'index';
}

function renderIndex() {
  renderGovernanceBar();
  renderPeaceBar();
  renderGlobalEconBar();
  renderOverviewCards();
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

  const avgs = Data.getGlobalAverages();
  const pillars = Data.getPillars();

  // Show first 6 pillars as overview cards
  const html = pillars.slice(0, 6).map(p => {
    const avg = avgs[p.id] || 0;
    return `
      <a href="pillar.html?id=${p.id}" class="card overview-card" style="text-decoration:none;color:inherit;border-left:4px solid ${p.color}">
        <div class="card-icon">${p.icon}</div>
        <h3 class="card-title">${I18n.t(p.name_key)}</h3>
        <div class="card-value">${avg}/100</div>
        <p class="card-description">${I18n.t(p.desc_key)}</p>
        <span class="card-link">${I18n.t('pillars.explore')} &rarr;</span>
      </a>`;
  }).join('');

  container.innerHTML = html;
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
    </div>`;

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
