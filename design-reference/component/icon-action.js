class IconAction extends HTMLElement {
    connectedCallback() {
        this._injectStyles();
        this.render();
    }

    render() {
        const icon  = this.getAttribute('icon')  || '';
        const label = this.getAttribute('label') || '';
        const href  = this.getAttribute('href')  || '#';

        this.innerHTML = `
            <a href="${href}" class="icon-action-link">
                <i class="${icon}"></i>
                <span>${label}</span>
            </a>
        `;
    }

    _injectStyles() {
        if (document.getElementById('icon-action-styles')) return;
        const style = document.createElement('style');
        style.id = 'icon-action-styles';
        style.textContent = `
            icon-action {
                display: inline-flex;
            }
            .icon-action-link {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                text-decoration: none;
                cursor: pointer;
            }
            .icon-action-link i {
                width: 16px;
                height: 16px;
                font-size: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--text-primary, #0C0C11);
            }
            .icon-action-link span {
                font-size: var(--text-sm);
                color: var(--text-primary, #0C0C11);
            }
            .icon-action-link:hover i,
            .icon-action-link:hover span {
                opacity: 0.7;
            }
        `;
        document.head.appendChild(style);
    }
}

customElements.define('icon-action', IconAction);
