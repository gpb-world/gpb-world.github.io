/**
 * map.js - Leaflet map logic for Global Prosperity Barometer
 * Renders country markers from data layer, supports translated popups
 */
(async () => {
  await Data.init();
  await I18n.init();

  const map = L.map('map', {
    center: [20, 0],
    zoom: 2,
    minZoom: 2,
    maxZoom: 6,
    maxBounds: [[-90, -180], [90, 180]]
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map);

  let markers = [];

  function getColor(score) {
    if (score >= 80) return '#2e7d32';
    if (score >= 60) return '#8bc34a';
    if (score >= 40) return '#ffc107';
    if (score >= 20) return '#ff9800';
    return '#d32f2f';
  }

  function getScoreCategory(score) {
    if (score >= 80) return I18n.t('score.high');
    if (score >= 60) return I18n.t('score.above_avg');
    if (score >= 40) return I18n.t('score.average');
    if (score >= 20) return I18n.t('score.below_avg');
    return I18n.t('score.low');
  }

  function renderMarkers() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    const countries = Data.getAllCountries();
    countries.forEach(country => {
      const overall = Data.getOverallScore(country);
      const color = getColor(overall);
      const name = I18n.getCountryName(country);

      const circle = L.circleMarker(country.coords, {
        radius: 8,
        fillColor: color,
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(map);

      // Hover tooltip: country name + score
      circle.bindTooltip(`<strong>${name}</strong> — ${overall}/100`, {
        direction: 'top',
        offset: [0, -10],
        className: 'country-tooltip'
      });

      // Click: navigate to country page
      const isInIframe = window.parent !== window;
      circle.on('click', () => {
        const url = `country.html?id=${country.id}`;
        if (isInIframe) {
          window.open(url, '_blank');
        } else {
          window.location.href = url;
        }
      });

      markers.push(circle);
    });
  }

  renderMarkers();

  // Update legend text
  function updateLegend() {
    const el = (id) => document.getElementById(id);
    const set = (id, key) => { const e = el(id); if (e) e.textContent = I18n.t(key); };
    set('legend-title', 'map.legend.title');
    set('legend-high', 'map.legend.high');
    set('legend-above', 'map.legend.above_avg');
    set('legend-avg', 'map.legend.average');
    set('legend-below', 'map.legend.below_avg');
    set('legend-low', 'map.legend.low');
    set('info-title', 'map.title');
    set('info-interactive', 'map.interactive');
    set('info-click', 'map.click_details');
    set('info-date', 'map.data_date');
  }

  updateLegend();

  // Listen for language change from parent
  window.addEventListener('message', async (e) => {
    if (e.data && e.data.type === 'gpb-lang') {
      await I18n.setLang(e.data.lang);
      renderMarkers();
      updateLegend();
    }
  });

  // Also listen for direct language change (when map is standalone)
  document.addEventListener('gpb-lang-change', () => {
    renderMarkers();
    updateLegend();
  });
})();
