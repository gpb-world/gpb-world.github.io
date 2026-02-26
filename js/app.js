/**
 * app.js - Main renderer for World Barometer
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

  // Global tooltip element
  const _tooltip = document.createElement('div');
  _tooltip.id = 'gpb-tooltip';
  document.body.appendChild(_tooltip);

  function _showTooltip(btn) {
    const text = btn.dataset.countries || (btn.dataset.desc ? I18n.t(btn.dataset.desc) : '');
    if (!text || text === btn.dataset.desc) return;
    _tooltip.textContent = text;
    _tooltip.classList.add('visible');
    const rect = btn.getBoundingClientRect();
    const tipH = _tooltip.offsetHeight;
    const tipW = _tooltip.offsetWidth;
    let top = rect.top - tipH - 8;
    let left = rect.left + rect.width / 2 - tipW / 2;
    if (top < 8) top = rect.bottom + 8;
    if (left < 8) left = 8;
    if (left + tipW > window.innerWidth - 8) left = window.innerWidth - tipW - 8;
    _tooltip.style.top = top + 'px';
    _tooltip.style.left = left + 'px';
  }

  function _hideTooltip() {
    _tooltip.classList.remove('visible');
    document.querySelectorAll('.info-btn.active').forEach(b => b.classList.remove('active'));
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.info-btn');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      if (btn.classList.contains('active')) { _hideTooltip(); }
      else { _hideTooltip(); btn.classList.add('active'); _showTooltip(btn); }
      return;
    }
    _hideTooltip();
  });

  document.addEventListener('mouseenter', (e) => {
    if (e.target.classList && e.target.classList.contains('info-btn')) {
      _hideTooltip(); e.target.classList.add('active'); _showTooltip(e.target);
    }
  }, true);

  document.addEventListener('mouseleave', (e) => {
    if (e.target.classList && e.target.classList.contains('info-btn')) { _hideTooltip(); }
  }, true);

  window.addEventListener('scroll', () => { _hideTooltip(); }, { passive: true });

  const page = detectPage();
  if (page === 'index') renderIndex();
  else if (page === 'country') renderCountry();
  else if (page === 'pillar') renderPillar();
  else if (page === 'compare') renderCompare();
  else if (page === 'quiz') renderQuiz();
  else if (page === 'prosperity') renderProsperityPage();
  else if (page === 'trade') renderTradePage();
  else if (page === 'press-freedom') renderPressFreedomPage();
  else if (page === 'life-satisfaction') renderLifeSatisfactionPage();
  else if (page === 'rule-of-law') renderRuleOfLawPage();

  // Re-render on language change
  document.addEventListener('gpb-lang-change', () => {
    if (page === 'index') renderIndex();
    else if (page === 'country') renderCountry();
    else if (page === 'pillar') renderPillar();
    else if (page === 'compare') renderCompare();
    else if (page === 'quiz') renderQuiz();
    else if (page === 'prosperity') renderProsperityPage();
    else if (page === 'trade') renderTradePage();
    else if (page === 'press-freedom') renderPressFreedomPage();
    else if (page === 'life-satisfaction') renderLifeSatisfactionPage();
    else if (page === 'rule-of-law') renderRuleOfLawPage();
  });

  // Sticky back bar on ranking pages (moves together with header)
  const backLink = document.querySelector('.back-link');
  if (backLink) {
    const header = document.querySelector('.header');
    document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
    const bar = document.createElement('div');
    bar.className = 'back-bar';
    bar.innerHTML = `<a href="${backLink.getAttribute('href')}">${backLink.innerHTML}</a>`;
    header.after(bar);
    backLink.style.display = 'none';
  }

  // Scroll-to-top button
  const btn = document.createElement('button');
  btn.className = 'scroll-top-btn';
  btn.innerHTML = '&#9650;';
  btn.title = 'Scroll to top';
  document.body.appendChild(btn);
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Horizontal scroll arrows for .grid-5 containers
  document.querySelectorAll('.grid-5').forEach(grid => {
    const wrapper = document.createElement('div');
    wrapper.className = 'scroll-wrapper';
    grid.parentNode.insertBefore(wrapper, grid);
    wrapper.appendChild(grid);

    const leftBtn = document.createElement('button');
    leftBtn.className = 'scroll-arrow scroll-arrow-left';
    leftBtn.innerHTML = '&#9664;';
    leftBtn.setAttribute('aria-label', 'Scroll left');

    const rightBtn = document.createElement('button');
    rightBtn.className = 'scroll-arrow scroll-arrow-right';
    rightBtn.innerHTML = '&#9654;';
    rightBtn.setAttribute('aria-label', 'Scroll right');

    wrapper.appendChild(leftBtn);
    wrapper.appendChild(rightBtn);

    function updateArrows() {
      const canLeft = grid.scrollLeft > 5;
      const canRight = grid.scrollLeft < grid.scrollWidth - grid.clientWidth - 5;
      leftBtn.classList.toggle('visible', canLeft);
      rightBtn.classList.toggle('visible', canRight);
    }

    grid.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    setTimeout(updateArrows, 200);

    leftBtn.addEventListener('click', () => {
      grid.scrollBy({ left: -220, behavior: 'smooth' });
    });
    rightBtn.addEventListener('click', () => {
      grid.scrollBy({ left: 220, behavior: 'smooth' });
    });
  });
});

/* ===== Helper: export i18n key ===== */
function exportKey(name) {
  return 'export.' + name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
}

/* ===== Helper: export product icon ===== */
const _exportIcons = {
  oil_and_gas:'⛽',crude_oil:'🛢️',petroleum_products:'🛢️',natural_gas:'🔥',lng:'🔥',coal:'⛏️',
  machinery:'⚙️',vehicles:'🚗',automobiles:'🚗',auto_parts:'🔧',aircraft:'✈️',aerospace:'🚀',ships:'🚢',
  electronics:'💻',semiconductors:'💾',computers:'🖥️',telecom_equipment:'📡',it_services:'💻',software:'💻',
  gold:'🥇',diamonds:'💎',copper:'🔶',iron_ore:'⛏️',aluminum:'🔩',steel:'🔩',zinc:'🔩',titanium:'🔩',
  ferro_alloys:'🔩',precious_metals:'✨',minerals:'⛏️',mining_products:'⛏️',
  textiles:'🧵',clothing:'👔',garments:'👔',fashion_and_textiles:'👗',footwear:'👟',leather_goods:'👜',
  agriculture:'🌾',wheat:'🌾',rice:'🍚',corn:'🌽',soybeans:'🫘',cotton:'🧶',tobacco:'🍂',sugar:'🍬',
  coffee:'☕',tea:'🍵',cocoa:'🍫',spices:'🌿',palm_oil:'🌴',rubber:'🌳',timber:'🪵',wood_products:'🪵',
  fish_and_seafood:'🐟',meat:'🥩',dairy:'🧀',food_products:'🍽️',beverages:'🍷',wine:'🍷',
  pharmaceuticals:'💊',chemicals:'🧪',fertilizers:'🧪',plastics:'♻️',
  fruits_and_vegetables:'🍎',cashew_nuts:'🥜',nuts:'🥜',vanilla:'🌺',flowers:'💐',
  tourism:'🏖️',financial_services:'🏦',
  cement:'🧱',construction_materials:'🏗️',
  solar_panels:'☀️',electrical_equipment:'🔌',medical_devices:'🏥',
  weapons_and_defense:'🛡️',military_equipment:'🛡️'
};
function exportIcon(name) {
  const k = name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
  return _exportIcons[k] || '📦';
}

/* ===== Helper: info tooltip button ===== */
function infoBtn(descKey) {
  return `<span class="info-btn" data-desc="${descKey}" role="button" tabindex="0">i</span>`;
}

/* ===== Helper: localized list join ===== */
function _formatList(items) {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  const sep = I18n.t('summary.list_separator');
  const last = I18n.t('summary.list_last_separator');
  return items.slice(0, -1).join(sep) + last + items[items.length - 1];
}

/* ===== Country summary builder ===== */
function _buildCountrySummary(country, overall, rank, totalCountries) {
  const lines = [];
  const globalAvgs = Data.getGlobalAverages();
  const pillars = Data.getPillars();

  lines.push(`<div class="summary-line"><span class="summary-icon">📊</span><span class="summary-text">${_tpl(I18n.t('summary.country.ranked'), '<strong>' + rank + '</strong>', '<strong>' + totalCountries + '</strong>', '<strong>' + overall + '</strong>')} ${I18n.t('summary.country.score_label.' + Data.getScoreLabel(overall))}</span></div>`);

  const diffs = pillars.map(p => ({
    name: I18n.t(p.name_key),
    diff: (country.scores[p.id] || 0) - (globalAvgs[p.id] || 0)
  }));
  diffs.sort((a, b) => b.diff - a.diff);

  const strengths = diffs.filter(d => d.diff > 5).slice(0, 3);
  if (strengths.length) {
    lines.push(`<div class="summary-line"><span class="summary-icon">✅</span><span class="summary-text">${_tpl(I18n.t('summary.country.strengths'), '<strong>' + _formatList(strengths.map(s => s.name)) + '</strong>')}</span></div>`);
  }
  const weaknesses = diffs.filter(d => d.diff < -5).sort((a, b) => a.diff - b.diff).slice(0, 3);
  if (weaknesses.length) {
    lines.push(`<div class="summary-line"><span class="summary-icon">⚠️</span><span class="summary-text">${_tpl(I18n.t('summary.country.weaknesses'), '<strong>' + _formatList(weaknesses.map(w => w.name)) + '</strong>')}</span></div>`);
  }

  const pol = Data.getPolitics(country.id);
  if (pol) {
    lines.push(`<div class="summary-line"><span class="summary-icon">🏛️</span><span class="summary-text">${_tpl(I18n.t('summary.country.regime_info'), '<strong>' + I18n.t('pol.regime.' + pol.regime) + '</strong>', '<strong>' + pol.democracy_score + '</strong>')}</span></div>`);
    if (pol.conflict_status && pol.conflict_status !== 'peace') {
      lines.push(`<div class="summary-line"><span class="summary-icon">🔴</span><span class="summary-text">${_tpl(I18n.t('summary.country.conflict'), '<strong>' + I18n.t('peace.status.' + pol.conflict_status) + '</strong>')}</span></div>`);
    }
  }

  const econ = Data.getEconomics(country.id);
  if (econ) {
    const gdpCap = econ.gdp_per_capita >= 1000
      ? '$' + (econ.gdp_per_capita / 1000).toFixed(1) + 'K'
      : '$' + econ.gdp_per_capita;
    lines.push(`<div class="summary-line"><span class="summary-icon">💰</span><span class="summary-text">${_tpl(I18n.t('summary.country.econ_highlight'), '<strong>' + gdpCap + '</strong>', '<strong>' + econ.unemployment + '</strong>', '<strong>' + econ.inflation + '</strong>')}</span></div>`);
  }

  return lines.join('');
}

/* ===== World summary builder ===== */
function _buildWorldSummary() {
  const parts = [];
  const countries = Data.getAllCountries();
  const politics = Data.getAllPolitics();
  const polEntries = Object.values(politics);
  const globalAvgs = Data.getGlobalAverages();
  const pillars = Data.getPillars();

  // Para 1 — hook + mission
  parts.push(`<p>${_tpl(I18n.t('summary.world.para1'), '<strong>' + countries.length + '</strong>')}</p>`);

  // Para 2 — political landscape + peace
  const regimes = { full_democracy: 0, flawed_democracy: 0, hybrid_regime: 0, authoritarian: 0 };
  polEntries.forEach(p => { regimes[p.regime] = (regimes[p.regime] || 0) + 1; });
  let atPeace = 0, inConflict = 0;
  polEntries.forEach(p => { if (p.conflict_status === 'peace') atPeace++; else inConflict++; });
  parts.push(`<p>${_tpl(I18n.t('summary.world.para2'), '<strong>' + regimes.full_democracy + '</strong>', '<strong>' + regimes.flawed_democracy + '</strong>', '<strong>' + regimes.hybrid_regime + '</strong>', '<strong>' + regimes.authoritarian + '</strong>', '<strong>' + atPeace + '</strong>', '<strong>' + inConflict + '</strong>')}</p>`);

  // Para 3 — economy
  const allEcon = countries.map(c => Data.getEconomics(c.id)).filter(Boolean);
  if (allEcon.length) {
    const n = allEcon.length;
    const avgGdpCap = Math.round(allEcon.reduce((s, e) => s + e.gdp_per_capita, 0) / n);
    const avgUnemp = (allEcon.reduce((s, e) => s + e.unemployment, 0) / n).toFixed(1);
    const avgInfl = (allEcon.reduce((s, e) => s + e.inflation, 0) / n).toFixed(1);
    const fmtGdp = avgGdpCap >= 1000 ? '$' + (avgGdpCap / 1000).toFixed(1) + 'K' : '$' + avgGdpCap;
    parts.push(`<p>${_tpl(I18n.t('summary.world.para3'), '<strong>' + fmtGdp + '</strong>', '<strong>' + avgUnemp + '</strong>', '<strong>' + avgInfl + '</strong>')}</p>`);
  }

  // Para 4 — strengths & weaknesses
  const pillarAvgs = pillars.map(p => ({ name: I18n.t(p.name_key), avg: globalAvgs[p.id] || 0 }));
  pillarAvgs.sort((a, b) => b.avg - a.avg);
  const top3 = '<strong>' + _formatList(pillarAvgs.slice(0, 3).map(p => p.name)) + '</strong>';
  const bot3 = '<strong>' + _formatList(pillarAvgs.slice(-3).reverse().map(p => p.name)) + '</strong>';
  parts.push(`<p>${_tpl(I18n.t('summary.world.para4'), top3, bot3)}</p>`);

  // CTA
  parts.push(`<p class="summary-cta">${I18n.t('summary.world.cta')}</p>`);

  return parts.join('');
}

function _shareBarHtml() {
  return `
    <div class="share-bar">
      <span class="share-bar-label">${I18n.t('share.label')}</span>
      <div class="share-bar-buttons">
        <button class="share-btn share-whatsapp" data-platform="whatsapp" title="WhatsApp">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </button>
        <button class="share-btn share-x" data-platform="x" title="X / Twitter">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </button>
        <button class="share-btn share-facebook" data-platform="facebook" title="Facebook">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </button>
        <button class="share-btn share-linkedin" data-platform="linkedin" title="LinkedIn">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        </button>
        <button class="share-btn share-telegram" data-platform="telegram" title="Telegram">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
        </button>
        <button class="share-btn share-copy" data-platform="copy" title="Copy link">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        </button>
      </div>
    </div>`;
}

function _bindShareButtons(container, shareText, shareUrl) {
  container.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const platform = btn.dataset.platform;
      const encoded = encodeURIComponent(shareText + ' ' + shareUrl);
      const encodedUrl = encodeURIComponent(shareUrl);
      const urls = {
        whatsapp: 'https://wa.me/?text=' + encoded,
        x: 'https://x.com/intent/tweet?text=' + encoded,
        facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl + '&quote=' + encodeURIComponent(shareText),
        linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodedUrl,
        telegram: 'https://t.me/share/url?url=' + encodedUrl + '&text=' + encodeURIComponent(shareText)
      };
      if (platform === 'copy') {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(shareText + ' ' + shareUrl).then(() => {
            btn.classList.add('copied');
            setTimeout(() => btn.classList.remove('copied'), 2000);
          });
        }
      } else if (urls[platform]) {
        window.open(urls[platform], '_blank', 'width=600,height=400');
      }
    });
  });
}

function detectPage() {
  const path = window.location.pathname;
  if (path.includes('country.html')) return 'country';
  if (path.includes('pillar.html')) return 'pillar';
  if (path.includes('compare.html')) return 'compare';
  if (path.includes('quiz.html')) return 'quiz';
  if (path.includes('prosperity.html')) return 'prosperity';
  if (path.includes('trade.html')) return 'trade';
  if (path.includes('press-freedom.html')) return 'press-freedom';
  if (path.includes('life-satisfaction.html')) return 'life-satisfaction';
  if (path.includes('rule-of-law.html')) return 'rule-of-law';
  if (path.includes('index.html') || path.endsWith('/')) return 'index';
  return 'index';
}

function renderIndex() {
  const summaryEl = document.getElementById('world-summary');
  if (summaryEl) {
    summaryEl.innerHTML = `<div class="summary-box summary-box--editorial">${_buildWorldSummary()}</div>`;
  }
  renderGovernanceBar();
  renderPeaceBar();
  renderGlobalEconBar();
  renderTopCountries();
  renderGlobalTrade();
  renderPressFreedom();
  renderLifeSatisfaction();
  renderRuleOfLaw();
  renderPillarCards();

  // Share bar
  const shareEl = document.getElementById('share-bar-home');
  if (shareEl) {
    shareEl.innerHTML = _shareBarHtml();
    _bindShareButtons(shareEl,
      I18n.t('share.home_text'),
      'https://world-bar.github.io');
  }
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
  const avgRuleOfLaw = (entries.reduce((s, p) => s + (p.rule_of_law || 0), 0) / total).toFixed(2);

  // Helper to get color/label for rank-based indicators (lower = better)
  function rankLevel(rank) {
    if (rank <= 20) return { color: '#2E7D32', pct: 90 };
    if (rank <= 50) return { color: '#66BB6A', pct: 72 };
    if (rank <= 100) return { color: '#FFA726', pct: 45 };
    if (rank <= 150) return { color: '#E53935', pct: 20 };
    return { color: '#B71C1C', pct: 5 };
  }

  const corr = rankLevel(avgCorruption);
  const press = rankLevel(avgPress);
  const rolPct = Math.round(avgRuleOfLaw * 100);
  const rolColor = rolPct >= 80 ? '#2E7D32' : rolPct >= 65 ? '#66BB6A' : rolPct >= 50 ? '#FFA726' : rolPct >= 40 ? '#E53935' : '#B71C1C';

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
      <div class="indicator-meters" style="margin-top:1rem;">
        <div class="indicator-meter">
          <span class="ind-icon">\u2728</span>
          <span class="ind-title">${I18n.t('corruption.title')}</span>
          <div class="ind-bar-wrap"><div class="ind-bar" style="width:${corr.pct}%;background:${corr.color}"></div></div>
          <span class="ind-label" style="color:${corr.color}">Avg. #${avgCorruption}</span>
          ${infoBtn('desc.corruption')}
        </div>
        <div class="indicator-meter">
          <span class="ind-icon">\u2696\uFE0F</span>
          <span class="ind-title">${I18n.t('justice.title')}</span>
          <div class="ind-bar-wrap"><div class="ind-bar" style="width:${rolPct}%;background:${rolColor}"></div></div>
          <span class="ind-label" style="color:${rolColor}">Avg. ${avgRuleOfLaw}</span>
          ${infoBtn('desc.rule_of_law')}
        </div>
        <div class="indicator-meter">
          <span class="ind-icon">\uD83D\uDCF0</span>
          <span class="ind-title">${I18n.t('press.title')}</span>
          <div class="ind-bar-wrap"><div class="ind-bar" style="width:${press.pct}%;background:${press.color}"></div></div>
          <span class="ind-label" style="color:${press.color}">Avg. #${avgPress}</span>
          ${infoBtn('desc.press_freedom')}
        </div>
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
    const nameList = names.length <= 4
      ? names.join(', ')
      : names.slice(0, 3).join(', ') + ` <span class="info-btn" data-countries="${names.join(', ').replace(/"/g, '&quot;')}" role="button" tabindex="0">i</span>`;
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
    { key: 'global.gdp_total', value: fmtT(totalGdp), icon: '\uD83C\uDF0D', desc: 'desc.global_gdp' },
    { key: 'global.avg_gdp_capita', value: fmtK(avgGdpCap), icon: '\uD83D\uDC64', desc: 'desc.global_gdp_capita' },
    { key: 'global.avg_inflation', value: `${avgInflation}%`, icon: '\uD83D\uDCC8', desc: 'desc.global_inflation' },
    { key: 'global.avg_unemployment', value: `${avgUnemployment}%`, icon: '\uD83D\uDCBC', desc: 'desc.global_unemployment' },
    { key: 'global.avg_debt', value: `${avgDebt}%`, icon: '\uD83C\uDFE6', desc: 'desc.global_debt' }
  ];

  container.innerHTML = `
    <h3 class="global-section-title">${I18n.t('global.econ_title')}</h3>
    <div class="econ-content">
      <div class="econ-headline">
        ${items.map(m => `
          <div class="econ-big-stat">
            <span class="econ-icon">${m.icon}</span>
            <span class="econ-big-num">${m.value} ${infoBtn(m.desc)}</span>
            <span class="econ-big-label">${I18n.t(m.key)}</span>
          </div>`).join('')}
      </div>
    </div>`;
}

function scoreColor(score) {
  if (score >= 80) return '#2E7D32';
  if (score >= 60) return '#66BB6A';
  if (score >= 40) return '#FFA726';
  if (score >= 20) return '#E53935';
  return '#B71C1C';
}

function renderTopCountries() {
  const container = document.getElementById('top-countries-tile');
  if (!container) return;

  const countries = Data.getAllCountries();
  const allEcon = countries.map(c => ({ country: c, econ: Data.getEconomics(c.id) })).filter(d => d.econ);
  if (!allEcon.length) { container.innerHTML = ''; return; }

  function fmtB(v) { return v >= 1000 ? `$${(v/1000).toFixed(1)}T` : `$${v.toFixed(0)}B`; }

  const totalGdp = allEcon.reduce((s, d) => s + d.econ.gdp, 0);
  const sorted = allEcon.sort((a, b) => b.econ.gdp - a.econ.gdp);
  const medals = ['🥇', '🥈', '🥉'];
  const podium = sorted.slice(0, 3).map((d, i) => `${medals[i]} ${I18n.getCountryName(d.country)}`).join('<br>');

  container.innerHTML = `
    <a href="prosperity.html" class="card overview-card" style="text-decoration:none;color:inherit;border-left:4px solid #009edb">
      <div class="card-icon">💰</div>
      <h3 class="card-title">${I18n.t('overview.top_countries')}</h3>
      <div class="card-podium">${podium}</div>
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

  const sorted = countries.map(c => ({ country: c, econ: Data.getEconomics(c.id) })).filter(d => d.econ)
    .sort((a, b) => (b.econ.exports_pct_gdp || 0) - (a.econ.exports_pct_gdp || 0));
  const medals = ['🥇', '🥈', '🥉'];
  const podium = sorted.slice(0, 3).map((d, i) => `${medals[i]} ${I18n.getCountryName(d.country)}`).join('<br>');

  container.innerHTML = `
    <a href="trade.html" class="card overview-card" style="text-decoration:none;color:inherit;border-left:4px solid #2E7D32">
      <div class="card-icon">🚢</div>
      <h3 class="card-title">${I18n.t('overview.top_trade')}</h3>
      <div class="card-podium">${podium}</div>
      <span class="card-link">${I18n.t('overview.view_all')} &rarr;</span>
    </a>`;
}

function renderPressFreedom() {
  const container = document.getElementById('press-freedom-tile');
  if (!container) return;

  const politics = Data.getAllPolitics();
  const entries = Object.entries(politics).filter(([, p]) => p.press_freedom_rank != null);
  if (!entries.length) { container.innerHTML = ''; return; }

  const sorted = entries.sort((a, b) => a[1].press_freedom_rank - b[1].press_freedom_rank);
  const medals = ['🥇', '🥈', '🥉'];
  const podium = sorted.slice(0, 3).map(([id], i) => {
    const c = Data.getCountry(id);
    return `${medals[i]} ${c ? I18n.getCountryName(c) : id}`;
  }).join('<br>');

  container.innerHTML = `
    <a href="press-freedom.html" class="card overview-card" style="text-decoration:none;color:inherit;border-left:4px solid #7B1FA2">
      <div class="card-icon">📰</div>
      <h3 class="card-title">${I18n.t('overview.top_press')}</h3>
      <div class="card-podium">${podium}</div>
      <span class="card-link">${I18n.t('overview.view_all')} &rarr;</span>
    </a>`;
}

function renderLifeSatisfaction() {
  const container = document.getElementById('life-satisfaction-tile');
  if (!container) return;

  const politics = Data.getAllPolitics();
  const entries = Object.entries(politics).filter(([, p]) => p.happiness_score != null);
  if (!entries.length) { container.innerHTML = ''; return; }

  const sorted = entries.sort((a, b) => b[1].happiness_score - a[1].happiness_score);
  const medals = ['🥇', '🥈', '🥉'];
  const podium = sorted.slice(0, 3).map(([id], i) => {
    const c = Data.getCountry(id);
    return `${medals[i]} ${c ? I18n.getCountryName(c) : id}`;
  }).join('<br>');

  container.innerHTML = `
    <a href="life-satisfaction.html" class="card overview-card" style="text-decoration:none;color:inherit;border-left:4px solid #FF8F00">
      <div class="card-icon">😊</div>
      <h3 class="card-title">${I18n.t('overview.top_satisfaction')}</h3>
      <div class="card-podium">${podium}</div>
      <span class="card-link">${I18n.t('overview.view_all')} &rarr;</span>
    </a>`;
}

function renderRuleOfLaw() {
  const container = document.getElementById('rule-of-law-tile');
  if (!container) return;

  const politics = Data.getAllPolitics();
  const entries = Object.entries(politics).filter(([, p]) => p.rule_of_law != null);
  if (!entries.length) { container.innerHTML = ''; return; }

  const sorted = entries.sort((a, b) => b[1].rule_of_law - a[1].rule_of_law);
  const medals = ['🥇', '🥈', '🥉'];
  const podium = sorted.slice(0, 3).map(([id], i) => {
    const c = Data.getCountry(id);
    return `${medals[i]} ${c ? I18n.getCountryName(c) : id}`;
  }).join('<br>');

  container.innerHTML = `
    <a href="rule-of-law.html" class="card overview-card" style="text-decoration:none;color:inherit;border-left:4px solid #1565C0">
      <div class="card-icon">⚖️</div>
      <h3 class="card-title">${I18n.t('overview.top_rule_of_law')}</h3>
      <div class="card-podium">${podium}</div>
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

  document.title = `${I18n.t('overview.top_countries')} - World Barometer`;

  container.innerHTML = `
    <a href="index.html#overview" class="back-link">&larr; ${I18n.t('ranking.back')}</a>
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
    const topExports = (e.top_exports || []).slice(0, 3).map(t => I18n.t(exportKey(t))).join(', ');
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

  document.title = `${I18n.t('trade.global_title')} - World Barometer`;

  container.innerHTML = `
    <a href="index.html#overview" class="back-link">&larr; ${I18n.t('ranking.back')}</a>
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

function renderPressFreedomPage() {
  const container = document.getElementById('press-freedom-content');
  if (!container) return;

  const countries = Data.getAllCountries();
  const politics = Data.getAllPolitics();
  const entries = Object.entries(politics).filter(([, p]) => p.press_freedom_rank != null);
  if (!entries.length) { container.innerHTML = ''; return; }

  const n = entries.length;
  const avgRank = Math.round(entries.reduce((s, [, p]) => s + p.press_freedom_rank, 0) / n);
  const bestRank = Math.min(...entries.map(([, p]) => p.press_freedom_rank));
  const avgDemocracy = (entries.reduce((s, [, p]) => s + p.democracy_score, 0) / n).toFixed(1);

  const statsHtml = [
    { icon: '📰', value: `${n}`, key: 'overview.countries_tracked' },
    { icon: '📊', value: `#${avgRank}`, key: 'overview.avg_rank' },
    { icon: '🏆', value: `#${bestRank}`, key: 'overview.best_rank' },
    { icon: '🗳️', value: `${avgDemocracy}/10`, key: 'pol.avg_democracy' }
  ].map(m => `
    <div class="trade-tile-stat">
      <span class="trade-tile-icon">${m.icon}</span>
      <span class="trade-tile-value">${m.value}</span>
      <span class="trade-tile-label">${I18n.t(m.key)}</span>
    </div>`).join('');

  const sorted = entries.sort((a, b) => a[1].press_freedom_rank - b[1].press_freedom_rank);

  const rows = sorted.map(([id, p], i) => {
    const c = Data.getCountry(id);
    const name = c ? I18n.getCountryName(c) : id;
    return `<tr>
      <td class="rank-num">${i + 1}</td>
      <td><a href="country.html?id=${id}">${name}</a></td>
      <td><strong>#${p.press_freedom_rank}</strong></td>
      <td>${p.democracy_score}/10</td>
      <td>${I18n.t('pol.regime.' + p.regime)}</td>
    </tr>`;
  }).join('');

  document.title = `${I18n.t('overview.top_press')} - World Barometer`;

  container.innerHTML = `
    <a href="index.html#overview" class="back-link">&larr; ${I18n.t('ranking.back')}</a>
    <h1>${I18n.t('overview.top_press')}</h1>
    <div class="trade-tile-stats" style="margin:1.5rem 0">${statsHtml}</div>
    <table class="ranking-table">
      <thead>
        <tr>
          <th>${I18n.t('overview.rank')}</th>
          <th>${I18n.t('overview.country')}</th>
          <th>${I18n.t('press.title')}</th>
          <th>${I18n.t('country.democracy')}</th>
          <th>${I18n.t('overview.regime_type')}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderLifeSatisfactionPage() {
  const container = document.getElementById('life-satisfaction-content');
  if (!container) return;

  const countries = Data.getAllCountries();
  const politics = Data.getAllPolitics();
  const entries = Object.entries(politics).filter(([, p]) => p.happiness_score != null);
  if (!entries.length) { container.innerHTML = ''; return; }

  const n = entries.length;
  const avgScore = (entries.reduce((s, [, p]) => s + p.happiness_score, 0) / n).toFixed(1);
  const bestScore = Math.max(...entries.map(([, p]) => p.happiness_score)).toFixed(1);

  function fmtK(v) { return v >= 1000 ? `$${(v/1000).toFixed(1)}K` : `$${v}`; }

  const statsHtml = [
    { icon: '😊', value: `${n}`, key: 'overview.countries_tracked' },
    { icon: '📊', value: `${avgScore}/10`, key: 'overview.avg_score' },
    { icon: '🏆', value: `${bestScore}/10`, key: 'overview.best_score' }
  ].map(m => `
    <div class="trade-tile-stat">
      <span class="trade-tile-icon">${m.icon}</span>
      <span class="trade-tile-value">${m.value}</span>
      <span class="trade-tile-label">${I18n.t(m.key)}</span>
    </div>`).join('');

  const sorted = entries.sort((a, b) => b[1].happiness_score - a[1].happiness_score);

  const rows = sorted.map(([id, p], i) => {
    const c = Data.getCountry(id);
    const name = c ? I18n.getCountryName(c) : id;
    const econ = Data.getEconomics(id);
    const gdpCap = econ ? fmtK(econ.gdp_per_capita) : '—';
    return `<tr>
      <td class="rank-num">${i + 1}</td>
      <td><a href="country.html?id=${id}">${name}</a></td>
      <td><strong>${p.happiness_score}/10</strong></td>
      <td>${gdpCap}</td>
      <td>${I18n.t('pol.regime.' + p.regime)}</td>
    </tr>`;
  }).join('');

  document.title = `${I18n.t('overview.top_satisfaction')} - World Barometer`;

  container.innerHTML = `
    <a href="index.html#overview" class="back-link">&larr; ${I18n.t('ranking.back')}</a>
    <h1>${I18n.t('overview.top_satisfaction')}</h1>
    <div class="trade-tile-stats" style="margin:1.5rem 0">${statsHtml}</div>
    <table class="ranking-table">
      <thead>
        <tr>
          <th>${I18n.t('overview.rank')}</th>
          <th>${I18n.t('overview.country')}</th>
          <th>${I18n.t('satisfaction.title')}</th>
          <th>${I18n.t('overview.gdp_capita')}</th>
          <th>${I18n.t('overview.regime_type')}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderRuleOfLawPage() {
  const container = document.getElementById('rule-of-law-content');
  if (!container) return;

  const countries = Data.getAllCountries();
  const politics = Data.getAllPolitics();
  const entries = Object.entries(politics).filter(([, p]) => p.rule_of_law != null);
  if (!entries.length) { container.innerHTML = ''; return; }

  const n = entries.length;
  const avgScore = (entries.reduce((s, [, p]) => s + p.rule_of_law, 0) / n).toFixed(2);
  const bestScore = Math.max(...entries.map(([, p]) => p.rule_of_law)).toFixed(2);
  const avgCorruption = Math.round(entries.reduce((s, [, p]) => s + p.corruption_rank, 0) / n);

  const statsHtml = [
    { icon: '⚖️', value: `${n}`, key: 'overview.countries_tracked' },
    { icon: '📊', value: avgScore, key: 'overview.avg_score' },
    { icon: '🏆', value: bestScore, key: 'overview.best_score' },
    { icon: '✨', value: `#${avgCorruption}`, key: 'pol.avg_corruption' }
  ].map(m => `
    <div class="trade-tile-stat">
      <span class="trade-tile-icon">${m.icon}</span>
      <span class="trade-tile-value">${m.value}</span>
      <span class="trade-tile-label">${I18n.t(m.key)}</span>
    </div>`).join('');

  const sorted = entries.sort((a, b) => b[1].rule_of_law - a[1].rule_of_law);

  const rows = sorted.map(([id, p], i) => {
    const c = Data.getCountry(id);
    const name = c ? I18n.getCountryName(c) : id;
    return `<tr>
      <td class="rank-num">${i + 1}</td>
      <td><a href="country.html?id=${id}">${name}</a></td>
      <td><strong>${p.rule_of_law.toFixed(2)}</strong></td>
      <td>#${p.corruption_rank}</td>
      <td>${p.democracy_score}/10</td>
    </tr>`;
  }).join('');

  document.title = `${I18n.t('overview.top_rule_of_law')} - World Barometer`;

  container.innerHTML = `
    <a href="index.html#overview" class="back-link">&larr; ${I18n.t('ranking.back')}</a>
    <h1>${I18n.t('overview.top_rule_of_law')}</h1>
    <div class="trade-tile-stats" style="margin:1.5rem 0">${statsHtml}</div>
    <table class="ranking-table">
      <thead>
        <tr>
          <th>${I18n.t('overview.rank')}</th>
          <th>${I18n.t('overview.country')}</th>
          <th>${I18n.t('justice.title')}</th>
          <th>${I18n.t('corruption.title')}</th>
          <th>${I18n.t('country.democracy')}</th>
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
      <a href="pillar.html?id=${p.id}" class="card pillar-card" style="text-decoration:none;color:inherit;border-left:4px solid ${scoreColor(avg)}">
        <div class="card-icon">${p.icon}</div>
        <h3 class="card-title">${I18n.t(p.name_key)}</h3>
        <p class="card-description">${I18n.t(p.desc_key)}</p>
        <div class="card-avg"><span class="avg-label">${I18n.t('pillars.global_avg')}:</span> <strong style="color:${scoreColor(avg)}">${avg}</strong>/100</div>
        <span class="card-link">${I18n.t('pillars.explore')} &rarr;</span>
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
        ${infoBtn(p.desc_key)}
      </div>`;
  }).join('');

  const name = I18n.getCountryName(country);
  document.title = `${name} - World Barometer`;

  const pol = Data.getPolitics(id);
  let govHtml = '';
  if (pol) {
    const regimeColors = { full_democracy: '#2E7D32', flawed_democracy: '#66BB6A', hybrid_regime: '#FFA726', authoritarian: '#E53935' };
    const statusIcons = { peace: '\uD83D\uDD4A\uFE0F', tension: '\u26A0\uFE0F', minor_conflict: '\uD83D\uDD36', major_conflict: '\uD83D\uDD34', war: '\uD83D\uDCA5' };
    const regimeColor = regimeColors[pol.regime] || 'var(--dark-blue)';

    // Life satisfaction meter
    let satHtml = '';
    if (pol.happiness_score != null) {
      const h = pol.happiness_score;
      let emoji, labelKey, satColor;
      if (h >= 7.0)      { emoji = '\uD83D\uDE0A'; labelKey = 'satisfaction.very_high'; satColor = '#2E7D32'; }
      else if (h >= 6.0)  { emoji = '\uD83D\uDE42'; labelKey = 'satisfaction.high'; satColor = '#66BB6A'; }
      else if (h >= 5.0)  { emoji = '\uD83D\uDE10'; labelKey = 'satisfaction.moderate'; satColor = '#FFA726'; }
      else if (h >= 4.0)  { emoji = '\uD83D\uDE1F'; labelKey = 'satisfaction.low'; satColor = '#E53935'; }
      else                 { emoji = '\uD83D\uDE1E'; labelKey = 'satisfaction.very_low'; satColor = '#B71C1C'; }
      const pct = Math.round((h / 8) * 100);
      satHtml = `
      <div class="satisfaction-meter">
        <span class="sat-emoji">${emoji}</span>
        <div class="sat-bar-wrap">
          <div class="sat-bar" style="width:${pct}%;background:${satColor}"></div>
        </div>
        <span class="sat-label" style="color:${satColor}">${I18n.t(labelKey)}</span>
        <span class="sat-score">${h}/10</span>
        ${infoBtn('desc.satisfaction')}
      </div>`;
    }

    // Corruption meter (rank out of ~180, lower = cleaner)
    let corruptionHtml = '';
    if (pol.corruption_rank != null) {
      const cr = pol.corruption_rank;
      let cEmoji, cKey, cColor;
      if (cr <= 20)       { cEmoji = '\u2728'; cKey = 'corruption.very_clean'; cColor = '#2E7D32'; }
      else if (cr <= 50)  { cEmoji = '\u2705'; cKey = 'corruption.clean'; cColor = '#66BB6A'; }
      else if (cr <= 100) { cEmoji = '\u26A0\uFE0F'; cKey = 'corruption.moderate'; cColor = '#FFA726'; }
      else if (cr <= 150) { cEmoji = '\uD83D\uDFE0'; cKey = 'corruption.corrupt'; cColor = '#E53935'; }
      else                { cEmoji = '\uD83D\uDD34'; cKey = 'corruption.very_corrupt'; cColor = '#B71C1C'; }
      const cPct = Math.max(5, Math.round((1 - cr / 180) * 100));
      corruptionHtml = `
      <div class="indicator-meter">
        <span class="ind-icon">${cEmoji}</span>
        <span class="ind-title">${I18n.t('corruption.title')}</span>
        <div class="ind-bar-wrap"><div class="ind-bar" style="width:${cPct}%;background:${cColor}"></div></div>
        <span class="ind-label" style="color:${cColor}">${I18n.t(cKey)}</span>
        <span class="ind-rank">#${cr}</span>
        ${infoBtn('desc.corruption')}
      </div>`;
    }

    // Rule of law meter (0-1 scale)
    let justiceHtml = '';
    if (pol.rule_of_law != null) {
      const rl = pol.rule_of_law;
      let jEmoji, jKey, jColor;
      if (rl >= 0.80)      { jEmoji = '\u2696\uFE0F'; jKey = 'justice.very_strong'; jColor = '#2E7D32'; }
      else if (rl >= 0.65) { jEmoji = '\u2696\uFE0F'; jKey = 'justice.strong'; jColor = '#66BB6A'; }
      else if (rl >= 0.50) { jEmoji = '\u2696\uFE0F'; jKey = 'justice.moderate'; jColor = '#FFA726'; }
      else if (rl >= 0.40) { jEmoji = '\u2696\uFE0F'; jKey = 'justice.weak'; jColor = '#E53935'; }
      else                  { jEmoji = '\u2696\uFE0F'; jKey = 'justice.very_weak'; jColor = '#B71C1C'; }
      const jPct = Math.round(rl * 100);
      justiceHtml = `
      <div class="indicator-meter">
        <span class="ind-icon">${jEmoji}</span>
        <span class="ind-title">${I18n.t('justice.title')}</span>
        <div class="ind-bar-wrap"><div class="ind-bar" style="width:${jPct}%;background:${jColor}"></div></div>
        <span class="ind-label" style="color:${jColor}">${I18n.t(jKey)}</span>
        <span class="ind-rank">${rl.toFixed(2)}</span>
        ${infoBtn('desc.rule_of_law')}
      </div>`;
    }

    // Press freedom meter (rank out of ~180, lower = freer)
    let pressHtml = '';
    if (pol.press_freedom_rank != null) {
      const pr = pol.press_freedom_rank;
      let pEmoji, pKey, pColor;
      if (pr <= 20)       { pEmoji = '\uD83D\uDCF0'; pKey = 'press.very_free'; pColor = '#2E7D32'; }
      else if (pr <= 50)  { pEmoji = '\uD83D\uDCF0'; pKey = 'press.free'; pColor = '#66BB6A'; }
      else if (pr <= 100) { pEmoji = '\uD83D\uDCF0'; pKey = 'press.moderate'; pColor = '#FFA726'; }
      else if (pr <= 150) { pEmoji = '\uD83D\uDCF0'; pKey = 'press.restricted'; pColor = '#E53935'; }
      else                { pEmoji = '\uD83D\uDCF0'; pKey = 'press.very_restricted'; pColor = '#B71C1C'; }
      const pPct = Math.max(5, Math.round((1 - pr / 180) * 100));
      pressHtml = `
      <div class="indicator-meter">
        <span class="ind-icon">${pEmoji}</span>
        <span class="ind-title">${I18n.t('press.title')}</span>
        <div class="ind-bar-wrap"><div class="ind-bar" style="width:${pPct}%;background:${pColor}"></div></div>
        <span class="ind-label" style="color:${pColor}">${I18n.t(pKey)}</span>
        <span class="ind-rank">#${pr}</span>
        ${infoBtn('desc.press_freedom')}
      </div>`;
    }

    govHtml = `
    <div class="country-section">
      <div class="country-gov-bar">
        <span class="gov-tag" style="border-color:${regimeColor};color:${regimeColor}">${I18n.t('pol.regime.' + pol.regime)}</span>
        <span class="gov-tag">${I18n.t('pol.system.' + pol.system)}</span>
        <span class="gov-tag">${I18n.t('country.democracy')}: ${pol.democracy_score}/10</span>
        <span class="gov-tag">${statusIcons[pol.conflict_status] || ''} ${I18n.t('peace.status.' + pol.conflict_status)}</span>
      </div>
      ${satHtml}
      <div class="indicator-meters">
        ${corruptionHtml}
        ${justiceHtml}
        ${pressHtml}
      </div>
    </div>`;
  }

  const summaryText = _buildCountrySummary(country, overall, rank, ranking.length);

  container.innerHTML = `
    <a href="index.html" class="back-link">&larr; ${I18n.t('country.back')}</a>
    <h1 class="country-name">${name}</h1>
    <div class="summary-box">${summaryText}</div>
    ${govHtml}
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
    <div id="demo-dashboard"></div>
    <div class="country-section">
      <h2 class="scores-heading">${I18n.t('country.pillar_scores')}</h2>
      <div class="score-bars">${pillarBars}</div>
    </div>
    <div id="econ-dashboard"></div>
    <div id="share-bar-country"></div>`;

  renderDemographicsSection(country);
  renderEconomicDashboard(country);

  // Share bar
  const shareEl = document.getElementById('share-bar-country');
  if (shareEl) {
    shareEl.innerHTML = _shareBarHtml();
    const countryUrl = 'https://world-bar.github.io/country.html?id=' + id;
    _bindShareButtons(shareEl,
      name + ' — ' + I18n.t('share.country_text'),
      countryUrl);
  }
}

// ── Demographics Dashboard ──

let _demoCharts = [];

function renderDemographicsSection(country) {
  const container = document.getElementById('demo-dashboard');
  if (!container) return;

  const demo = Data.getDemographics(country.id);
  if (!demo) { container.innerHTML = ''; return; }

  _demoCharts.forEach(c => c.destroy());
  _demoCharts = [];

  function fmtPop(v) {
    if (v >= 1e9) return (v / 1e9).toFixed(1) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
    return v.toString();
  }
  function fmtGrowth(v) {
    return (v >= 0 ? '+' : '') + v.toFixed(1) + '%';
  }
  const growthColor = demo.population_growth >= 0 ? '#2E7D32' : '#E53935';

  const metrics = [
    { key: 'demo.population', value: fmtPop(demo.population), desc: 'desc.population' },
    { key: 'demo.pop_growth', value: fmtGrowth(demo.population_growth), desc: 'desc.pop_growth', color: growthColor },
    { key: 'demo.median_age', value: demo.median_age + ' ' + I18n.t('demo.years'), desc: 'desc.median_age' },
    { key: 'demo.life_exp', value: demo.life_exp_total + ' ' + I18n.t('demo.years'), desc: 'desc.life_exp' },
    { key: 'demo.literacy', value: demo.literacy_rate + '%', desc: 'desc.literacy' },
    { key: 'demo.density', value: demo.population_density.toFixed(0) + '/km\u00B2', desc: 'desc.density' }
  ];

  const metricCards = metrics.map(m => `
    <div class="econ-metric">
      <div class="econ-metric-label">${I18n.t(m.key)}</div>
      <div class="econ-metric-value"${m.color ? ` style="color:${m.color}"` : ''}>${m.value} ${infoBtn(m.desc)}</div>
    </div>`).join('');

  const lifeExpLegend = `
    <div class="econ-legend">
      <div class="econ-legend-item"><span class="econ-legend-dot" style="background:#42A5F5"></span>${I18n.t('demo.male')}: ${demo.life_exp_male} ${I18n.t('demo.years')}</div>
      <div class="econ-legend-item"><span class="econ-legend-dot" style="background:#EC407A"></span>${I18n.t('demo.female')}: ${demo.life_exp_female} ${I18n.t('demo.years')}</div>
    </div>`;

  const extraMetrics = `
    <div class="econ-metrics demo-metrics-extra">
      <div class="econ-metric">
        <div class="econ-metric-label">${I18n.t('demo.fertility')}</div>
        <div class="econ-metric-value">${demo.fertility_rate.toFixed(2)} ${infoBtn('desc.fertility')}</div>
      </div>
      <div class="econ-metric">
        <div class="econ-metric-label">${I18n.t('demo.infant_mortality')}</div>
        <div class="econ-metric-value">${demo.infant_mortality.toFixed(1)} ${infoBtn('desc.infant_mortality')}</div>
      </div>
    </div>`;

  container.innerHTML = `
    <div class="country-section">
      <h2 class="scores-heading">${I18n.t('demo.title')}</h2>
      <div class="econ-metrics">${metricCards}</div>
      <div class="econ-charts">
        <div class="econ-chart-box">
          <h3>${I18n.t('demo.age_dist_title')}</h3>
          <canvas id="chart-age-dist"></canvas>
          <div class="econ-legend" id="legend-age-dist"></div>
        </div>
        <div class="econ-chart-box">
          <h3>${I18n.t('demo.urban_rural_title')}</h3>
          <canvas id="chart-urban-rural"></canvas>
          <div class="econ-legend" id="legend-urban-rural"></div>
        </div>
      </div>
      <div class="econ-charts demo-charts-bottom">
        <div class="econ-chart-box">
          <h3>${I18n.t('demo.life_exp_title')}</h3>
          <canvas id="chart-life-exp"></canvas>
          ${lifeExpLegend}
        </div>
      </div>
      ${extraMetrics}
    </div>`;

  // Charts
  if (typeof Chart !== 'undefined') {
    // Age Distribution doughnut
    const ageCtx = document.getElementById('chart-age-dist');
    if (ageCtx) {
      const ageColors = ['#42A5F5', '#1565C0', '#78909C'];
      const ageLabels = [I18n.t('demo.age_0_14'), I18n.t('demo.age_15_64'), I18n.t('demo.age_65_plus')];
      const ageData = [demo.age_0_14, demo.age_15_64, demo.age_65_plus];
      document.getElementById('legend-age-dist').innerHTML = ageLabels.map((label, i) =>
        `<div class="econ-legend-item"><span class="econ-legend-dot" style="background:${ageColors[i]}"></span>${label}: ${ageData[i]}%</div>`
      ).join('');
      _demoCharts.push(new Chart(ageCtx, {
        type: 'doughnut',
        data: { labels: ageLabels, datasets: [{ data: ageData, backgroundColor: ageColors, borderWidth: 2, borderColor: '#fff' }] },
        options: { responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed}%` } } } }
      }));
    }

    // Urban/Rural doughnut
    const urbanCtx = document.getElementById('chart-urban-rural');
    if (urbanCtx) {
      const urbanColors = ['#009edb', '#81C784'];
      const urbanLabels = [I18n.t('demo.urban'), I18n.t('demo.rural')];
      const urbanData = [demo.urban_pct, demo.rural_pct];
      document.getElementById('legend-urban-rural').innerHTML = urbanLabels.map((label, i) =>
        `<div class="econ-legend-item"><span class="econ-legend-dot" style="background:${urbanColors[i]}"></span>${label}: ${urbanData[i]}%</div>`
      ).join('');
      _demoCharts.push(new Chart(urbanCtx, {
        type: 'doughnut',
        data: { labels: urbanLabels, datasets: [{ data: urbanData, backgroundColor: urbanColors, borderWidth: 2, borderColor: '#fff' }] },
        options: { responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed}%` } } } }
      }));
    }

    // Life Expectancy horizontal bar
    const lifeCtx = document.getElementById('chart-life-exp');
    if (lifeCtx) {
      _demoCharts.push(new Chart(lifeCtx, {
        type: 'bar',
        data: {
          labels: [I18n.t('demo.male'), I18n.t('demo.female')],
          datasets: [{ data: [demo.life_exp_male, demo.life_exp_female], backgroundColor: ['#42A5F5', '#EC407A'], borderRadius: 4, barThickness: 36 }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.parsed.x} ${I18n.t('demo.years')}` } } },
          scales: { x: { min: 0, max: 100, ticks: { callback: v => v + ' ' + I18n.t('demo.yr_abbr') } }, y: { grid: { display: false } } }
        }
      }));
    }
  }
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
    { key: 'econ.gdp', value: fmtB(econ.gdp), desc: 'desc.gdp' },
    { key: 'econ.gdp_per_capita', value: fmtK(econ.gdp_per_capita), desc: 'desc.gdp_per_capita' },
    { key: 'econ.public_debt', value: `${econ.public_debt_pct}%`, desc: 'desc.public_debt' },
    { key: 'econ.unemployment', value: `${econ.unemployment}%`, desc: 'desc.unemployment' },
    { key: 'econ.inflation', value: `${econ.inflation}%`, desc: 'desc.inflation' },
    { key: 'econ.gni_per_capita', value: fmtK(econ.gni_per_capita), desc: 'desc.gni_per_capita' }
  ];

  const metricCards = metrics.map(m => `
    <div class="econ-metric">
      <div class="econ-metric-label">${I18n.t(m.key)}</div>
      <div class="econ-metric-value">${m.value} ${infoBtn(m.desc)}</div>
    </div>`).join('');

  const revKeys = ['taxes', 'social_contributions', 'grants', 'other'];
  const expKeys = ['social_protection', 'health', 'education', 'defense', 'infrastructure', 'public_services', 'debt_service', 'other'];

  const revLegend = revKeys.map((k, i) => {
    const colors = ['#2E7D32', '#4CAF50', '#81C784', '#C8E6C9'];
    return `<div class="econ-legend-item"><span class="econ-legend-dot" style="background:${colors[i]}"></span>${I18n.t('econ.rev.' + k)}: ${econ.revenue[k]}% ${infoBtn('desc.rev.' + k)}</div>`;
  }).join('');

  const expColors = ['#1565C0', '#42A5F5', '#7E57C2', '#EF5350', '#FF7043', '#FFA726', '#78909C', '#BDBDBD'];
  const expLegend = expKeys.map((k, i) =>
    `<div class="econ-legend-item"><span class="econ-legend-dot" style="background:${expColors[i]}"></span>${I18n.t('econ.exp.' + k)}: ${econ.expenditure[k]}% ${infoBtn('desc.exp.' + k)}</div>`
  ).join('');

  // Trade section
  let tradeHtml = '';
  if (econ.exports != null) {
    const balance = econ.trade_balance || (econ.exports - econ.imports);
    const balanceSign = balance >= 0 ? '+' : '';
    const balanceColor = balance >= 0 ? '#2E7D32' : '#E53935';
    const topExports = (econ.top_exports || []).map(t => `<span class="trade-tag">${exportIcon(t)} ${I18n.t(exportKey(t))}</span>`).join('');

    tradeHtml = `
    <div class="country-section">
      <h2 class="scores-heading">${I18n.t('trade.title')}</h2>
      <div class="econ-metrics econ-metrics-4">
        <div class="econ-metric">
          <div class="econ-metric-label">${I18n.t('trade.exports')}</div>
          <div class="econ-metric-value">${fmtB(econ.exports)} ${infoBtn('desc.trade_exports')}</div>
        </div>
        <div class="econ-metric">
          <div class="econ-metric-label">${I18n.t('trade.imports')}</div>
          <div class="econ-metric-value">${fmtB(econ.imports)} ${infoBtn('desc.trade_imports')}</div>
        </div>
        <div class="econ-metric">
          <div class="econ-metric-label">${I18n.t('trade.balance')}</div>
          <div class="econ-metric-value" style="color:${balanceColor}">${balanceSign}${fmtB(Math.abs(balance))} ${infoBtn('desc.trade_balance')}</div>
        </div>
        <div class="econ-metric">
          <div class="econ-metric-label">${I18n.t('trade.openness')}</div>
          <div class="econ-metric-value">${econ.exports_pct_gdp || '—'}% ${infoBtn('desc.trade_openness')}</div>
        </div>
      </div>
      ${topExports ? `<div class="trade-tags-section"><span class="trade-tags-label">${I18n.t('trade.top_exports')}:</span> ${topExports}</div>` : ''}
    </div>`;
  }

  container.innerHTML = `
    <div class="country-section">
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
  document.title = `${pillarName} - World Barometer`;

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
    <a href="index.html#pillars" class="back-link">&larr; ${I18n.t('ranking.back')}</a>
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

// ===== Quiz =====
let _quizState = null;
let _quizDifficulty = 'medium';

function renderQuiz() {
  const container = document.getElementById('quiz-content');
  if (!container) return;

  document.title = `${I18n.t('quiz.title')} - World Barometer`;

  // If quiz is in progress and we're just re-rendering for language change, re-render current state
  if (_quizState && _quizState.started) {
    if (_quizState.finished) {
      _renderQuizResults(container);
    } else {
      _renderQuizQuestion(container);
    }
    return;
  }

  // Start screen
  container.innerHTML = `
    <div class="quiz-container">
      <div class="quiz-start">
        <div class="quiz-start-icon">🌍</div>
        <h1>${I18n.t('quiz.title')}</h1>
        <p>${I18n.t('quiz.subtitle')}</p>
        <div class="quiz-difficulty">
          <p style="font-weight:600;margin-bottom:0.5rem;">${I18n.t('quiz.difficulty') || 'Choose difficulty'}</p>
          <div class="quiz-diff-buttons">
            <button class="quiz-diff-btn${_quizDifficulty === 'easy' ? ' active' : ''}" data-diff="easy">🌱 ${I18n.t('quiz.easy') || 'Easy'}</button>
            <button class="quiz-diff-btn${_quizDifficulty === 'medium' ? ' active' : ''}" data-diff="medium">🌿 ${I18n.t('quiz.medium') || 'Medium'}</button>
            <button class="quiz-diff-btn${_quizDifficulty === 'hard' ? ' active' : ''}" data-diff="hard">🌲 ${I18n.t('quiz.hard') || 'Hard'}</button>
          </div>
        </div>
        <button class="quiz-start-btn" id="quiz-start-btn">${I18n.t('quiz.start')}</button>
      </div>
    </div>`;

  container.querySelectorAll('.quiz-diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      _quizDifficulty = btn.dataset.diff;
      container.querySelectorAll('.quiz-diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('quiz-start-btn').addEventListener('click', () => {
    _quizState = {
      questions: _generateQuizQuestions(),
      currentIndex: 0,
      score: 0,
      started: true,
      finished: false,
      answered: false
    };
    _renderQuizQuestion(container);
  });
}

function _tpl(str, ...args) {
  return args.reduce((s, v, i) => s.replace(`{${i}}`, v), str);
}

function _shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function _pickRandom(arr, n) {
  return _shuffle(arr).slice(0, n);
}

function _generateQuizQuestions() {
  const countries = Data.getAllCountries();
  const politics = Data.getAllPolitics();
  const countryIds = countries.map(c => c.id).filter(id => politics[id]);

  // Tag each generator with a difficulty level:
  // easy: basic "which has highest/lowest" or "which is happier"
  // medium: mix of government systems, regime types, GDP comparisons
  // hard: tricky specifics like conflict status, corruption ranks, press freedom
  const generators = [
    { fn: _genHighestDemocracy,  diff: 'easy' },
    { fn: _genHigherGdp,        diff: 'easy' },
    { fn: _genHappierCountry,   diff: 'easy' },
    { fn: _genLowestDemocracy,  diff: 'medium' },
    { fn: _genRegimeType,       diff: 'medium' },
    { fn: _genGovSystem,        diff: 'medium' },
    { fn: _genLowestCorruption, diff: 'hard' },
    { fn: _genBestPress,        diff: 'hard' },
    { fn: _genConflictStatus,   diff: 'hard' }
  ];

  // Filter generators by difficulty
  let filtered;
  if (_quizDifficulty === 'easy') {
    filtered = generators.filter(g => g.diff === 'easy');
  } else if (_quizDifficulty === 'hard') {
    filtered = generators.filter(g => g.diff === 'hard');
  } else {
    filtered = generators; // medium = mix of all
  }

  const questions = [];
  const shuffledGens = _shuffle(filtered);

  // First pass: one of each type
  for (const gen of shuffledGens) {
    if (questions.length >= 10) break;
    const q = gen.fn(countries, politics, countryIds);
    if (q) questions.push(q);
  }

  // Fill remaining with random types (from filtered set first, then all)
  let attempts = 0;
  while (questions.length < 10 && attempts < 30) {
    const pool = filtered.length > 0 ? filtered : generators;
    const gen = pool[Math.floor(Math.random() * pool.length)];
    const q = gen.fn(countries, politics, countryIds);
    if (q) questions.push(q);
    attempts++;
  }

  // If still not enough, fill from all generators
  if (questions.length < 10) {
    const allGens = _shuffle(generators);
    let extraAttempts = 0;
    while (questions.length < 10 && extraAttempts < 20) {
      const gen = allGens[extraAttempts % allGens.length];
      const q = gen.fn(countries, politics, countryIds);
      if (q) questions.push(q);
      extraAttempts++;
    }
  }

  return _shuffle(questions.slice(0, 10));
}

function _genHighestDemocracy(countries, politics, ids) {
  const picked = _pickRandom(ids, 4);
  const scored = picked.map(id => ({ id, score: politics[id].democracy_score }));
  scored.sort((a, b) => b.score - a.score);
  const correct = scored[0];
  const country = Data.getCountry(correct.id);
  return {
    question: I18n.t('quiz.q.highest_democracy'),
    options: _shuffle(scored.map(s => ({
      text: I18n.getCountryName(Data.getCountry(s.id)),
      correct: s.id === correct.id
    }))),
    fact: `${I18n.getCountryName(country)}: ${correct.score}/10`
  };
}

function _genLowestDemocracy(countries, politics, ids) {
  const picked = _pickRandom(ids, 4);
  const scored = picked.map(id => ({ id, score: politics[id].democracy_score }));
  scored.sort((a, b) => a.score - b.score);
  const correct = scored[0];
  const country = Data.getCountry(correct.id);
  return {
    question: I18n.t('quiz.q.lowest_democracy'),
    options: _shuffle(scored.map(s => ({
      text: I18n.getCountryName(Data.getCountry(s.id)),
      correct: s.id === correct.id
    }))),
    fact: `${I18n.getCountryName(country)}: ${correct.score}/10`
  };
}

function _genGovSystem(countries, politics, ids) {
  const id = _pickRandom(ids, 1)[0];
  const pol = politics[id];
  const country = Data.getCountry(id);
  const correctSystem = pol.system;
  const allSystems = ['constitutional_monarchy', 'parliamentary_republic', 'presidential_republic', 'semi_presidential_republic', 'one_party_state', 'absolute_monarchy', 'federal_republic'];
  const others = _pickRandom(allSystems.filter(s => s !== correctSystem), 3);
  const options = _shuffle([correctSystem, ...others]).map(s => ({
    text: I18n.t('pol.system.' + s),
    correct: s === correctSystem
  }));
  return {
    question: _tpl(I18n.t('quiz.q.gov_system'), I18n.getCountryName(country)),
    options,
    fact: I18n.t('pol.system.' + correctSystem)
  };
}

function _genRegimeType(countries, politics, ids) {
  const regimes = ['full_democracy', 'flawed_democracy', 'hybrid_regime', 'authoritarian'];
  const regime = regimes[Math.floor(Math.random() * regimes.length)];
  const matching = ids.filter(id => politics[id].regime === regime);
  const nonMatching = ids.filter(id => politics[id].regime !== regime);
  if (matching.length < 1 || nonMatching.length < 3) return null;
  const correct = _pickRandom(matching, 1)[0];
  const wrongs = _pickRandom(nonMatching, 3);
  const options = _shuffle([correct, ...wrongs]).map(id => ({
    text: I18n.getCountryName(Data.getCountry(id)),
    correct: id === correct
  }));
  return {
    question: _tpl(I18n.t('quiz.q.is_regime'), I18n.t('pol.regime.' + regime)),
    options,
    fact: I18n.getCountryName(Data.getCountry(correct)) + ' — ' + I18n.t('pol.regime.' + regime)
  };
}

function _genHigherGdp(countries, politics, ids) {
  const withEcon = ids.filter(id => Data.getEconomics(id));
  if (withEcon.length < 4) return null;
  const picked = _pickRandom(withEcon, 4);
  const scored = picked.map(id => ({ id, gdp: Data.getEconomics(id).gdp_per_capita }));
  scored.sort((a, b) => b.gdp - a.gdp);
  const correct = scored[0];
  const country = Data.getCountry(correct.id);
  const fmtK = v => v >= 1000 ? `$${(v/1000).toFixed(1)}K` : `$${v}`;
  return {
    question: I18n.t('quiz.q.higher_gdp'),
    options: _shuffle(scored.map(s => ({
      text: I18n.getCountryName(Data.getCountry(s.id)),
      correct: s.id === correct.id
    }))),
    fact: `${I18n.getCountryName(country)}: ${fmtK(correct.gdp)}`
  };
}

function _genHappierCountry(countries, politics, ids) {
  const withHappiness = ids.filter(id => politics[id].happiness_score != null);
  if (withHappiness.length < 4) return null;
  const picked = _pickRandom(withHappiness, 4);
  const scored = picked.map(id => ({ id, score: politics[id].happiness_score }));
  scored.sort((a, b) => b.score - a.score);
  const correct = scored[0];
  const country = Data.getCountry(correct.id);
  return {
    question: I18n.t('quiz.q.happier'),
    options: _shuffle(scored.map(s => ({
      text: I18n.getCountryName(Data.getCountry(s.id)),
      correct: s.id === correct.id
    }))),
    fact: `${I18n.getCountryName(country)}: ${correct.score}/10`
  };
}

function _genLowestCorruption(countries, politics, ids) {
  const withCorruption = ids.filter(id => politics[id].corruption_rank != null);
  if (withCorruption.length < 4) return null;
  const picked = _pickRandom(withCorruption, 4);
  const scored = picked.map(id => ({ id, rank: politics[id].corruption_rank }));
  scored.sort((a, b) => a.rank - b.rank);
  const correct = scored[0];
  const country = Data.getCountry(correct.id);
  return {
    question: I18n.t('quiz.q.lowest_corruption'),
    options: _shuffle(scored.map(s => ({
      text: I18n.getCountryName(Data.getCountry(s.id)),
      correct: s.id === correct.id
    }))),
    fact: `${I18n.getCountryName(country)}: #${correct.rank}`
  };
}

function _genBestPress(countries, politics, ids) {
  const withPress = ids.filter(id => politics[id].press_freedom_rank != null);
  if (withPress.length < 4) return null;
  const picked = _pickRandom(withPress, 4);
  const scored = picked.map(id => ({ id, rank: politics[id].press_freedom_rank }));
  scored.sort((a, b) => a.rank - b.rank);
  const correct = scored[0];
  const country = Data.getCountry(correct.id);
  return {
    question: I18n.t('quiz.q.best_press'),
    options: _shuffle(scored.map(s => ({
      text: I18n.getCountryName(Data.getCountry(s.id)),
      correct: s.id === correct.id
    }))),
    fact: `${I18n.getCountryName(country)}: #${correct.rank}`
  };
}

function _genConflictStatus(countries, politics, ids) {
  const id = _pickRandom(ids, 1)[0];
  const pol = politics[id];
  const country = Data.getCountry(id);
  const correctStatus = pol.conflict_status;
  const allStatuses = ['peace', 'tension', 'minor_conflict', 'major_conflict', 'war'];
  const others = _pickRandom(allStatuses.filter(s => s !== correctStatus), 3);
  const options = _shuffle([correctStatus, ...others]).map(s => ({
    text: I18n.t('peace.status.' + s),
    correct: s === correctStatus
  }));
  return {
    question: _tpl(I18n.t('quiz.q.conflict_status'), I18n.getCountryName(country)),
    options,
    fact: I18n.t('peace.status.' + correctStatus)
  };
}

function _renderQuizQuestion(container) {
  const s = _quizState;
  const q = s.questions[s.currentIndex];
  const progress = ((s.currentIndex) / s.questions.length * 100).toFixed(0);

  container.innerHTML = `
    <div class="quiz-container">
      <div class="quiz-header">
        <span class="quiz-progress-text">${_tpl(I18n.t('quiz.question_of'), s.currentIndex + 1, s.questions.length)}</span>
        <span class="quiz-score-display">${_tpl(I18n.t('quiz.score'), s.score)}</span>
      </div>
      <div class="quiz-progress"><div class="quiz-progress-fill" style="width:${progress}%"></div></div>
      <div class="quiz-question">${q.question}</div>
      <div class="quiz-options">
        ${q.options.map((opt, i) => `<button class="quiz-option" data-idx="${i}">${opt.text}</button>`).join('')}
      </div>
      <div id="quiz-feedback-area"></div>
    </div>`;

  s.answered = false;

  container.querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (s.answered) return;
      s.answered = true;
      const idx = parseInt(btn.dataset.idx);
      const isCorrect = q.options[idx].correct;

      if (isCorrect) s.score++;

      // Highlight answers
      container.querySelectorAll('.quiz-option').forEach((b, i) => {
        b.classList.add('disabled');
        if (q.options[i].correct) b.classList.add('correct');
        if (i === idx && !isCorrect) b.classList.add('wrong');
      });

      // Show feedback
      const feedbackArea = document.getElementById('quiz-feedback-area');
      feedbackArea.innerHTML = `
        <div class="quiz-feedback ${isCorrect ? 'correct' : 'wrong'}">
          <strong>${isCorrect ? I18n.t('quiz.correct') : I18n.t('quiz.wrong')}</strong> ${q.fact}
        </div>
        <button class="quiz-next-btn" id="quiz-next-btn">${
          s.currentIndex < s.questions.length - 1 ? I18n.t('quiz.next') : I18n.t('quiz.results_title')
        }</button>`;

      document.getElementById('quiz-next-btn').addEventListener('click', () => {
        s.currentIndex++;
        if (s.currentIndex >= s.questions.length) {
          s.finished = true;
          _renderQuizResults(container);
        } else {
          _renderQuizQuestion(container);
        }
      });
    });
  });
}

function _renderQuizResults(container) {
  const s = _quizState;
  const score = s.score;
  const total = s.questions.length;

  let emoji, ratingKey;
  if (score === total)     { emoji = '🏆'; ratingKey = 'quiz.rating.expert'; }
  else if (score >= 7)     { emoji = '🌟'; ratingKey = 'quiz.rating.great'; }
  else if (score >= 4)     { emoji = '👍'; ratingKey = 'quiz.rating.good'; }
  else                     { emoji = '🌱'; ratingKey = 'quiz.rating.learning'; }

  container.innerHTML = `
    <div class="quiz-container">
      <div class="quiz-results">
        <h1>${I18n.t('quiz.results_title')}</h1>
        <div class="quiz-score-big">${score}/${total}</div>
        <div class="quiz-score-label">${I18n.t('quiz.your_score')}</div>
        <div class="quiz-rating">
          <span class="quiz-rating-emoji">${emoji}</span>
          ${I18n.t(ratingKey)}
        </div>
        <div class="quiz-actions">
          <button class="quiz-play-again" id="quiz-replay">${I18n.t('quiz.play_again')}</button>
        </div>
        <div class="quiz-share-section">
          <p class="quiz-share-label">${I18n.t('quiz.share')}</p>
          <div class="quiz-share-buttons">
            <button class="quiz-social-btn quiz-social-whatsapp" data-platform="whatsapp" title="WhatsApp">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </button>
            <button class="quiz-social-btn quiz-social-x" data-platform="x" title="X / Twitter">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </button>
            <button class="quiz-social-btn quiz-social-facebook" data-platform="facebook" title="Facebook">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </button>
            <button class="quiz-social-btn quiz-social-linkedin" data-platform="linkedin" title="LinkedIn">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </button>
            <button class="quiz-social-btn quiz-social-telegram" data-platform="telegram" title="Telegram">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
            </button>
            <button class="quiz-social-btn quiz-social-copy" data-platform="copy" title="Copy link">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>`;

  const shareText = _tpl(I18n.t('quiz.share_text'), score) + ' 🌍';
  const shareUrl = 'https://world-bar.github.io/quiz.html';
  const fullText = shareText + ' ' + shareUrl;

  document.getElementById('quiz-replay').addEventListener('click', () => {
    _quizState = null;
    renderQuiz();
  });

  container.querySelectorAll('.quiz-social-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const platform = btn.dataset.platform;
      const encoded = encodeURIComponent(shareText + ' ' + shareUrl);
      const encodedUrl = encodeURIComponent(shareUrl);
      const urls = {
        whatsapp: 'https://wa.me/?text=' + encoded,
        x: 'https://x.com/intent/tweet?text=' + encoded,
        facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl + '&quote=' + encodeURIComponent(shareText),
        linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodedUrl,
        telegram: 'https://t.me/share/url?url=' + encodedUrl + '&text=' + encodeURIComponent(shareText)
      };
      if (platform === 'copy') {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(fullText).then(() => {
            btn.classList.add('copied');
            setTimeout(() => btn.classList.remove('copied'), 2000);
          });
        }
      } else if (urls[platform]) {
        window.open(urls[platform], '_blank', 'width=600,height=400');
      }
    });
  });
}
