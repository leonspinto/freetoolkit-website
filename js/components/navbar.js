/**
 * Global Navbar Component Injection
 */
document.addEventListener('DOMContentLoaded', () => {
    const navbarHTML = `
        <nav class="navbar" role="navigation" aria-label="main navigation">
            <div class="container nav-container">
                <a href="/" class="nav-logo">
                    FreeToolKit
                </a>
                
                <button id="mobile-menu" class="menu-toggle" aria-label="Toggle navigation" aria-expanded="false">
                    ☰
                </button>

                <div id="nav-links" class="nav-links">
                    <a href="/pdf-tools.html">PDF Tools</a>
                    <a href="/image-tools.html">Image Tools</a>
                    <a href="/design-tools.html">Design Tools</a>
                    <a href="/utility-tools.html">Utility Tools</a>
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
