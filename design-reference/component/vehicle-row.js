class VehicleRow extends HTMLTableRowElement {
    connectedCallback() {
        this._render();
    }

    _render() {
        const row       = JSON.parse(this.getAttribute('data-row')     || '{}');
        const columns   = JSON.parse(this.getAttribute('data-columns') || '[]');
        const rowIndex  = this.getAttribute('data-row-index') || '0';
        const isActive  = this.hasAttribute('data-watchlist-active');

        this.innerHTML = `
            <td class="bulk-col"><div class="bulk-col-inner"><input type="checkbox" class="row-checkbox checkbox-input"></div></td>
            ${columns.map(c => `<td>${this._renderCell(c.key, row)}</td>`).join('')}
            <td>
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button class="btn btn-icon-sm" title="View report"><i class="fa-regular fa-file-lines"></i></button>
                    <button-icon-sm-switch
                        icon="fa-regular fa-bookmark"
                        title="${isActive ? 'Remove from watchlist' : 'Add to watchlist'}"
                        data-row-index="${rowIndex}"
                        ${isActive ? 'active' : ''}>
                    </button-icon-sm-switch>
                </div>
            </td>
        `;
    }

    _renderCell(key, row) {
        switch (key) {
            case 'vehicle':
                return `
                    <div style="padding-left: 4px;">
                        <div style="font-weight: 600; font-size: var(--text-md); color: var(--text-primary);">${row.vehicle.name}</div>
                        <div style="display: flex; align-items: center; gap: 6px; margin-top: 3px; font-size: var(--text-sm); color: var(--text-secondary);">
                            <span>${row.vehicle.mileage}ml</span>
                            <span>•</span>
                            <span>${row.vehicle.vin}</span>
                            <i class="fa-regular fa-copy" style="cursor: pointer; font-size: 11px;" title="Copy VIN"></i>
                        </div>
                    </div>`;

            case 'recommendation': {
                const recGroup = (() => {
                    const r = row.recommendation;
                    if (r === 'Great Buy' || r === 'Good Buy') return { label: 'Buy', cls: 'pill-green' };
                    if (r === 'Fair Buy' || r === 'Weak Buy' || r === 'Risky Buy') return { label: 'Consider', cls: 'pill-yellow' };
                    return { label: 'Pass', cls: 'pill-gray' };
                })();
                const pillClass = recGroup.cls;
                return `<span class="pill ${pillClass}">${recGroup.label}</span>`;
            }

            case 'imv':
                return `<span style="display: flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-circle-arrow-right" style="color: #F59E0B; font-size: 16px;"></i>
                    ${row.imv}
                </span>`;

            case 'profit': {
                const isPos = row.profit.startsWith('+');
                const isNeg = row.profit.startsWith('-');
                const color = isPos ? '#078A0B' : isNeg ? '#BD1A2E' : 'inherit';
                return `<span style="color: ${color}; font-weight: 600;">${row.profit}</span>`;
            }

            default:
                return row[key] !== undefined ? row[key] : '—';
        }
    }
}

customElements.define('vehicle-row', VehicleRow, { extends: 'tr' });
