class PageHeader extends HTMLElement {
    connectedCallback() {
        setTimeout(() => this.init(), 0);
    }

    init() {
        const title = this.getAttribute('title') || '';
        const backHref = this.getAttribute('back-href');
        const actions = [...this.childNodes];

        const actionsWrapper = document.createElement('div');
        actionsWrapper.className = 'header-actions';
        actionsWrapper.style.cssText = 'display: flex; align-items: center; gap: 8px;';
        actions.forEach(node => actionsWrapper.appendChild(node));

        const backNav = backHref ? `
                <div class="back-navigation">
                    <a href="${backHref}">
                        <img src="../img/icon/Chevron-left.svg">
                        <span class="nav-text">Back</span>
                    </a>
                </div>` : '';

        this.innerHTML = `
            <div class="header">
                ${backNav}
                <div class="header-inner">
                    <div class="header-title-group">
                        <h1 class="header-title">${title}</h1>
                    </div>
                </div>
            </div>
        `;

        this.querySelector('.header-inner').appendChild(actionsWrapper);
    }
}

customElements.define('page-header', PageHeader);
