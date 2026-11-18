class PanelCalculator extends HTMLElement {
  connectedCallback() {
    this._injectStyles();
    this.innerHTML = this._template();
    this._bindEvents();
    this._calc();
  }

  // ── Constants ──────────────────────────────────────────────────────────────

  get CG_RETAIL()     { return parseFloat(this.getAttribute('cg-retail'))      || 30500; }
  get RECOM_MAX_BID() { return parseFloat(this.getAttribute('recom-max-bid'))  || 28000; }
  get TARGET_PROFIT() { return parseFloat(this.getAttribute('target-profit'))  || 290;  }

  // ── DOM helper ─────────────────────────────────────────────────────────────

  _$(id) { return this.querySelector('#' + id); }

  // ── Template ───────────────────────────────────────────────────────────────

  _template() {
    return `
      <div class="vc-calc-card">
      <!-- Header -->
      <div class="vc-panel-header">
        <span class="vc-ph-title">Bid Calculator</span>
        <button class="vc-ph-link">Adjust default values</button>
      </div>

      <!-- Body -->
      <div class="vc-card-body">

        <!-- Left: profit + max bid -->
        <div class="vc-right-section">
          <div class="vc-rs-group" style="width:160px;">
            <p class="vc-rs-label">Projected profit</p>
            <div class="vc-input-wrap" id="profit-input-box">
              <span class="vc-dollar">$</span>
              <input type="text" inputmode="numeric" id="profit-input" value="390" />
            </div>
            <p class="vc-sub-label" id="target-profit-label" style="display:flex;align-items:center;gap:5px;">
              <i id="profit-status-alert" class="fa-solid fa-triangle-exclamation" style="color:#B45309;font-size:11px;"></i>
              <i id="profit-status-check" class="fa-solid fa-circle-check vc-hidden" style="color:#16A34A;font-size:11px;"></i>
              <span>Default Target margin: ${this._fmt(this.TARGET_PROFIT)}</span>
            </p>
          </div>

          <div class="vc-rs-group" style="width:160px;margin-top:24px;">
            <p class="vc-rs-label">Max bid</p>
            <div class="vc-input-wrap" id="wholesale-input-box">
              <span class="vc-dollar">$</span>
              <input type="text" inputmode="numeric" id="wholesale" value="${this._fmtVal(this.RECOM_MAX_BID)}" />
            </div>
            <div style="display:flex;flex-direction:column;gap:2px;">
              <p class="vc-sub-label" id="cg-maxbid-label" style="color: var(--text-primary);">Recom. Max bid: ${this._fmt(this.RECOM_MAX_BID)}</p>
            </div>
            <span class="vc-mismatch-msg vc-hidden" id="appraised-mismatch-msg" style="margin-top:2px;">
              <i class="fa-solid fa-triangle-exclamation"></i> Needs to be updated
            </span>
            <a href="#" id="appraised-fix" class="vc-hidden vc-link" style="margin-top:2px;">Set max bid to $–</a>
          </div>
        </div>

        <!-- Right: editable rows -->
        <div class="vc-left-section">

          <!-- Retail row -->
          <div class="vc-field-row vc-has-sub" id="retail-row">
            <div class="vc-row-top">
              <span class="vc-field-label">Retail</span>
              <div class="vc-field-input-wrap">
                <div class="vc-field-input">
                  <span class="vc-fi-dollar">$</span>
                  <input type="text" inputmode="numeric" id="retail" value="${this._fmtVal(this.CG_RETAIL)}" />
                </div>
              </div>
            </div>
            <div style="display:flex;width:100%;">
              <span class="vc-sublabel" id="cg-retail-label" style="width:50%;">Predicted Retail: ${this._fmt(this.CG_RETAIL)}</span>
              <span class="vc-retail-warning vc-hidden" id="retail-row-warning" style="width:50%;justify-content:flex-end;">
                <i class="fa-solid fa-triangle-exclamation"></i> Above predicted retail
              </span>
              <span class="vc-mismatch-msg vc-hidden" id="retail-mismatch-msg" style="width:50%;justify-content:flex-end;">
                <i class="fa-solid fa-triangle-exclamation"></i> Needs to be updated
              </span>
            </div>
            <div style="display:flex;justify-content:flex-end;width:100%;">
              <a href="#" id="retail-fix" class="vc-hidden vc-link">Set retail to $–</a>
            </div>
          </div>

          <!-- Reconditioning row -->
          <div class="vc-field-row">
            <span class="vc-field-label">Reconditioning</span>
            <span class="vc-spacer"></span>
            <div class="vc-field-input">
              <span class="vc-fi-dollar">$</span>
              <input type="text" inputmode="numeric" id="fee-recon" value="600" />
            </div>
          </div>

          <!-- Certification row -->
          <div class="vc-field-row">
            <span class="vc-field-label">Certification</span>
            <span class="vc-spacer"></span>
            <div class="vc-field-input">
              <span class="vc-fi-dollar">$</span>
              <input type="text" inputmode="numeric" id="fee-certification" value="600" />
            </div>
          </div>

          <!-- Auction row -->
          <div class="vc-field-row">
            <span class="vc-field-label">Auction</span>
            <span class="vc-spacer"></span>
            <div class="vc-field-input">
              <span class="vc-fi-dollar">$</span>
              <input type="text" inputmode="numeric" id="fee-auction" value="300" />
            </div>
          </div>

          <!-- Transportation row -->
          <div class="vc-field-row">
            <span class="vc-field-label">Transportation</span>
            <span class="vc-spacer"></span>
            <div class="vc-field-input">
              <span class="vc-fi-dollar">$</span>
              <input type="text" inputmode="numeric" id="fee-transport" value="150" />
            </div>
          </div>

          <!-- Other row -->
          <div class="vc-field-row">
            <span class="vc-field-label">Other</span>
            <span class="vc-spacer"></span>
            <div class="vc-field-input">
              <span class="vc-fi-dollar">$</span>
              <input type="text" inputmode="numeric" id="fee-other" value="0" />
            </div>
          </div>

        </div>
      </div>
      </div>
    `;
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  _bindEvents() {
    const blurFmt = (id) => {
      this._$(id).addEventListener('blur', () => {
        const v = this._readVal(id);
        this._writeVal(id, v);
      });
    };
    this._$('retail').addEventListener('input', () => this._calc());
    this._$('wholesale').addEventListener('input', () => this._calc());
    blurFmt('retail');
    blurFmt('wholesale');
    ['recon', 'certification', 'auction', 'transport', 'other'].forEach(id => {
      this._$('fee-' + id).addEventListener('input', () => this._calc());
      blurFmt('fee-' + id);
    });
    this._$('profit-input').addEventListener('input', () => this._onProfitChange());
    blurFmt('profit-input');
    this._$('retail-fix').addEventListener('click', e => this._applyRetailFix(e));
    this._$('appraised-fix').addEventListener('click', e => this._applyAppraisedFix(e));
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  _fmt(n) {
    return '$' + Math.abs(Math.round(n)).toLocaleString();
  }

  _fmtVal(n) { return Math.round(n).toLocaleString(); }
  _readVal(id) { return parseFloat(String(this._$(id).value).replace(/,/g, '')) || 0; }
  _writeVal(id, n) { this._$(id).value = this._fmtVal(n); }

  _getFees() {
    return ['recon', 'certification', 'auction', 'transport', 'other'].reduce((sum, id) =>
      sum + this._readVal('fee-' + id), 0);
  }

  _flash(id) {
    const el = this._$(id);
    el.classList.remove('vc-flash');
    void el.offsetWidth;
    el.classList.add('vc-flash');
    el.addEventListener('animationend', () => el.classList.remove('vc-flash'), { once: true });
  }

  // ── State updates ──────────────────────────────────────────────────────────

  _updateRetailWarning(retail) {
    this._$('retail-row-warning').classList.toggle('vc-hidden', retail <= this.CG_RETAIL);
  }

  _updateProfitStatus(profit) {
    const met = profit >= this.TARGET_PROFIT;
    const negative = profit < 0;
    this._$('profit-status-alert').classList.toggle('vc-hidden', met);
    this._$('profit-status-check').classList.toggle('vc-hidden', !met);
    const label = this._$('target-profit-label');
    label.style.color      = met ? 'var(--text-primary)' : '#B91C1C';
    label.style.fontWeight = met ? '400' : '600';
    this._$('profit-input-box').classList.toggle('vc-negative', negative);
  }

  _clearMismatch() {
    this._$('retail-row').classList.remove('vc-row-mismatch');
    this._$('retail-mismatch-msg').classList.add('vc-hidden');
    this._$('appraised-mismatch-msg').classList.add('vc-hidden');
    this._$('retail-fix').classList.add('vc-hidden');
    this._$('appraised-fix').classList.add('vc-hidden');
  }

  // ── Core logic ─────────────────────────────────────────────────────────────

  _calc() {
    const retail    = this._readVal('retail');
    const wholesale = this._readVal('wholesale');
    const fees      = this._getFees();
    const profit    = retail - wholesale - fees;

    this._writeVal('profit-input', profit);
    this._flash('profit-input-box');

    this._updateRetailWarning(retail);

    this._updateProfitStatus(profit);
    this._clearMismatch();
  }

  _onProfitChange() {
    const retail  = this._readVal('retail');
    const fees    = this._getFees();
    const profit  = this._readVal('profit-input');

    this._writeVal('wholesale', retail - fees - profit);
    this._flash('wholesale-input-box');

    this._updateRetailWarning(retail);

    this._updateProfitStatus(profit);
  }

  _applyRetailFix(e) {
    e.preventDefault();
    const wholesale = this._readVal('wholesale');
    const fees      = this._getFees();
    const profit    = this._readVal('profit-input');
    this._writeVal('retail', profit + wholesale + fees);
    this._calc();
  }

  _applyAppraisedFix(e) {
    e.preventDefault();
    const retail = this._readVal('retail');
    const fees   = this._getFees();
    const profit = this._readVal('profit-input');
    this._writeVal('wholesale', retail - fees - profit);
    this._calc();
  }

  // ── Styles ─────────────────────────────────────────────────────────────────

  _injectStyles() {
    if (document.getElementById('panel-calculator-styles')) return;
    const style = document.createElement('style');
    style.id = 'panel-calculator-styles';
    style.textContent = `
      panel-calculator { display: block; }

      .vc-calc-card {
        background: white;
        border: 1px solid #D8DBDE;
        border-radius: 16px;
        overflow: hidden;
        position: relative;
      }

      /* Header */
      .vc-panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 56px;
        padding: 0 20px;
        border-bottom: 1px solid #D8DBDE;
      }
      .vc-ph-title {
        font-size: 14px;
        font-weight: 600;
        color: #0C0C11;
        letter-spacing: 0.2px;
        line-height: 18px;
      }
      .vc-ph-link {
        font-size: 14px;
        font-weight: 400;
        color: #0D1722;
        letter-spacing: 0.2px;
        line-height: 18px;
        text-decoration: underline;
        cursor: pointer;
        border: none;
        background: none;
        padding: 0;
        font-family: inherit;
      }
      .vc-ph-link:hover { opacity: 0.7; }

      /* Body */
      .vc-card-body {
        display: flex;
        gap: 16px;
      }

      /* Left section */
      .vc-left-section {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        padding: 20px;
      }
      .vc-field-row {
        display: flex;
        align-items: center;
        min-height: 48px;
        position: relative;
      }
      .vc-field-row + .vc-field-row { border-top: 1px solid #D8DBDE; }
      .vc-field-row.vc-has-sub {
        padding-top: 10px;
        padding-bottom: 10px;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
      }
      .vc-field-row.vc-has-sub .vc-row-top {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 8px;
      }
      .vc-field-row.vc-row-mismatch { background: #FFE2E2; }

      .vc-field-label {
        font-size: 14px;
        font-weight: 600;
        color: #0D1722;
        letter-spacing: 0.2px;
        line-height: 18px;
        flex: 1;
      }
      .vc-sublabel {
        font-size: 12px;
        font-weight: 400;
        color: #0D1722;
        letter-spacing: 0.2px;
        line-height: 18px;
        padding-left: 1px;
      }
      .vc-spacer { flex: 1; }

      /* Field input */
      .vc-field-input-wrap {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
        flex-shrink: 0;
      }
      .vc-field-input {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        border: 1px solid #D8DBDE;
        border-radius: 4px;
        height: 32px;
        background: white;
        width: 90px;
        padding: 4px 8px;
        gap: 0;
      }
      .vc-fi-dollar {
        font-size: 14px;
        color: #0D1722;
        line-height: 1;
        flex-shrink: 0;
      }
      .vc-field-input input {
        border: none;
        outline: none;
        font-size: 14px;
        font-weight: 400;
        color: #0D1722;
        letter-spacing: 0.2px;
        width: auto;
        min-width: 0;
        max-width: 58px;
        background: transparent;
        font-family: inherit;
        height: auto;
        padding: 0;
      }
      .vc-field-input input:focus { outline: none; }
      .vc-field-input input::-webkit-inner-spin-button,
      .vc-field-input input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

      /* Right section */
      .vc-right-section {
        width: 220px;
        display: flex;
        flex-direction: column;
        padding: 20px;
        background: #F4F6F9;
      }
      .vc-rs-group {
        display: flex;
        flex-direction: column;
      }
      .vc-rs-label {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
        letter-spacing: 0.2px;
        line-height: 18px;
        margin-bottom: 8px;
      }

      /* Profit / appraised input wrap */
      @keyframes vc-input-updated {
        0%   { box-shadow: 0 0 0 2px #3B82F6; background: #EFF6FF; }
        60%  { box-shadow: 0 0 0 2px #3B82F6; background: #EFF6FF; }
        100% { box-shadow: none; background: white; }
      }
      .vc-input-wrap {
        background: white;
        border: 1px solid #D8DBDE;
        border-radius: 4px;
        height: 44px;
        padding: 10px 13px;
        display: flex;
        align-items: center;
        gap: 2px;
        margin-bottom: 6px;
      }
      .vc-input-wrap.vc-flash { animation: vc-input-updated 1s ease-out forwards; }
      .vc-input-wrap.vc-negative { border-color: #B91C1C; }
      .vc-input-wrap.vc-negative .vc-dollar,
      .vc-input-wrap.vc-negative input { color: #B91C1C; }
      .vc-dollar {
        font-size: 16px;
        color: var(--text-primary);
        flex-shrink: 0;
      }
      .vc-input-wrap input {
        border: none;
        outline: none;
        background: transparent;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary);
        letter-spacing: 0.2px;
        font-family: inherit;
        width: 100%;
        height: auto;
        padding: 0;
      }
      .vc-input-wrap input::-webkit-inner-spin-button,
      .vc-input-wrap input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

      .vc-sub-label {
        font-size: 12px;
        font-weight: 400;
        color: var(--text-secondary);
        letter-spacing: 0.2px;
        line-height: 18px;
      }

      /* Inline warnings */
      .vc-retail-warning {
        font-size: 12px;
        font-weight: 500;
        color: #B45309;
        display: flex;
        align-items: center;
        gap: 4px;
        padding-left: 1px;
      }
      .vc-retail-warning i { font-size: 11px; }

      .vc-mismatch-msg {
        font-size: 12px;
        font-weight: 500;
        color: #B91C1C;
        display: flex;
        align-items: center;
        gap: 4px;
        padding-left: 1px;
      }
      .vc-mismatch-msg i { font-size: 11px; }

      .vc-link {
        font-size: var(--text-sm);
        color: var(--text-primary);
        white-space: nowrap;
      }

      .vc-hidden { display: none !important; }
    `;
    document.head.appendChild(style);
  }
}

customElements.define('panel-calculator', PanelCalculator);
