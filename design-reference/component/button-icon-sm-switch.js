class ButtonIconSmSwitch extends HTMLElement {
    constructor() {
        super();
        this._active = false;
    }

    connectedCallback() {
        this._active = this.hasAttribute('active');
        this._render();
        this.addEventListener('click', () => this._toggle());
        this._injectStyles();
    }

    // Called on user click — updates state and fires event
    _toggle() {
        this._active = !this._active;
        this._update();
        this.dispatchEvent(new CustomEvent('bisw-toggle', {
            bubbles: true,
            detail: {
                active: this._active,
                rowIndex: parseInt(this.getAttribute('data-row-index') ?? -1),
            },
        }));
    }

    // Called programmatically — updates state without firing event
    setActive(val) {
        this._active = val;
        this._update();
    }

    _render() {
        const icon  = this.getAttribute('icon')  || 'fa-regular fa-bookmark';
        const title = this.getAttribute('title') || '';
        this.innerHTML = `
            <button class="bisw-btn${this._active ? ' active' : ''}" title="${title}">
                <i class="${icon}"></i>
            </button>
        `;
    }

    _update() {
        const btn = this.querySelector('.bisw-btn');
        if (btn) btn.classList.toggle('active', this._active);
    }

    _injectStyles() {
        if (document.getElementById('bisw-styles')) return;
        const style = document.createElement('style');
        style.id = 'bisw-styles';
        style.textContent = `
            button-icon-sm-switch {
                display: inline-flex;
            }
            .bisw-btn {
                padding: 0;
                border-radius: 50%;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1px solid #D8DBDE;
                background: white;
                cursor: pointer;
                transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
            }
            .bisw-btn:hover {
                background: var(--bg-hover);
            }
            .bisw-btn.active {
                border: var(--border-tertiary-1);
                background: var(--surface-blue);
                color: #0763D3;
            }
        `;
        document.head.appendChild(style);
    }
}

customElements.define('button-icon-sm-switch', ButtonIconSmSwitch);
