class EmptyState extends HTMLElement {
    connectedCallback() {
        this._injectStyles();
        this.render();
    }

    render() {
        const icon   = this.getAttribute('icon')   || 'design-reference/img/icon-marketing/car-search.svg';
        const text   = this.getAttribute('text')   || 'No items found';
        const action = this.getAttribute('action') || '';

        this.classList.add('empty-state');
        this.innerHTML = `
            <img class="empty-state-icon" src="${icon}" alt="" width="48" height="48">
            <p class="empty-state-text text-medium">${text}</p>
            ${action ? `<button class="btn btn-primary empty-state-btn">${action}</button>` : ''}
        `;

        if (action) {
            this.querySelector('.empty-state-btn').addEventListener('click', () => {
                this.dispatchEvent(new CustomEvent('empty-state-action', { bubbles: true }));
            });
        }
    }

    _injectStyles() {
        if (document.getElementById('empty-state-styles')) return;
        const style = document.createElement('style');
        style.id = 'empty-state-styles';
        style.textContent = `
            empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 12px;
                padding: 40px 24px;
            }
            .empty-state-icon {
                width: 48px;
                height: 48px;
            }
            .empty-state-text {
                font-size: var(--text-md);
                color: var(--text-primary, #0C0C11);
                margin: 0;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }
}

customElements.define('empty-state', EmptyState);
