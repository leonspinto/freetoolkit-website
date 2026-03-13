/**
 * Global Footer Component Injection
 */
document.addEventListener('DOMContentLoaded', () => {
    const currentYear = new Date().getFullYear();
    
    const footerHTML = `
        <footer>
            <div class="container">
                <div class="footer-grid">
                    <div class="footer-col">
                        <h4 class="nav-logo" style="margin-bottom:0.5rem;">FreeToolKit</h4>
                        <p style="color:var(--text-secondary); font-size:0.9rem;">
                            100% free, fast, and secure browser-based tools. No uploads, no servers, full privacy.
                        </p>
                    </div>
                    
                    <div class="footer-col">
                        <h4>Tool Categories</h4>
                        <ul>
                            <li><a href="/pdf-tools.html">PDF Tools</a></li>
                            <li><a href="/image-tools.html">Image Tools</a></li>
                            <li><a href="/design-tools.html">Design Tools</a></li>
                            <li><a href="/utility-tools.html">Utility Tools</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-col">
                        <h4>Company & Legal</h4>
                        <ul>
                            <li><a href="/pages/about.html">About Us</a></li>
                            <li><a href="/pages/contact.html">Contact</a></li>
                            <li><a href="/pages/privacy-policy.html">Privacy Policy</a></li>
                            <li><a href="/pages/terms.html">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>
                
                <div class="footer-bottom">
                    <p>&copy; ${currentYear} FreeToolKit. All rights reserved.</p>
                </div>
            </div>
        </footer>
    `;

    // Inject into the placeholder
    const placeholder = document.getElementById('footer-placeholder');
    if (placeholder) {
        placeholder.outerHTML = footerHTML;
    }
});
