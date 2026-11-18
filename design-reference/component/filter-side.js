class FilterSide extends HTMLElement {
    connectedCallback() {
        this.classList.add('filter-panel');
        this._injectStyles();
        this._render();
    }

    _sections() {
        return [
            {
                key: 'make-model', label: 'Make and Model', type: 'make-model',
                makes: [
                    { label: 'Ford',          value: 'ford',       count: 25, models: [{ label:'F-150', count:7 },{ label:'Explorer', count:4 },{ label:'Escape', count:3 },{ label:'Mustang', count:3 },{ label:'Bronco', count:2 },{ label:'Ranger', count:2 },{ label:'Fusion', count:2 },{ label:'Edge', count:1 },{ label:'Focus', count:1 }] },
                    { label: 'Toyota',        value: 'toyota',     count: 20, models: [{ label:'Camry', count:4 },{ label:'RAV4', count:4 },{ label:'Corolla', count:3 },{ label:'Highlander', count:2 },{ label:'Tacoma', count:2 },{ label:'Prius', count:1 },{ label:'4Runner', count:1 },{ label:'Tundra', count:1 },{ label:'Sienna', count:1 },{ label:'Venza', count:1 }] },
                    { label: 'Chevrolet',     value: 'chevrolet',  count: 18, models: [{ label:'Silverado 1500', count:5 },{ label:'Equinox', count:3 },{ label:'Tahoe', count:2 },{ label:'Traverse', count:2 },{ label:'Suburban', count:1 },{ label:'Colorado', count:1 },{ label:'Blazer', count:1 },{ label:'Malibu', count:1 },{ label:'Silverado 2500', count:1 },{ label:'Trax', count:1 }] },
                    { label: 'Honda',         value: 'honda',      count: 15, models: [{ label:'CR-V', count:4 },{ label:'Accord', count:3 },{ label:'Civic', count:3 },{ label:'Pilot', count:2 },{ label:'Odyssey', count:1 },{ label:'Passport', count:1 },{ label:'HR-V', count:1 }] },
                    { label: 'Nissan',        value: 'nissan',     count: 12, models: [{ label:'Rogue', count:3 },{ label:'Altima', count:2 },{ label:'Pathfinder', count:2 },{ label:'Murano', count:1 },{ label:'Frontier', count:1 },{ label:'Sentra', count:1 },{ label:'Kicks', count:1 },{ label:'Maxima', count:1 }] },
                    { label: 'Jeep',          value: 'jeep',       count: 11, models: [{ label:'Wrangler', count:3 },{ label:'Grand Cherokee', count:3 },{ label:'Cherokee', count:2 },{ label:'Compass', count:1 },{ label:'Renegade', count:1 },{ label:'Gladiator', count:1 }] },
                    { label: 'BMW',           value: 'bmw',        count: 9,  models: [{ label:'X5', count:2 },{ label:'X3', count:2 },{ label:'3 Series', count:2 },{ label:'5 Series', count:1 },{ label:'X1', count:1 },{ label:'M3', count:1 }] },
                    { label: 'Mercedes-Benz', value: 'mercedes',   count: 8,  models: [{ label:'GLE', count:2 },{ label:'GLC', count:2 },{ label:'C-Class', count:2 },{ label:'E-Class', count:1 },{ label:'S-Class', count:1 }] },
                    { label: 'Dodge',         value: 'dodge',      count: 7,  models: [{ label:'Charger', count:2 },{ label:'Challenger', count:2 },{ label:'Durango', count:2 },{ label:'Grand Caravan', count:1 }] },
                    { label: 'Hyundai',       value: 'hyundai',    count: 7,  models: [{ label:'Tucson', count:2 },{ label:'Santa Fe', count:2 },{ label:'Elantra', count:1 },{ label:'Sonata', count:1 },{ label:'Kona', count:1 }] },
                    { label: 'Kia',           value: 'kia',        count: 6,  models: [{ label:'Sportage', count:2 },{ label:'Sorento', count:2 },{ label:'Telluride', count:1 },{ label:'Soul', count:1 }] },
                    { label: 'Subaru',        value: 'subaru',     count: 5,  models: [{ label:'Outback', count:2 },{ label:'Forester', count:1 },{ label:'Crosstrek', count:1 },{ label:'WRX', count:1 }] },
                    { label: 'Volkswagen',    value: 'volkswagen', count: 5,  models: [{ label:'Tiguan', count:2 },{ label:'Jetta', count:1 },{ label:'Atlas', count:1 },{ label:'Golf', count:1 }] },
                    { label: 'GMC',           value: 'gmc',        count: 4,  models: [{ label:'Sierra 1500', count:2 },{ label:'Yukon', count:1 },{ label:'Terrain', count:1 }] },
                    { label: 'Audi',          value: 'audi',       count: 4,  models: [{ label:'Q5', count:2 },{ label:'A4', count:1 },{ label:'Q7', count:1 }] },
                    { label: 'Ram',           value: 'ram',        count: 3,  models: [{ label:'1500', count:2 },{ label:'2500', count:1 }] },
                    { label: 'Lexus',         value: 'lexus',      count: 6,  models: [{ label:'RX', count:2 },{ label:'NX', count:2 },{ label:'ES', count:1 },{ label:'GX', count:1 }] },
                    { label: 'Mazda',         value: 'mazda',      count: 5,  models: [{ label:'CX-5', count:2 },{ label:'Mazda3', count:1 },{ label:'CX-9', count:1 },{ label:'CX-30', count:1 }] },
                    { label: 'Cadillac',      value: 'cadillac',   count: 4,  models: [{ label:'Escalade', count:2 },{ label:'XT5', count:1 },{ label:'CT5', count:1 }] },
                    { label: 'Lincoln',       value: 'lincoln',    count: 3,  models: [{ label:'Navigator', count:1 },{ label:'Corsair', count:1 },{ label:'Aviator', count:1 }] },
                    { label: 'Buick',         value: 'buick',      count: 3,  models: [{ label:'Enclave', count:1 },{ label:'Encore', count:1 },{ label:'Envision', count:1 }] },
                    { label: 'Volvo',         value: 'volvo',      count: 3,  models: [{ label:'XC90', count:1 },{ label:'XC60', count:1 },{ label:'S60', count:1 }] },
                    { label: 'Acura',         value: 'acura',      count: 3,  models: [{ label:'MDX', count:1 },{ label:'RDX', count:1 },{ label:'TLX', count:1 }] },
                    { label: 'Infiniti',      value: 'infiniti',   count: 2,  models: [{ label:'QX60', count:1 },{ label:'Q50', count:1 }] },
                    { label: 'Chrysler',      value: 'chrysler',   count: 2,  models: [{ label:'Pacifica', count:1 },{ label:'300', count:1 }] },
                    { label: 'Mitsubishi',    value: 'mitsubishi', count: 2,  models: [{ label:'Outlander', count:1 },{ label:'Eclipse Cross', count:1 }] },
                ],
            },
            {
                key: 'year', label: 'Year', type: 'year-range',
                fromDefault: 2000, toDefault: 2026, min: 1990, max: 2026,
            },
            {
                key: 'mileage', label: 'Mileage', type: 'range-slider',
                min: 0, max: 200000, step: 1000,
                fmt: v => v >= 1000 ? Math.round(v / 1000) + 'k mi' : v + ' mi',
            },
            {
                key: 'mds', label: 'MDS', type: 'range-slider',
                min: 0, max: 100, step: 1,
                fmt: v => v,
            },
            {
                key: 'imv', label: 'IMV', type: 'range-slider',
                min: 0, max: 100000, step: 500,
                fmt: v => '$' + (v >= 1000 ? Math.round(v / 1000) + 'k' : v),
            },
            {
                key: 'recommendation', label: 'Recommendation', type: 'checkbox-count',
                options: [
                    { label: 'Buy',      value: 'buy',      count: 0 },
                    { label: 'Consider', value: 'consider', count: 0 },
                    { label: 'Pass',     value: 'pass',     count: 0 },
                ],
            },
            {
                key: 'suggested-bid', label: 'Suggested Bid', type: 'range-slider',
                min: 0, max: 100000, step: 500,
                fmt: v => '$' + (v >= 1000 ? Math.round(v / 1000) + 'k' : v),
            },
            {
                key: 'condition-score', label: 'Condition Score', type: 'range-slider',
                min: 0, max: 5, step: 0.1,
                fmt: v => parseFloat(v).toFixed(1),
            },
            {
                key: 'auction', label: 'Auction', type: 'dropdown',
                options: [{ label: 'Any', value: '' }],
            },
            {
                key: 'location', label: 'Location', type: 'dropdown',
                options: [{ label: 'Any', value: '' }],
            },
            {
                key: 'auction-date', label: 'Auction Date', type: 'auction-date',
            },
            {
                key: 'source', label: 'Source', type: 'dropdown',
                options: [{ label: 'Any', value: '' }],
            },
        ];
    }

    _chevronSvg() {
        return `<svg class="accordion-icon expanded" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 6L8 10L12 6" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
    }

    _renderSection(s) {
        return `
            <div class="filter-section">
                <div class="accordion-header" data-section="${s.key}">
                    <span class="filter-label" style="margin-bottom:0">${s.label}</span>
                    ${this._chevronSvg()}
                </div>
                <div class="accordion-content expanded" data-content="${s.key}">
                    <div class="fs-section-body">
                        ${this._renderContent(s)}
                    </div>
                </div>
            </div>
        `;
    }

    _renderContent(s) {
        switch (s.type) {
            case 'make-model':
                return `<div class="checkbox-group">${s.makes.map(make => `
                    <div class="fs-make-item">
                        <div class="fs-make-header">
                            <label class="checkbox-container fs-check-row">
                                <input type="checkbox" class="checkbox-input fs-make-checkbox" value="${make.value}">
                                <span class="checkbox-label fs-check-label">${make.label}</span>
                                <span class="fs-count">${make.count}</span>
                            </label>
                        </div>
                        <div class="fs-models" hidden>
                            ${make.models.map(model => `
                                <div class="fs-model-item">
                                    <label class="checkbox-container fs-check-row fs-model-row">
                                        <input type="checkbox" class="checkbox-input fs-model-checkbox" value="${make.value}-${model.label.toLowerCase().replace(/\s+/g,'-')}">
                                        <span class="checkbox-label fs-check-label">${model.label}</span>
                                        <span class="fs-count">${model.count}</span>
                                    </label>
                                    <div class="fs-trim-wrapper" hidden>
                                        <div class="checkbox-group">
                                            ${['Base','Sport','Limited','Premium','Platinum'].map(trim => `
                                                <label class="checkbox-container fs-check-row fs-model-row">
                                                    <input type="checkbox" class="checkbox-input" value="${make.value}-${model.label.toLowerCase().replace(/\s+/g,'-')}-${trim.toLowerCase()}">
                                                    <span class="checkbox-label">${trim}</span>
                                                    <span class="fs-count"></span>
                                                </label>
                                            `).join('')}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}</div>`;

            case 'checkbox-count':
                return `<div class="checkbox-group">${s.options.map(o => `
                    <label class="checkbox-container fs-check-row">
                        <input type="checkbox" class="checkbox-input" value="${o.value}">
                        <span class="checkbox-label fs-check-label">${o.label}</span>
                        <span class="fs-count">${o.count}</span>
                    </label>`).join('')}</div>`;

            case 'dropdown':
                return `<select class="dropdown-select">
                    ${s.options.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
                </select>`;

            case 'year-range':
                return `<div class="range-inputs">
                    <select class="dropdown-select fs-flex-select">
                        ${this._yearOptions(s.min, s.max, s.fromDefault)}
                    </select>
                    <span class="range-separator">—</span>
                    <select class="dropdown-select fs-flex-select">
                        ${this._yearOptions(s.min, s.max, s.toDefault)}
                    </select>
                </div>`;

            case 'range-slider':
                return `<div class="slider-container">
                    <div class="slider-value-display">
                        <span class="fs-range-value">Any</span>
                    </div>
                    <div class="fs-dual-slider" data-min="${s.min}" data-max="${s.max}" data-step="${s.step || 1}">
                        <div class="fs-slider-track">
                            <div class="fs-slider-fill"></div>
                        </div>
                        <input type="range" class="fs-range-input fs-range-min" min="${s.min}" max="${s.max}" value="${s.min}" step="${s.step || 1}">
                        <input type="range" class="fs-range-input fs-range-max" min="${s.min}" max="${s.max}" value="${s.max}" step="${s.step || 1}">
                    </div>
                </div>`;

            case 'auction-date':
                return `
                    <div class="range-inputs" style="margin-bottom:10px">
                        <select class="dropdown-select fs-flex-select">
                            <option value="">From</option>
                            ${this._monthOptions()}
                        </select>
                        <span class="range-separator">—</span>
                        <select class="dropdown-select fs-flex-select">
                            <option value="">To</option>
                            ${this._monthOptions()}
                        </select>
                    </div>
                    <label class="checkbox-container">
                        <input type="checkbox" class="checkbox-input">
                        <span class="checkbox-label">Include listings with no auction date</span>
                    </label>`;

            default:
                return '';
        }
    }

    _yearOptions(min, max, selected) {
        let html = '';
        for (let y = max; y >= min; y--) {
            html += `<option value="${y}"${y === selected ? ' selected' : ''}>${y}</option>`;
        }
        return html;
    }

    _monthOptions() {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const year = new Date().getFullYear();
        return months.map((m, i) => {
            const val = `${year}-${String(i + 1).padStart(2, '0')}`;
            return `<option value="${val}">${m} ${year}</option>`;
        }).join('');
    }

    _render() {
        this.innerHTML = `
            <div class="fs-panel-header">
                <a class="reset-link" href="#">Reset filter</a>
            </div>
            ${this._sections().map(s => this._renderSection(s)).join('')}
        `;
        this._attachListeners();
    }

    _attachListeners() {
        // Accordion toggles
        this.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const key = header.dataset.section;
                const content = this.querySelector(`[data-content="${key}"]`);
                const icon = header.querySelector('.accordion-icon');
                content.classList.toggle('expanded');
                icon.classList.toggle('expanded');
            });
        });

        // Make checkbox → show/hide models
        this.querySelectorAll('.fs-make-checkbox').forEach(cb => {
            cb.addEventListener('change', () => {
                const models = cb.closest('.fs-make-item').querySelector('.fs-models');
                models.hidden = !cb.checked;
            });
        });

        // Model checkbox → show/hide trim dropdown
        this.querySelectorAll('.fs-model-checkbox').forEach(cb => {
            cb.addEventListener('change', () => {
                const trim = cb.closest('.fs-model-item').querySelector('.fs-trim-wrapper');
                trim.hidden = !cb.checked;
            });
        });

        // Dual range sliders
        this.querySelectorAll('.fs-dual-slider').forEach(slider => {
            const minInput = slider.querySelector('.fs-range-min');
            const maxInput = slider.querySelector('.fs-range-max');
            const fill = slider.querySelector('.fs-slider-fill');
            const container = slider.closest('.slider-container');
            const valueDisplay = container.querySelector('.fs-range-value');
            const dataMin = parseFloat(slider.dataset.min);
            const dataMax = parseFloat(slider.dataset.max);

            // Find the section config for formatting
            const sectionEl = slider.closest('.filter-section');
            const sectionKey = sectionEl.querySelector('.accordion-header').dataset.section;
            const sectionCfg = this._sections().find(s => s.key === sectionKey);
            const fmt = sectionCfg && sectionCfg.fmt ? sectionCfg.fmt : v => v;

            const updateFill = () => {
                const minVal = parseFloat(minInput.value);
                const maxVal = parseFloat(maxInput.value);
                const pctMin = ((minVal - dataMin) / (dataMax - dataMin)) * 100;
                const pctMax = ((maxVal - dataMin) / (dataMax - dataMin)) * 100;
                fill.style.left = pctMin + '%';
                fill.style.width = (pctMax - pctMin) + '%';
                if (minVal === dataMin && maxVal === dataMax) {
                    valueDisplay.textContent = 'Any';
                } else {
                    valueDisplay.textContent = fmt(minVal) + ' – ' + fmt(maxVal);
                }
            };

            minInput.addEventListener('input', () => {
                if (parseFloat(minInput.value) > parseFloat(maxInput.value)) {
                    minInput.value = maxInput.value;
                }
                updateFill();
            });

            maxInput.addEventListener('input', () => {
                if (parseFloat(maxInput.value) < parseFloat(minInput.value)) {
                    maxInput.value = minInput.value;
                }
                updateFill();
            });

            updateFill();
        });

        // Reset link
        const resetLink = this.querySelector('.reset-link');
        if (resetLink) {
            resetLink.addEventListener('click', e => {
                e.preventDefault();
                this.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
                this.querySelectorAll('select').forEach(sel => sel.selectedIndex = 0);
                this.querySelectorAll('.fs-range-min').forEach(inp => {
                    inp.value = inp.min;
                    inp.dispatchEvent(new Event('input'));
                });
                this.querySelectorAll('.fs-range-max').forEach(inp => {
                    inp.value = inp.max;
                    inp.dispatchEvent(new Event('input'));
                });
            });
        }
    }

    _injectStyles() {
        if (document.getElementById('filter-side-styles')) return;
        const style = document.createElement('style');
        style.id = 'filter-side-styles';
        style.textContent = `
            .fs-panel-header {
                display: flex;
                justify-content: flex-end;
                align-items: center;
                margin-bottom: 16px;
            }
            .fs-panel-title {
                font-size: var(--text-sm);
                font-weight: 600;
                color: #374151;
            }
            .fs-section-body {
                margin-top: 8px;
            }
            [data-content="make-model"] .fs-section-body {
                max-height: 480px;
                overflow-y: auto;
                padding-right: 8px;
            }
            .accordion-content.expanded {
                max-height: 2000px !important;
            }
            .fs-check-row {
                display: flex;
                align-items: center;
            }
            .fs-check-label {
                flex: 1;
            }
            .fs-count {
                font-size: var(--text-sm);
                color: #6B7280;
            }
            .fs-flex-select {
                flex: 1;
                min-width: 0;
            }
            /* Dual range slider */
            .fs-dual-slider {
                position: relative;
                height: 24px;
            }
            .fs-slider-track {
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                height: 4px;
                background: #E5E7EB;
                border-radius: 2px;
                transform: translateY(-50%);
            }
            .fs-slider-fill {
                position: absolute;
                top: 0;
                height: 100%;
                background: #0763D3;
                border-radius: 2px;
            }
            .fs-range-input {
                position: absolute;
                width: 100%;
                top: 50%;
                transform: translateY(-50%);
                -webkit-appearance: none;
                appearance: none;
                background: transparent;
                pointer-events: none;
                z-index: 2;
                margin: 0;
                padding: 0;
                border: none !important;
                box-shadow: none !important;
            }
            .fs-range-input::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #0763D3;
                border: none !important;
                pointer-events: auto;
                cursor: pointer;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }
            .fs-range-input::-moz-range-thumb {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #0763D3;
                border: none !important;
                pointer-events: auto;
                cursor: pointer;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                box-sizing: border-box;
            }
            .fs-range-value {
                font-size: var(--text-sm);
                color: #6B7280;
            }
            /* Make / model tree */
            .fs-make-item {
                display: flex;
                flex-direction: column;
            }
            .fs-make-header {
                display: flex;
                align-items: center;
            }
            .fs-make-header .fs-check-row {
                flex: 1;
            }
            .fs-models {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-top: 8px;
                margin-bottom: 4px;
            }
            .fs-models[hidden] {
                display: none !important;
            }
            .fs-model-row {
                padding-left: 20px;
            }
            .fs-model-item {
                display: flex;
                flex-direction: column;
            }
            .fs-trim-wrapper {
                padding-left: 20px;
                margin-top: 6px;
            }
            .fs-trim-wrapper[hidden] {
                display: none !important;
            }
        `;
        document.head.appendChild(style);
    }
}

customElements.define('filter-side', FilterSide);
