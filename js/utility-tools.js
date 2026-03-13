/**
 * utility-tools.js
 * Logic for Cryptographic Password Generation and other Web Utilities.
 */

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    if (path.includes('password-generator')) {
        initPasswordGenerator();
    }
    
    if (path.includes('word-counter')) {
        initWordCounter();
    }
    
    if (path.includes('qr-generator')) {
        initQrGenerator();
    }
    
    if (path.includes('json-formatter')) {
        initJsonFormatter();
    }
    
    if (path.includes('color-palette')) {
        initColorPalette();
    }
});

function initPasswordGenerator() {
    const display = document.getElementById('passwordDisplay');
    const copyBtn = document.getElementById('copyBtn');
    const generateBtn = document.getElementById('generateBtn');
    
    const lengthInput = document.getElementById('lengthInput');
    const lengthValue = document.getElementById('lengthValue');
    
    const incUpper = document.getElementById('incUpper');
    const incLower = document.getElementById('incLower');
    const incNumbers = document.getElementById('incNumbers');
    const incSymbols = document.getElementById('incSymbols');

    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');

    // Charsets
    const upperSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowerSet = "abcdefghijklmnopqrstuvwxyz";
    const numSet = "0123456789";
    const symSet = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    // Reactivity
    lengthInput.addEventListener('input', (e) => {
        lengthValue.innerText = e.target.value;
        generate();
    });

    [incUpper, incLower, incNumbers, incSymbols].forEach(checkbox => {
        checkbox.addEventListener('change', generate);
    });

    generateBtn.addEventListener('click', generate);

    // Initial Gen
    generate();

    function generate() {
        let charset = "";
        if (incUpper.checked) charset += upperSet;
        if (incLower.checked) charset += lowerSet;
        if (incNumbers.checked) charset += numSet;
        if (incSymbols.checked) charset += symSet;

        if (charset === "") {
            display.innerText = "Select Character Types";
            display.style.fontSize = "1rem";
            updateStrengthIndicator(0);
            return;
        }

        const length = parseInt(lengthInput.value);
        let password = "";

        // Cryptographically secure RNG instead of Math.random
        const randomValues = new Uint32Array(length);
        window.crypto.getRandomValues(randomValues);

        for (let i = 0; i < length; i++) {
            password += charset[randomValues[i] % charset.length];
        }

        // Fix font size if extremely long
        if (length > 32) {
            display.style.fontSize = "1rem";
        } else if (length > 20) {
            display.style.fontSize = "1.2rem";
        } else {
            display.style.fontSize = "1.5rem";
        }

        display.innerText = password;
        display.classList.remove('copied'); // reset UI if they just copied
        calculateStrength(length, charset.length);
    }

    function calculateStrength(length, poolSize) {
        // Entropy Calculation: E = L * log2(R)
        // Where L is length, R is pool of possible characters
        const entropy = length * (Math.log(poolSize) / Math.log(2));
        
        let percentage = 0;
        let color = "var(--error-color)";
        let text = "Weak";

        if (entropy < 35) {
            percentage = 25;
            color = "var(--error-color)";
            text = "Weak (Crackable instantly)";
        } else if (entropy < 60) {
            percentage = 50;
            color = "#f59e0b"; // amber
            text = "Moderate (Crackable in days)";
        } else if (entropy < 90) {
            percentage = 75;
            color = "var(--success-color)";
            text = "Strong (Crackable in years)";
        } else {
            percentage = 100;
            color = "#8b5cf6"; // purple / extremely secure
            text = "Very Strong (Centuries to crack)";
        }

        updateStrengthIndicator(percentage, color, text);
    }

    function updateStrengthIndicator(percentage, color = "var(--border-color)", text = "") {
        strengthFill.style.width = `${percentage}%`;
        strengthFill.style.backgroundColor = color;
        if (text) {
            strengthText.innerText = text;
        }
    }

    // copy to clipboard logic
    copyBtn.addEventListener('click', async () => {
        const text = display.innerText;
        if (!text || text === "Select Character Types") return;

        try {
            await navigator.clipboard.writeText(text);
            display.classList.add('copied');
            
            // Analytics Trigger
            if (window.trackToolUsage) window.trackToolUsage('Password Generator');
            
            setTimeout(() => {
                display.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
                display.classList.add('copied');
                if (window.trackToolUsage) window.trackToolUsage('Password Generator');
            } catch (fallbackErr) {
                console.error('Fallback failed', fallbackErr);
            }
            document.body.removeChild(textArea);
        }
    });
}

function initWordCounter() {
    const textInput = document.getElementById('textInput');
    const wordCount = document.getElementById('wordCount');
    const charCount = document.getElementById('charCount');
    const sentenceCount = document.getElementById('sentenceCount');
    const paragraphCount = document.getElementById('paragraphCount');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');

    if (!textInput) return;

    textInput.addEventListener('input', analyzeText);

    clearBtn.addEventListener('click', () => {
        textInput.value = '';
        analyzeText();
    });

    copyBtn.addEventListener('click', async () => {
        if (!textInput.value) return;
        try {
            await navigator.clipboard.writeText(textInput.value);
            const originalText = copyBtn.innerText;
            copyBtn.innerText = 'Copied!';
            copyBtn.classList.add('success-state');
            
            if (window.trackToolUsage) window.trackToolUsage('Word Counter');
            
            setTimeout(() => {
                copyBtn.innerText = originalText;
                copyBtn.classList.remove('success-state');
            }, 2000);
        } catch (err) {
            console.error('Copy failed', err);
        }
    });

    function analyzeText() {
        const text = textInput.value;
        const textTrimmed = text.trim();

        if (textTrimmed === "") {
            wordCount.innerText = "0";
            charCount.innerText = "0";
            sentenceCount.innerText = "0";
            paragraphCount.innerText = "0";
            return;
        }

        // Characters
        charCount.innerText = text.length;

        // Words
        const words = textTrimmed.split(/\s+/);
        wordCount.innerText = words.length;

        // Sentences
        const sentences = textTrimmed.split(/[.!?]+/).filter(s => s.trim().length > 0);
        sentenceCount.innerText = sentences.length;

        // Paragraphs
        const paragraphs = textTrimmed.split(/\n+/).filter(p => p.trim().length > 0);
        paragraphCount.innerText = paragraphs.length;
    }
}

function initQrGenerator() {
    const qrInput = document.getElementById('qrInput');
    const qrSize = document.getElementById('qrSize');
    const generateQrBtn = document.getElementById('generateQrBtn');
    const qrCanvasContainer = document.getElementById('qrCanvasContainer');
    const downloadQrBtn = document.getElementById('downloadQrBtn');

    if (!qrInput || typeof QRCode === 'undefined') return;

    generateQrBtn.addEventListener('click', () => {
        const text = qrInput.value.trim();
        if (!text) {
            alert('Please enter some text or a URL to generate a QR code.');
            return;
        }

        const size = parseInt(qrSize.value);

        // Clear existing
        qrCanvasContainer.innerHTML = '';

        // Generate new
        new QRCode(qrCanvasContainer, {
            text: text,
            width: size,
            height: size,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });

        downloadQrBtn.style.display = 'block';
        
        if (window.trackToolUsage) window.trackToolUsage('QR Generator');
    });

    downloadQrBtn.addEventListener('click', () => {
        const canvas = qrCanvasContainer.querySelector('canvas');
        if (!canvas) return;

        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.download = 'freetoolkit-qrcode.png';
        link.href = dataUrl;
        link.click();
    });
}

function initJsonFormatter() {
    const jsonInput = document.getElementById('jsonInput');
    const jsonOutput = document.getElementById('jsonOutput');
    const formatBtn = document.getElementById('formatBtn');
    const minifyBtn = document.getElementById('minifyBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const validationStatus = document.getElementById('validationStatus');

    if (!jsonInput) return;

    // Format logic automatically triggers on paste or typing delay
    let timeout = null;
    jsonInput.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(processJson, 300);
    });

    formatBtn.addEventListener('click', () => processJson(true));
    minifyBtn.addEventListener('click', () => processJson(false));

    clearBtn.addEventListener('click', () => {
        jsonInput.value = '';
        jsonInput.classList.remove('error');
        jsonOutput.innerHTML = '';
        validationStatus.className = 'status-badge';
        validationStatus.innerText = 'Waiting for input...';
    });

    copyBtn.addEventListener('click', async () => {
        if (!jsonOutput.innerText) return;
        try {
            await navigator.clipboard.writeText(jsonOutput.innerText);
            const origText = copyBtn.innerText;
            copyBtn.innerText = 'Copied!';
            setTimeout(() => { copyBtn.innerText = origText; }, 2000);
            
            if (window.trackToolUsage) window.trackToolUsage('JSON Formatter');
        } catch (err) {
            console.error(err);
        }
    });

    function processJson(format = true) {
        const raw = jsonInput.value;
        if (!raw.trim()) {
            jsonInput.classList.remove('error');
            jsonOutput.innerHTML = '';
            validationStatus.className = 'status-badge';
            validationStatus.innerText = 'Waiting for input...';
            return;
        }

        try {
            const parsed = JSON.parse(raw);
            
            // Valid JSON
            jsonInput.classList.remove('error');
            validationStatus.className = 'status-badge valid';
            validationStatus.innerText = 'Valid JSON ✓';

            if (format) {
                const pretty = JSON.stringify(parsed, null, 4);
                jsonOutput.innerHTML = syntaxHighlight(pretty);
            } else {
                const minified = JSON.stringify(parsed);
                jsonOutput.innerText = minified; // no syntax highlight for raw minified (performance)
            }
            
        } catch (err) {
            jsonInput.classList.add('error');
            validationStatus.className = 'status-badge invalid';
            validationStatus.innerText = 'Invalid JSON: ' + err.message.substring(0, 50);
            jsonOutput.innerHTML = `<span style="color:#ef4444;">Parse Error: ${err.message}</span>`;
        }
    }

    function syntaxHighlight(json) {
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
            let cls = 'json-number';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'json-key';
                } else {
                    cls = 'json-string';
                }
            } else if (/true|false/.test(match)) {
                cls = 'json-boolean';
            } else if (/null/.test(match)) {
                cls = 'json-null';
            }
            return '<span class="' + cls + '">' + match + '</span>';
        });
    }
}

function initColorPalette() {
    const generateBtn = document.getElementById('generateBtn');
    const container = document.getElementById('paletteContainer');

    if (!generateBtn || !container) return;

    generateBtn.addEventListener('click', generatePalette);
    
    // Spacebar listener
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
            e.preventDefault();
            generatePalette();
        }
    });

    // Initial on load
    generatePalette();

    function generatePalette() {
        container.innerHTML = ''; // clear

        // Core base hue
        const baseHue = Math.floor(Math.random() * 360);
        
        // Pick a harmonic strategy
        const strategies = [
            generateMonochromatic,
            generateAnalogous,
            generateComplementary,
            generateTriadic
        ];
        
        const selectedStrategy = strategies[Math.floor(Math.random() * strategies.length)];
        const colors = selectedStrategy(baseHue);

        colors.forEach((c) => {
            const hex = HSLToHex(c.h, c.s, c.l);
            const isDark = c.l < 50;
            const textCol = isDark ? '#ffffff' : '#1e293b';

            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = hex;
            
            swatch.innerHTML = `
                <div class="color-info">
                    <div class="color-hex">${hex.toUpperCase()}</div>
                    <div class="color-rgb">HSL: ${Math.round(c.h)}°, ${Math.round(c.s)}%, ${Math.round(c.l)}%</div>
                </div>
                <div class="copied-toast">Copied!</div>
            `;

            swatch.addEventListener('click', () => {
                navigator.clipboard.writeText(hex.toUpperCase()).then(() => {
                    const toast = swatch.querySelector('.copied-toast');
                    toast.style.opacity = '1';
                    toast.style.transform = 'translate(-50%, -60%)';
                    setTimeout(() => {
                        toast.style.opacity = '0';
                        toast.style.transform = 'translate(-50%, -50%)';
                    }, 1000);
                    
                    if (window.trackToolUsage) window.trackToolUsage('Color Palette Generator');
                });
            });

            container.appendChild(swatch);
        });
    }

    // --- Color Math ---
    function generateMonochromatic(h) {
        // Same hue, varying lightness and saturation
        return [
            { h: h, s: 70, l: 15 },
            { h: h, s: 80, l: 30 },
            { h: h, s: 85, l: 45 },
            { h: h, s: 80, l: 70 },
            { h: h, s: 60, l: 90 },
        ];
    }

    function generateAnalogous(h) {
        // Adjacent hues
        return [
            { h: (h - 30 + 360) % 360, s: 80, l: 50 },
            { h: (h - 15 + 360) % 360, s: 80, l: 50 },
            { h: h, s: 80, l: 50 },
            { h: (h + 15) % 360, s: 80, l: 50 },
            { h: (h + 30) % 360, s: 80, l: 50 },
        ];
    }

    function generateComplementary(h) {
        // Opposite hues + split complementary mix
        const comp = (h + 180) % 360;
        return [
            { h: h, s: 90, l: 20 },
            { h: h, s: 80, l: 50 },
            { h: h, s: 50, l: 90 },
            { h: comp, s: 80, l: 50 },
            { h: comp, s: 90, l: 30 }, // darker complementary
        ];
    }

    function generateTriadic(h) {
        // Triangle on wheel
        const t1 = (h + 120) % 360;
        const t2 = (h + 240) % 360;
        return [
            { h: h, s: 80, l: 40 },
            { h: h, s: 90, l: 60 },
            { h: t1, s: 80, l: 50 },
            { h: t2, s: 80, l: 50 },
            { h: t2, s: 30, l: 90 },
        ];
    }

    // --- HSL to HEX Utility ---
    function HSLToHex(h, s, l) {
        s /= 100;
        l /= 100;

        let c = (1 - Math.abs(2 * l - 1)) * s,
            x = c * (1 - Math.abs((h / 60) % 2 - 1)),
            m = l - c/2,
            r = 0,
            g = 0,
            b = 0;

        if (0 <= h && h < 60) { r = c; g = x; b = 0; }
        else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
        else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
        else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
        else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
        else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

        r = Math.round((r + m) * 255).toString(16);
        g = Math.round((g + m) * 255).toString(16);
        b = Math.round((b + m) * 255).toString(16);

        if (r.length === 1) r = "0" + r;
        if (g.length === 1) g = "0" + g;
        if (b.length === 1) b = "0" + b;

        return "#" + r + g + b;
    }
}
