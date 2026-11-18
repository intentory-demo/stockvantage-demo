class TabBar extends HTMLElement {
    connectedCallback() {
        // Defer so the HTML parser finishes adding children before we read them
        setTimeout(() => this.init(), 0);
    }

    init() {
        // Wrap children in the standard tab nav structure
        const buttons = [...this.children];
        const nav = document.createElement('div');
        nav.className = 'tab-navigation';
        buttons.forEach(btn => {
            btn.classList.add('tab-button');
            nav.appendChild(btn);
        });
        this.appendChild(nav);

        // Default first tab to active if none set
        if (!nav.querySelector('.tab-button.active')) {
            nav.querySelector('.tab-button')?.classList.add('active');
        }

        // Show panels matching current active tab, hide others
        const activeBtn = nav.querySelector('.tab-button.active');
        if (activeBtn) this.showPanel(activeBtn.dataset.tab);

        nav.querySelectorAll('.tab-button').forEach(btn => {
            btn.addEventListener('click', () => {
                nav.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.showPanel(btn.dataset.tab);
            });
        });
    }

    showPanel(tabName) {
        this.parentElement.querySelectorAll('[data-tab-panel]').forEach(panel => {
            panel.style.display = panel.dataset.tabPanel === tabName ? '' : 'none';
        });
    }
}

customElements.define('tab-bar', TabBar);
