/**
 * Global Navbar Component Injection
 */
document.addEventListener('DOMContentLoaded', () => {
    let basePath = './';
    const scripts = document.getElementsByTagName('script');
    for (let script of scripts) {
        const src = script.getAttribute('src');
        if (src && src.includes('navbar.js')) {
            basePath = src.replace('js/components/navbar.js', '');
            break;
        }
    }

    const navbarHTML = `
        <nav class="navbar" role="navigation" aria-label="main navigation">
            <div class="container nav-container">
                <a href="${basePath}" class="nav-logo">
                    FreeToolKit
                </a>
                
                <button id="mobile-menu" class="menu-toggle" aria-label="Toggle navigation" aria-expanded="false">
                    ☰
                </button>

                <div id="nav-links" class="nav-links">
                    <a href="${basePath}pdf-tools.html">PDF Tools</a>
                    <a href="${basePath}image-tools.html">Image Tools</a>
                    <a href="${basePath}design-tools.html">Design Tools</a>
                    <a href="${basePath}utility-tools.html">Utility Tools</a>
                </div>
            </div>
        </nav>
    `;

    // Inject into the placeholder
    const placeholder = document.getElementById('navbar-placeholder');
    if (placeholder) {
        placeholder.outerHTML = navbarHTML;
    }
});
