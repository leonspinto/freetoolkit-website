/**
 * Global Footer Component Injection
 */
document.addEventListener('DOMContentLoaded', () => {
    let basePath = './';
    const scripts = document.getElementsByTagName('script');
    for (let script of scripts) {
        const src = script.getAttribute('src');
        if (src && src.includes('footer.js')) {
            basePath = src.replace('js/components/footer.js', '');
            break;
        }
    }

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
                            <li><a href="${basePath}pdf-tools.html">PDF Tools</a></li>
                            <li><a href="${basePath}image-tools.html">Image Tools</a></li>
                            <li><a href="${basePath}design-tools.html">Design Tools</a></li>
                            <li><a href="${basePath}utility-tools.html">Utility Tools</a></li>
                        </ul>
                    </div>
                    
                    <div class="footer-col">
                        <h4>Company & Legal</h4>
                        <ul>
                            <li><a href="${basePath}pages/about.html">About Us</a></li>
                            <li><a href="${basePath}pages/contact.html">Contact</a></li>
                            <li><a href="${basePath}pages/privacy-policy.html">Privacy Policy</a></li>
                            <li><a href="${basePath}pages/terms.html">Terms of Service</a></li>
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
