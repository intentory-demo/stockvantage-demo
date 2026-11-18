const _PSI_ASSET_BASE = new URL('../img/', document.currentScript.src).href;

class PriceSliderImv extends HTMLElement {
  connectedCallback() {
    this._injectStyles();

    this._uid = Math.random().toString(36).slice(2, 7);
    this._miniChart = null;
    this._soldChart = null;
    this._cfg = {
      minPrice:       parseInt(this.getAttribute('min-price'))       || 15000,
      maxPrice:       parseInt(this.getAttribute('max-price'))       || 30000,
      defaultPrice:   parseInt(this.getAttribute('default-price'))   || 19800,
      wholesalePrice: this.getAttribute('wholesale-price') || '',
      mds:            this.getAttribute('mds') || '',
      presets:        JSON.parse(this.getAttribute('presets') || '[]'),
    };
    this._savedPrice   = this._cfg.defaultPrice;
    this._currentPrice = this._cfg.defaultPrice;
    this._isDragging   = false;

    this._render();
    this._bindEvents();
    this._updateSliderGradient();
    this._initMiniChart();
    this._initSoldChart();
    this._updateAll(this._cfg.defaultPrice);
  }

  disconnectedCallback() {
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup',   this._onMouseUp);
    this._destroyMiniChart();
    this._destroySoldChart();
  }

  // ── Styles ────────────────────────────────────────────────────────────────

  _injectStyles() {
    if (document.getElementById('price-slider-imv-styles')) return;
    const style = document.createElement('style');
    style.id = 'price-slider-imv-styles';
    style.textContent = `
      price-slider-imv { display: block; }

      /* Card */
      .ps-card {
        border: 1px solid #EBEDEF;
        border-radius: 16px;
        overflow: hidden;
        background: #fff;
        font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        color: #0d1722;
        font-size: 14px;
        line-height: 1.5;
      }

      /* Panel header */
      .ps-panel-header {
        height: 56px;
        border-bottom: 1px solid #d8dbde;
        padding: 0 20px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .ps-panel-title { font-size: 14px; font-weight: 600; color: #0c0c11; letter-spacing: 0.2px; }

      /* Inner */
      .ps-inner {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      /* Update button */
      .ps-update-btn.btn-primary-disabled { color: rgba(0,0,0,0.5); }

      /* Setup link */
      .ps-setup-link {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #0d1722;
        text-decoration: none;
        font-size: 14px;
        padding: 4px 0;
      }
      .ps-setup-icon { flex-shrink: 0; }
      .ps-setup-link > span { text-decoration: underline; }

      /* Slider area */
      .ps-slider-area {
        background: #f4f6f9;
        border-radius: 8px;
        padding: 20px 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .ps-top-row {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
      }

      /* Price + inline deal rating */
      .ps-price-display {
        font-size: 22px;
        font-weight: 600;
        color: #0d1722;
        line-height: 24px;
        letter-spacing: 0.2px;
      }
      .ps-deal-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 600;
        color: #0d1722;
        letter-spacing: 0.2px;
        white-space: nowrap;
      }
      .ps-deal-icon { width: 16px; height: 16px; display: block; flex-shrink: 0; }


      /* Bar wrap */
      .ps-bar-wrap { position: relative; padding-top: 40px; }

      /* IMV marker: label + line + downward caret pointing at the bar */
      .ps-imv-marker {
        position: absolute;
        top: 0;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: none;
      }
      .ps-imv-label {
        font-size: 12px;
        font-weight: 500;
        color: #0a0a0a;
        line-height: 18px;
        letter-spacing: 0.2px;
      }
      .ps-imv-line { width: 0; height: 13px; border-left: 1px solid #0d1722; }
      .ps-imv-caret {
        width: 0; height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid #0d1722;
      }

      /* Track */
      .ps-track { height: 10px; border-radius: 10px; position: relative; }

      /* Show table view link */
      .ps-table-link {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #0d1722;
        text-decoration: none;
        font-size: 12px;
        line-height: 18px;
        letter-spacing: 0.2px;
      }
      .ps-table-link-icon { width: 14px; font-size: 14px; color: #0d1722; flex-shrink: 0; }
      .ps-table-link > span { text-decoration: underline; }

      /* Price tick labels below track */
      .ps-price-ticks { position: relative; height: 34px; }
      .ps-price-tick {
        position: absolute;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .ps-tick-line { width: 0; height: 8px; border-left: 1px solid #d8dbde; display: block; margin-bottom: 2px; }
      .ps-tick-label {
        font-size: 12px; color: #5e6976;
        text-decoration: underline; white-space: nowrap;
        cursor: pointer; letter-spacing: 0.2px;
      }

      /* Note */
      .ps-note { font-size: 12px; color: #5e6976; line-height: 18px; letter-spacing: 0.2px; margin-bottom: 0; }

      .ps-charts-toggle {
        display: inline-flex;
        align-items: center;
        align-self: center;
        font-size: 12px;
        font-weight: 500;
        color: #0d1722;
        text-decoration: underline;
      }

      .ps-mini-charts {
        display: flex;
        gap: 16px;
        width: 100%;
        flex-wrap: nowrap;
      }

      .ps-mini-chart-wrap,
      .ps-line-chart-wrap {
        flex: 1 1 0;
        min-width: 0;
        height: 300px;
        background: #ffffff;
        border-radius: 8px;
      }

      .ps-mini-chart-wrap {
        padding: 12px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
      }

      .ps-mini-chart-wrap .ps-scatter-canvas,
      .ps-mini-chart-wrap .ps-sold-canvas,
      .ps-line-chart-wrap .ps-line-chart-canvas {
        width: 100% !important;
        flex: 1 1 0;
        min-height: 0;
        display: block;
      }

      /* Table */
      .ps-table { width: 100%; border-collapse: collapse; font-size: 14px; }
      .ps-thead-row th {
        padding: 8px 8px;
        font-size: 12px; font-weight: 500; color: #0d1722;
        text-align: right; letter-spacing: 0.2px;
      }
      .ps-th-label  { text-align: left; }
      .ps-th-price  { width: 110px; }
      .ps-th-change { width: 90px; }
      .ps-th-turn { width: 100px; }
      .ps-th-action { width: 80px; }
      .ps-table-row td { padding: 12px 8px; border-top: 1px solid #d8dbde; vertical-align: middle; }

      /* Label cell */
      .ps-td-label { padding-left: 8px; }
      .ps-label-cell { display: flex; align-items: center; gap: 8px; }
      .ps-row-abbr { font-size: 14px; font-weight: 600; color: #0d1722; flex-shrink: 0; }
      .ps-row-name { font-size: 14px; color: #0d1722; }

      /* Price cell */
      .ps-td-price { width: 110px; text-align: right; }
      .ps-price-cell { display: flex; align-items: center; justify-content: flex-end; gap: 5px; }
      .ps-price-val  { font-size: 14px; color: #0d1722; }

      /* Change cell */
      .ps-td-change { width: 90px; text-align: right; }
      .ps-change-tag {
        display: inline-flex; align-items: center; justify-content: center;
        padding: 3px 6px; border-radius: 4px;
        font-size: 12px; white-space: nowrap; letter-spacing: 0.2px;
        background: #0d1722; color: white;
      }

      /* Action cell */
      .ps-td-action { width: 80px; text-align: right; padding-right: 8px; }
      .ps-btn-action {
        display: inline-flex; align-items: center; justify-content: center;
        height: 28px; padding: 0 12px;
        border: 1px solid #d8dbde; border-radius: 20px;
        background: white; color: #0d1722;
        font-size: 12px; font-weight: 500; font-family: inherit;
        cursor: pointer; text-decoration: none; white-space: nowrap;
      }
      .ps-btn-action:hover { background: #f4f6f9; }

      /* Success toast */
      .ps-success {
        position: fixed; top: 2rem; right: 2rem;
        background: #10b981; color: white;
        padding: 1rem 1.5rem; border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        transform: translateX(400px);
        transition: transform 0.3s ease;
        pointer-events: none; z-index: 9999;
        font-family: 'DM Sans', sans-serif;
      }
      .ps-success.ps-show { transform: translateX(0); }
      .ps-success.ps-fade { opacity: 0; transition: opacity 0.5s ease; }
    `;
    document.head.appendChild(style);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  _render() {
    const { presets, defaultPrice, mds } = this._cfg;

    // Price tick markers below the track (all presets except current price)
    const zoneTickData = [
      { pct: 20, price: Math.round(this._fromPercent(20)) },
      { pct: 40, price: Math.round(this._fromPercent(40)) },
      { pct: 60, price: 27100 },
      { pct: 80, price: 28800 },
    ];
    const zoneTicks = zoneTickData.map(({ pct, price }) => `
      <div class="ps-price-tick" style="left:${pct}%">
        <span class="ps-tick-line"></span>
        <a href="#" class="ps-tick-label ps-preview-link" data-price="${price}">${this._fmt(price)}</a>
      </div>`).join('');

    const ticksHtml = presets.slice(1).map(p => {
      const pct = Math.max(0, Math.min(100, this._toPercent(p.price)));
      return `
      <div class="ps-price-tick" style="left:${pct}%">
        <span class="ps-tick-line"></span>
        <a href="#" class="ps-tick-label ps-preview-link" data-price="${p.price}">${this._fmt(p.price)}</a>
      </div>`;
    }).join('');

    // Table rows
    const rowsHtml = presets.map((p, i) => {
      const change = p.price - defaultPrice;
      const changeCell = change !== 0
        ? `<span class="pill ${change < 0 ? 'pill-green' : 'pill-dark'}">${change < 0 ? '-' : '+'}${this._fmt(Math.abs(change))}</span>`
        : '';
      const abbr   = i === 0 ? 'CP' : String(i + 1);
      const action = i === 0
        ? `<button class="ps-btn-action ps-btn-reset">Reset</button>`
        : `<a href="#" class="ps-btn-action ps-preview-link" data-price="${p.price}">Preview</a>`;
      return `
        <tr class="ps-table-row">
          <td class="ps-td-label">
            <div class="ps-label-cell">
              <span class="ps-row-abbr">${abbr}</span>
              <span class="ps-row-name">${p.label}</span>
            </div>
          </td>
          <td class="ps-td-price">
            <div class="ps-price-cell">
              <deal-rating rating="${p.rating}" no-text size="md"></deal-rating>
              <span class="ps-price-val${i === 0 ? ' ps-current-price-cell' : ''}">${this._fmt(p.price)}</span>
            </div>
          </td>
          <td class="ps-td-change">${changeCell}</td>
          <td class="ps-td-turn" style="text-align:right; color:#0d1722;">${p.turnTime || '—'}</td>
          <td class="ps-td-action">${action}</td>
        </tr>`;
    }).join('');

    this.innerHTML = `
      <div class="ps-inner">

        <div class="ps-slider-area">

          <div class="ps-top-row">
            <span class="ps-price-display">${this._fmt(defaultPrice)}</span>
            <span class="ps-deal-badge">${this._dealBadgeHtml(defaultPrice)}</span>
            <a href="#" class="ps-reset-link link" style="display:none;font-size:13px;white-space:nowrap;">Reset</a>
            <input type="hidden" class="ps-price-input" value="${this._fmt(defaultPrice)}">
            <button class="ps-update-btn" style="display:none;"></button>
          </div>

          <div class="ps-bar-wrap">
            <div class="ps-imv-marker" style="left:${this._toPercent(defaultPrice)}%">
              <span class="ps-imv-label">IMV</span>
              <div class="ps-imv-line"></div>
              <div class="ps-imv-caret"></div>
            </div>
            <div class="ps-track"></div>
            <div class="ps-price-ticks">${zoneTicks}</div>
          </div>

          <a href="#" class="ps-table-link">
            <i class="fa-solid fa-list ps-table-link-icon"></i>
            <span>Show table view</span>
          </a>

          <div class="ps-mini-charts" style="display:none;">
            <div style="flex:1;min-width:0;">
              <div class="ps-mini-chart-wrap">
                <p class="ps-note" style="margin:0 0 12px;font-weight:500;color:var(--text-primary);">Current market</p>
                <canvas class="ps-scatter-canvas" width="300" height="300"></canvas>
              </div>
            </div>
            <div style="flex:1;min-width:0;">
              <div class="ps-mini-chart-wrap">
                <p class="ps-note" style="margin:0 0 12px;font-weight:500;color:var(--text-primary);">Sold cars</p>
                <canvas class="ps-sold-canvas" width="300" height="300"></canvas>
              </div>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  // ── Events ────────────────────────────────────────────────────────────────

  _bindEvents() {
    const q  = sel => this.querySelector(sel);
    const qa = sel => this.querySelectorAll(sel);

    const priceInput = q('.ps-price-input');
    const track      = q('.ps-track');
    const handle     = q('.ps-handle');

    priceInput.addEventListener('input', () => {
      const p = this._parse(priceInput.value);
      if (p >= this._cfg.minPrice && p <= this._cfg.maxPrice) this._updateAll(p);
    });
    priceInput.addEventListener('focus', () => priceInput.select());
    priceInput.addEventListener('blur',  () => {
      priceInput.value = this._fmt(this._parse(priceInput.value));
    });

    // IMV marker is a static reference pointer (no draggable handle), but keep
    // drag/click wiring intact if a handle is ever rendered again.
    if (handle && track) {
      handle.addEventListener('mousedown', e => {
        this._isDragging = true;
        document.body.style.cursor = 'grabbing';
        this._moveFromEvent(e, track);
      });
      track.addEventListener('click', e => this._moveFromEvent(e, track));

      this._onMouseMove = e => { if (this._isDragging) this._moveFromEvent(e, track); };
      this._onMouseUp   = () => { this._isDragging = false; document.body.style.cursor = 'default'; };
      document.addEventListener('mousemove', this._onMouseMove);
      document.addEventListener('mouseup',   this._onMouseUp);
    }

    qa('.ps-preview-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        this._updateAll(parseInt(link.dataset.price));
      });
    });

    const resetBtn = q('.ps-btn-reset');
    if (resetBtn) resetBtn.addEventListener('click', () => this._updateAll(this._savedPrice));

    q('.ps-update-btn').addEventListener('click', () => this._handleUpdate());

    const menuBtn = q('.ps-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', e => {
        e.stopPropagation();
        const dd = q('.ps-menu-dropdown');
        dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
      });
      document.addEventListener('click', () => {
        const dd = this.querySelector('.ps-menu-dropdown');
        if (dd) dd.style.display = 'none';
      });
    }

    const resetLink = q('.ps-reset-link');
    if (resetLink) resetLink.addEventListener('click', e => { e.preventDefault(); this._updateAll(this._savedPrice); });

    const turnSelect = q('.ps-turn-select');
    if (turnSelect) {
      turnSelect.addEventListener('change', () => {
        const pctMap = { '14-21 days': 10, '18-28 days': 30, '22-35 days': 50, '35-50 days': 70, '50+ days': 90 };
        const pct = pctMap[turnSelect.value];
        if (pct !== undefined) this._updateAll(Math.round(this._fromPercent(pct)));
      });
    }

    const chartsToggle = q('.ps-charts-toggle');
    if (chartsToggle) {
      chartsToggle.addEventListener('click', e => {
        e.preventDefault();
        const charts = q('.ps-mini-charts');
        const toggle = q('.ps-charts-toggle');
        const isHidden = charts.style.display === 'none';
        charts.style.display = isHidden ? 'flex' : 'none';
        toggle.textContent = isHidden ? 'Hide more data' : 'Show more data';
      });
    }
  }

  // ── Core Logic ────────────────────────────────────────────────────────────

  _moveFromEvent(e, track) {
    const rect = track.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    this._updateAll(Math.round(this._fromPercent(pct)));
  }

  _updateAll(price) {
    this._currentPrice = price;
    const pct = this._toPercent(price);

    const priceInput = this.querySelector('.ps-price-input');
    if (priceInput) priceInput.value = this._fmt(price);
    const handle = this.querySelector('.ps-handle');
    if (handle) handle.style.left = pct + '%';

    const priceDisplay = this.querySelector('.ps-price-display');
    if (priceDisplay) priceDisplay.textContent = this._fmt(price);

    const dealBadge = this.querySelector('.ps-deal-badge');
    if (dealBadge) dealBadge.innerHTML = this._dealBadgeHtml(price);

    const resetLink = this.querySelector('.ps-reset-link');
    if (resetLink) resetLink.style.display = price !== this._savedPrice ? 'inline' : 'none';

    this._updateMiniChart(price);
    this._updateSoldChart(price);
    this.dispatchEvent(new CustomEvent('ps:pricechange', { detail: { price }, bubbles: true }));
  }

  _updateSliderGradient() {
    this.querySelector('.ps-track').style.background =
      `linear-gradient(to right,
        #078a0b 0%,  #078a0b 20%,
        #09ad0e 20%, #09ad0e 40%,
        #ffc651 40%, #ffc651 60%,
        #ff7f57 60%, #ff7f57 80%,
        #bd1a2e 80%, #bd1a2e 100%)`;
  }

  _positionMarkers() {}  // markers now rendered statically in HTML

  _destroyMiniChart() {
    if (this._miniChart) {
      this._miniChart.destroy();
      this._miniChart = null;
    }
  }

  _destroySoldChart() {
    if (this._soldChart) {
      this._soldChart.destroy();
      this._soldChart = null;
    }
  }

  _miniChartColor(rating) {
    return { great: '#078a0b', good: '#09ad0e', fair: '#ffc651', high: '#ff7f57', overpriced: '#bd1a2e' }[rating] || '#9ca3af';
  }

  _miniChartComparables() {
    const min = this._cfg.minPrice;
    const max = this._cfg.maxPrice;
    const range = Math.max(1, max - min);
    const points = [
      { mileage: 8400,  pricePct: 0.88, rating: 'high' },
      { mileage: 9200,  pricePct: 0.82, rating: 'high' },
      { mileage: 9800,  pricePct: 0.78, rating: 'high' },
      { mileage: 10200, pricePct: 0.85, rating: 'high' },
      { mileage: 10850, pricePct: 0.72, rating: 'fair' },
      { mileage: 11300, pricePct: 0.68, rating: 'fair' },
      { mileage: 11700, pricePct: 0.74, rating: 'fair' },
      { mileage: 12100, pricePct: 0.62, rating: 'good' },
      { mileage: 12600, pricePct: 0.55, rating: 'good' },
      { mileage: 13100, pricePct: 0.60, rating: 'good' },
      { mileage: 13400, pricePct: 0.48, rating: 'good' },
      { mileage: 14000, pricePct: 0.52, rating: 'fair' },
      { mileage: 14650, pricePct: 0.38, rating: 'great' },
      { mileage: 15300, pricePct: 0.42, rating: 'good' },
      { mileage: 15600, pricePct: 0.36, rating: 'good' },
      { mileage: 15900, pricePct: 0.30, rating: 'great' },
      { mileage: 16200, pricePct: 0.33, rating: 'good' },
      { mileage: 16600, pricePct: 0.35, rating: 'good' },
      { mileage: 16900, pricePct: 0.27, rating: 'great' },
      { mileage: 17150, pricePct: 0.22, rating: 'great' },
      { mileage: 17400, pricePct: 0.25, rating: 'great' },
      { mileage: 17900, pricePct: 0.18, rating: 'great' },
      { mileage: 18200, pricePct: 0.20, rating: 'great' },
      { mileage: 18400, pricePct: 0.12, rating: 'great' },
      { mileage: 18700, pricePct: 0.15, rating: 'great' },
      { mileage: 19100, pricePct: 0.08, rating: 'great' },
      { mileage: 19500, pricePct: 0.10, rating: 'great' },
      { mileage: 19800, pricePct: 0.06, rating: 'great' },
      { mileage: 15800, pricePct: 0.75, rating: 'high' },
      { mileage: 17300, pricePct: 0.68, rating: 'high' },
      { mileage: 18100, pricePct: 0.04, rating: 'great' },
      { mileage: 16500, pricePct: 0.72, rating: 'high' },
    ];

    return points.map(point => ({
      x: point.mileage,
      y: Math.round(min + (range * point.pricePct)),
      rating: point.rating,
    }));
  }

  _miniTrendline(points, xMin, xMax) {
    if (points.length < 2) return [];

    const n = points.length;
    const sumX = points.reduce((sum, point) => sum + point.x, 0);
    const sumY = points.reduce((sum, point) => sum + point.y, 0);
    const sumXY = points.reduce((sum, point) => sum + (point.x * point.y), 0);
    const sumX2 = points.reduce((sum, point) => sum + (point.x * point.x), 0);
    const denominator = (n * sumX2) - (sumX * sumX);
    if (!denominator) return [];

    const slope = ((n * sumXY) - (sumX * sumY)) / denominator;
    const intercept = (sumY - (slope * sumX)) / n;

    return [
      { x: xMin, y: intercept + (slope * xMin) },
      { x: xMax, y: intercept + (slope * xMax) },
    ];
  }

  _miniChartMetrics(comparables, currentMileage) {
    const allX = [...comparables.map(point => point.x), currentMileage];
    const xMin = Math.floor(Math.min(...allX, 8000) / 1000) * 1000;
    const xMax = Math.ceil(Math.max(...allX, 18000) / 1000) * 1000;
    const yMin = Math.floor(this._cfg.minPrice / 500) * 500;
    const yMax = Math.ceil(this._cfg.maxPrice / 500) * 500;

    return { xMin, xMax, yMin, yMax };
  }

  _trendChartLabels() {
    return ['1/03', '1/10', '1/17', '1/24', '1/31', '2/07', '2/14'];
  }

  _trendChartSeries() {
    const base = this._cfg.defaultPrice;
    const wholesaleBase = Math.round((this._cfg.minPrice - ((this._cfg.maxPrice - this._cfg.minPrice) * 0.06)) / 100) * 100;
    const actualStart = Math.round(base * 1.11);
    const actualMidOne = Math.round(base * 1.07);
    const actualMidTwo = Math.round(base * 1.03);
    const strategyStart = Math.round(base * 1.08);
    const strategyMidOne = Math.round(base * 1.05);
    const strategyMidTwo = Math.round(base * 1.01);

    return {
      actual: [
        actualStart,
        actualStart,
        actualStart,
        actualMidOne,
        actualMidOne,
        actualMidTwo,
        this._currentPrice,
      ],
      strategy: [
        strategyStart,
        strategyStart,
        strategyMidOne,
        strategyMidOne,
        strategyMidTwo,
        strategyMidTwo,
        Math.round(base * 0.98),
      ],
      wholesale: [
        wholesaleBase + 300,
        wholesaleBase + 300,
        wholesaleBase + 200,
        wholesaleBase + 100,
        wholesaleBase + 100,
        wholesaleBase,
        wholesaleBase,
      ],
    };
  }

  _trendChartBounds(series) {
    const values = [...series.actual, ...series.strategy, ...series.wholesale];
    const min = Math.floor(Math.min(...values) / 500) * 500;
    const max = Math.ceil(Math.max(...values) / 500) * 500;
    return { min, max };
  }

  _initMiniChart() {
    const canvas = this.querySelector('.ps-mini-chart-wrap .ps-scatter-canvas');
    if (!canvas || !window.Chart) return;

    const currentMileage = parseInt(this.getAttribute('current-mileage')) || 12450;
    const comparables = this._miniChartComparables();
    const metrics = this._miniChartMetrics(comparables, currentMileage);
    const trendline = this._miniTrendline(comparables, metrics.xMin, metrics.xMax);

    this._miniChart = new Chart(canvas, {
      type: 'scatter',
      data: {
        datasets: [
          {
            type: 'line',
            data: trendline,
            parsing: false,
            borderColor: 'rgba(156, 163, 175, 0.7)',
            borderWidth: 1.5,
            borderDash: [4, 3],
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            tension: 0,
            order: 1,
          },
          {
            type: 'scatter',
            data: comparables,
            parsing: false,
            pointRadius: 4,
            pointHoverRadius: 4,
            pointBackgroundColor: comparables.map(point => this._miniChartColor(point.rating)),
            pointBorderWidth: 0,
            order: 2,
          },
          {
            type: 'scatter',
            data: [{ x: currentMileage, y: this._currentPrice }],
            parsing: false,
            pointStyle: 'triangle',
            pointRotation: 0,
            pointRadius: 8,
            pointHoverRadius: 8,
            pointBackgroundColor: '#078a0b',
            pointBorderColor: '#0d1722',
            pointBorderWidth: 2,
            order: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        scales: {
          x: {
            type: 'linear',
            min: metrics.xMin,
            max: metrics.xMax,
            ticks: {
              maxTicksLimit: 4,
              color: '#5e6976',
              font: { family: 'DM Sans', size: 10 },
              callback: value => `${Math.round(value / 1000)}k`,
            },
            grid: { color: '#e8ebed' },
            border: { color: '#5e6976' },
          },
          y: {
            min: metrics.yMin,
            max: metrics.yMax,
            ticks: {
              maxTicksLimit: 5,
              color: '#5e6976',
              font: { family: 'DM Sans', size: 10 },
              callback: value => `$${Number(value).toLocaleString()}`,
            },
            grid: { color: '#e8ebed' },
            border: { color: '#5e6976' },
          },
        },
      },
    });

    this._miniChart.$currentMileage = currentMileage;
  }

  _initSoldChart() {
    const canvas = this.querySelector('.ps-sold-canvas');
    if (!canvas || !window.Chart) return;

    const currentMileage = parseInt(this.getAttribute('current-mileage')) || 12450;
    const min = this._cfg.minPrice;
    const max = this._cfg.maxPrice;
    const range = Math.max(1, max - min);

    // Sold cars — higher mileage = cheaper
    const soldPoints = [
      { mileage: 8600,  pricePct: 0.85, rating: 'high' },
      { mileage: 10200, pricePct: 0.86, rating: 'high' },
      { mileage: 11600, pricePct: 0.75, rating: 'fair' },
      { mileage: 12300, pricePct: 0.62, rating: 'good' },
      { mileage: 13800, pricePct: 0.65, rating: 'fair' },
      { mileage: 14500, pricePct: 0.48, rating: 'good' },
      { mileage: 15900, pricePct: 0.38, rating: 'great' },
      { mileage: 16700, pricePct: 0.32, rating: 'great' },
      { mileage: 17400, pricePct: 0.28, rating: 'great' },
      { mileage: 18900, pricePct: 0.14, rating: 'great' },
      { mileage: 19600, pricePct: 0.09, rating: 'great' },
    ].map(p => ({ x: p.mileage - 2000, y: Math.round(min + range * p.pricePct) - 2000, rating: p.rating }));

    const comparables = this._miniChartComparables();
    const metrics = this._miniChartMetrics(comparables, currentMileage);
    const trendline = this._miniTrendline(soldPoints, metrics.xMin, metrics.xMax);

    this._soldChart = new Chart(canvas, {
      type: 'scatter',
      data: {
        datasets: [
          {
            type: 'line',
            data: trendline,
            parsing: false,
            borderColor: 'rgba(156, 163, 175, 0.7)',
            borderWidth: 1.5,
            borderDash: [4, 3],
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            tension: 0,
            order: 1,
          },
          {
            type: 'scatter',
            data: soldPoints,
            parsing: false,
            pointRadius: 4,
            pointHoverRadius: 4,
            pointBackgroundColor: soldPoints.map(p => this._miniChartColor(p.rating)),
            pointBorderWidth: 0,
            order: 2,
          },
          {
            type: 'scatter',
            data: [{ x: currentMileage, y: this._currentPrice }],
            parsing: false,
            pointStyle: 'triangle',
            pointRotation: 0,
            pointRadius: 8,
            pointHoverRadius: 8,
            pointBackgroundColor: '#078a0b',
            pointBorderColor: '#0d1722',
            pointBorderWidth: 2,
            order: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        scales: {
          x: {
            type: 'linear',
            min: metrics.xMin,
            max: metrics.xMax,
            ticks: {
              maxTicksLimit: 4,
              color: '#5e6976',
              font: { family: 'DM Sans', size: 10 },
              callback: value => `${Math.round(value / 1000)}k`,
            },
            grid: { color: '#e8ebed' },
            border: { color: '#5e6976' },
          },
          y: {
            min: metrics.yMin,
            max: metrics.yMax,
            ticks: {
              maxTicksLimit: 5,
              color: '#5e6976',
              font: { family: 'DM Sans', size: 10 },
              callback: value => `$${Number(value).toLocaleString()}`,
            },
            grid: { color: '#e8ebed' },
            border: { color: '#5e6976' },
          },
        },
      },
    });

    this._soldChart.$currentMileage = currentMileage;
  }

  _updateMiniChart(price) {
    if (!this._miniChart) return;

    this._miniChart.data.datasets[2].data = [{
      x: this._miniChart.$currentMileage || 12450,
      y: price,
    }];
    this._miniChart.update('none');
  }

  _updateSoldChart(price) {
    if (!this._soldChart) return;
    this._soldChart.data.datasets[2].data = [{
      x: this._soldChart.$currentMileage || 12450,
      y: price,
    }];
    this._soldChart.update('none');
  }

  _handleUpdate() {
    if (this._currentPrice === this._savedPrice) return;
    this._savedPrice = this._currentPrice;
    const cell = this.querySelector('.ps-current-price-cell');
    if (cell) cell.textContent = this._fmt(this._savedPrice);
    const btn = this.querySelector('.ps-update-btn');
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-primary-disabled');
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  _fmt(price) { return '$' + Math.round(Math.abs(price)).toLocaleString('en-US'); }
  _parse(str) { return parseInt(String(str).replace(/[$,]/g, '')) || 0; }

  _toPercent(price) {
    return ((price - this._cfg.minPrice) / (this._cfg.maxPrice - this._cfg.minPrice)) * 100;
  }
  _fromPercent(pct) {
    return this._cfg.minPrice + (pct / 100) * (this._cfg.maxPrice - this._cfg.minPrice);
  }

  _dealRating(price) {
    const p = this._toPercent(price);
    if (p < 20) return { text: 'Great deal', cls: 'great'      };
    if (p < 40) return { text: 'Good deal',  cls: 'good'       };
    if (p < 60) return { text: 'Fair deal',  cls: 'fair'       };
    if (p < 80) return { text: 'High',       cls: 'high'       };
    return              { text: 'Overpriced', cls: 'overpriced' };
  }

  // Inline deal-rating badge (SVG icon + label), matching the codebase
  // .deal-rating pattern (img/deals/*.svg) used on price-vin.html.
  _dealBadge(price) {
    const p = this._toPercent(price);
    if (p < 20) return { key: 'great',       label: 'Great Deal' };
    if (p < 40) return { key: 'good',        label: 'Good Deal'  };
    if (p < 60) return { key: 'fair',        label: 'Fair Deal'  };
    if (p < 80) return { key: 'high',        label: 'High Priced' };
    return              { key: 'overpriced', label: 'Overpriced' };
  }

  _dealBadgeHtml(price) {
    const b = this._dealBadge(price);
    return `<img class="ps-deal-icon" src="${_PSI_ASSET_BASE}deals/${b.key}.svg" alt="${b.label}">${b.label}`;
  }

  _leadPotential(price) {
    const p = this._toPercent(price);
    if (p < 40) return '4+';
    if (p < 60) return '2-4';
    return '0 to 2';
  }

  _turnTime(price) {
    const p = this._toPercent(price);
    if (p < 20) return '14-21 days';
    if (p < 40) return '18-28 days';
    if (p < 60) return '22-35 days';
    if (p < 80) return '35-50 days';
    return '50+ days';
  }

  _dealRatingScore(price) {
    const p     = this._toPercent(price);
    const score = Math.max(1, Math.ceil(p / 100 * 12));
    return score + '/12';
  }
}

customElements.define('price-slider-imv', PriceSliderImv);
