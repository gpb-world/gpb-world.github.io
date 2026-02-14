/**
 * country-selector.js - Searchable country dropdown for nav
 */
const CountrySelector = (() => {
  let _panel = null;
  let _btn = null;
  let _searchInput = null;
  let _list = null;

  function init() {
    const container = document.getElementById('country-selector');
    if (!container) return;

    container.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'country-selector-wrap';

    _btn = document.createElement('button');
    _btn.className = 'country-selector-btn';
    _btn.textContent = I18n.t('nav.countries');
    _btn.type = 'button';

    _panel = document.createElement('div');
    _panel.className = 'country-selector-panel';

    _searchInput = document.createElement('input');
    _searchInput.className = 'country-selector-search';
    _searchInput.type = 'text';
    _searchInput.setAttribute('data-i18n-placeholder', 'nav.country_search');
    _searchInput.placeholder = I18n.t('nav.country_search');

    _list = document.createElement('div');
    _list.className = 'country-selector-list';

    _panel.appendChild(_searchInput);
    _panel.appendChild(_list);
    wrap.appendChild(_btn);
    wrap.appendChild(_panel);
    container.appendChild(wrap);

    _btn.addEventListener('click', _toggle);
    _searchInput.addEventListener('input', _filter);
    document.addEventListener('click', _outsideClick);
    document.addEventListener('keydown', _onKey);
    document.addEventListener('gpb-lang-change', _rebuild);

    _renderList();
  }

  function _toggle(e) {
    e.stopPropagation();
    const isOpen = _panel.classList.contains('open');
    if (isOpen) {
      _close();
    } else {
      _panel.classList.add('open');
      _searchInput.value = '';
      _renderList();
      _searchInput.focus();
    }
  }

  function _close() {
    if (_panel) _panel.classList.remove('open');
  }

  function _outsideClick(e) {
    if (_panel && !_panel.contains(e.target) && e.target !== _btn) {
      _close();
    }
  }

  function _onKey(e) {
    if (e.key === 'Escape') _close();
  }

  function _filter() {
    const q = _searchInput.value.toLowerCase();
    const items = _list.querySelectorAll('a');
    items.forEach(a => {
      const name = a.getAttribute('data-name').toLowerCase();
      a.style.display = name.includes(q) ? '' : 'none';
    });
  }

  function _renderList() {
    if (!_list) return;
    const countries = Data.getAllCountries();
    const lang = I18n.getLang();

    const sorted = countries.map(c => ({
      id: c.id,
      name: I18n.getCountryName(c),
      score: Data.getOverallScore(c)
    })).sort((a, b) => a.name.localeCompare(b.name, lang));

    _list.innerHTML = sorted.map(c =>
      `<a href="country.html?id=${c.id}" data-name="${c.name}">
        <span>${c.name}</span>
        <span class="country-score-badge">${c.score}</span>
      </a>`
    ).join('');
  }

  function _rebuild() {
    if (_btn) _btn.textContent = I18n.t('nav.countries');
    if (_searchInput) _searchInput.placeholder = I18n.t('nav.country_search');
    _renderList();
  }

  return { init };
})();
