/**
 * data.js - Data loader and cache for Global Prosperity Barometer
 * Fetches and caches countries.json + pillars.json
 */
const Data = (() => {
  let _countries = null;
  let _pillars = null;
  let _economics = null;

  async function _load(url) {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to load ${url}: ${resp.status}`);
    return resp.json();
  }

  async function init() {
    if (!_countries || !_pillars) {
      const [countries, pillars, economics] = await Promise.all([
        _load('data/countries.json'),
        _load('data/pillars.json'),
        _load('data/economics.json')
      ]);
      _countries = countries;
      _pillars = pillars;
      _economics = economics;
    }
  }

  function getAllCountries() {
    return _countries || [];
  }

  function getCountry(id) {
    return (_countries || []).find(c => c.id === id) || null;
  }

  function getPillars() {
    return _pillars || [];
  }

  function getPillar(id) {
    return (_pillars || []).find(p => p.id === id) || null;
  }

  function getGlobalAverages() {
    const countries = getAllCountries();
    if (!countries.length) return {};
    const pillarIds = Object.keys(countries[0].scores);
    const avgs = {};
    pillarIds.forEach(pid => {
      const sum = countries.reduce((s, c) => s + (c.scores[pid] || 0), 0);
      avgs[pid] = Math.round(sum / countries.length);
    });
    return avgs;
  }

  function getOverallScore(country) {
    const scores = Object.values(country.scores);
    return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
  }

  function getRanking(pillarId) {
    const countries = getAllCountries();
    const ranked = countries.map(c => ({
      id: c.id,
      name: c.name,
      score: pillarId === 'overall' ? getOverallScore(c) : (c.scores[pillarId] || 0)
    }));
    ranked.sort((a, b) => b.score - a.score);
    return ranked;
  }

  function getScoreLabel(score) {
    if (score >= 80) return 'high';
    if (score >= 60) return 'above_avg';
    if (score >= 40) return 'average';
    if (score >= 20) return 'below_avg';
    return 'low';
  }

  function getEconomics(countryId) {
    return (_economics && _economics[countryId]) || null;
  }

  return { init, getAllCountries, getCountry, getPillars, getPillar, getGlobalAverages, getOverallScore, getRanking, getScoreLabel, getEconomics };
})();
