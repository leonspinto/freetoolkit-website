/**
 * Global Utilities and Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Navigation Toggle
    setupMobileNav();

    // 2. Setup Tool Search Filter
    setupToolSearch();
});

/**
 * Handles Mobile Menu interactions
 */
function setupMobileNav() {
    // Note: The navbar is injected dynamically, so we must delegate or wait for injection.
    // Since this script is deferred, injecting components happens first (synchronously in DOM).
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.getElementById('nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const isExpanded = navLinks.classList.contains('active');
            menuToggle.setAttribute('aria-expanded', isExpanded);
        });
    }
}

function setupToolSearch() {
    const searchInput = document.getElementById('toolSearch');
    const toolCards = document.querySelectorAll('.tool-card');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();

            toolCards.forEach(card => {
                const searchData = card.dataset.tool || '';
                const textData = card.innerText.toLowerCase();
                if (searchData.includes(query) || textData.includes(query)) {
                    card.style.display = ''; // Reset to default to maintain card layout
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Hide parent sections if all cards inside them are hidden
            const sections = document.querySelectorAll('section');
            sections.forEach(sec => {
                const grid = sec.querySelector('.tools-grid');
                if (grid) {
                    const cardsInGrid = grid.querySelectorAll('.tool-card');
                    if (cardsInGrid.length > 0) {
                        let hasVisibleCard = false;
                        cardsInGrid.forEach(c => {
                            if (c.style.display !== 'none') hasVisibleCard = true;
                        });
                        sec.style.display = hasVisibleCard ? '' : 'none';
                    }
                }
            });
            
            checkEmptyState(toolCards);
        });
    }
}

function checkEmptyState(cards) {
    let hasVisible = false;
    cards.forEach(c => {
        if (c.style.display !== 'none') hasVisible = true;
    });
    
    let noResults = document.getElementById('noResultsMsg');
    if (!hasVisible) {
        if (!noResults) {
            noResults = document.createElement('div');
            noResults.id = 'noResultsMsg';
            noResults.className = 'text-center mt-8 mb-8';
            noResults.style.color = 'var(--text-secondary)';
            
            // Generate a few random suggestions
            let suggestions = '';
            if (cards.length > 3) {
                const randomCards = Array.from(cards).sort(() => 0.5 - Math.random()).slice(0, 3);
                suggestions = randomCards.map(c => {
                    const title = c.querySelector('h3').innerText;
                    return `<span style="display:inline-block; margin: 0.5rem; padding: 0.3rem 0.8rem; background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 20px; font-size: 0.9rem;">${title}</span>`;
                }).join('');
            }

            noResults.innerHTML = `
                <p style="font-size: 1.1rem; margin-bottom: 1rem;">No tools found matching your search.</p>
                <p style="margin-bottom: 0.5rem;">Try searching for something else, or check out these tools:</p>
                <div>${suggestions}</div>
            `;
            
            const main = document.querySelector('main');
            if (main) main.appendChild(noResults);
        } else {
            noResults.style.display = 'block';
        }
    } else {
        if (noResults) noResults.style.display = 'none';
    }
}

/**
 * Analytics/Event Tracker
 * Call this function when a user successfully processes/downloads a tool result
 * @param {string} toolName - Name of the tool used
 */
window.trackToolUsage = function(toolName) {
    console.log(`Tool used: ${toolName}`);
    // Future integration point for GA / GTM:
    // if(typeof gtag === 'function') {
    //     gtag('event', 'tool_usage', { 'tool_name': toolName });
    // }
};

/**
 * File Validation Utility
 * @param {File} file - The file to check
 * @param {Array<string>} allowedTypes - Array of allowed mime types
 * @returns {boolean} true if valid
 */
window.validateFileType = function(file, allowedTypes) {
    if (!file || !allowedTypes) return false;
    
    if (!allowedTypes.includes(file.type)) {
        alert(`Invalid file type. Allowed types: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`);
        return false;
    }
    return true;
};

/**
 * UI Loader Controller
 */
window.toggleLoader = function(show, message = 'Processing...') {
    const loader = document.getElementById('global-loader');
    const loaderText = document.getElementById('loader-text');
    if (loader && loaderText) {
        loader.style.display = show ? 'block' : 'none';
        loaderText.innerText = message;
    }
};
