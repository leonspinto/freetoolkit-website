/**
 * design-tools.js
 * Logic for HTML5 Canvas Interactive Composition (Thumbnail Maker, Meme Generator)
 */

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    if (path.includes('thumbnail-maker')) {
        initThumbnailMaker();
    }
    
    if (path.includes('meme-generator')) {
        initMemeGenerator();
    }
    
    if (path.includes('poster-maker')) {
        initPosterMaker();
    }
    
    if (path.includes('profile-picture-maker')) {
        initProfilePictureMaker();
    }
});

function initThumbnailMaker() {
    const canvas = document.getElementById('designCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const bgInput = document.getElementById('bgInput');
    const textInput = document.getElementById('textInput');
    const fontSize = document.getElementById('fontSize');
    const textColor = document.getElementById('textColor');
    const textStroke = document.getElementById('textStroke');
    const downloadBtn = document.getElementById('downloadBtn');

    // Canvas State
    let bgImage = null;
    let textX = canvas.width / 2;
    let textY = canvas.height / 2 + 30;
    
    // Dragging state for text
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;

    // Default Rendering
    render();

    // Event Listeners for UI
    bgInput.addEventListener('change', handleBgUpload);
    textInput.addEventListener('input', render);
    fontSize.addEventListener('input', render);
    textColor.addEventListener('input', render);
    textStroke.addEventListener('input', render);

    // Mouse/Touch Events for Dragging Text
    canvas.addEventListener('mousedown', startDrag);
    canvas.addEventListener('mousemove', drag);
    canvas.addEventListener('mouseup', endDrag);
    canvas.addEventListener('mouseleave', endDrag);
    
    canvas.addEventListener('touchstart', handleTouch, {passive: false});
    canvas.addEventListener('touchmove', handleTouch, {passive: false});
    canvas.addEventListener('touchend', endDrag);

    function handleBgUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (window.validateFileType && !window.validateFileType(file, ['image/jpeg', 'image/png', 'image/webp'])) {
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = () => {
                bgImage = img;
                render();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function render() {
        // Clear logic
        ctx.fillStyle = '#1e293b'; // Dark slate placeholder
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Render Background (Cover mode maintaining 16:9 ratio)
        if (bgImage) {
            drawCoverImage(bgImage);
        }

        // Render Text
        const text = textInput.value || (bgImage ? '' : 'ENTER CATCHY TITLE');
        if (text) {
            const size = parseInt(fontSize.value) || 100;
            
            // Thumbnail aesthetic text setup
            ctx.font = `900 ${size}px 'Inter', system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Thick Outline for contrast
            ctx.strokeStyle = textStroke.value;
            ctx.lineWidth = size * 0.15; // Proportional stroke
            ctx.lineJoin = 'round';
            ctx.strokeText(text, textX, textY);

            // Inner Fill
            ctx.fillStyle = textColor.value;
            ctx.fillText(text, textX, textY);
            
            // Minor inner shadow layer for pop
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillText(text, textX, textY - (size * 0.02));
        }
    }

    // Advanced "Object-Fit: Cover" implementation for Canvas
    function drawCoverImage(img) {
        const canvasRatio = canvas.width / canvas.height;
        const imgRatio = img.width / img.height;
        
        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasRatio > imgRatio) {
            drawWidth = canvas.width;
            drawHeight = canvas.width / imgRatio;
            offsetX = 0;
            offsetY = (canvas.height - drawHeight) / 2;
        } else {
            drawHeight = canvas.height;
            drawWidth = canvas.height * imgRatio;
            offsetX = (canvas.width - drawWidth) / 2;
            offsetY = 0;
        }

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }

    // Drag Logic Utility
    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        // Since canvas CSS size is dynamic but pixel size is 1280x720, we calculate the scale multiplier
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        let clientX = e.clientX;
        let clientY = e.clientY;
        
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    function startDrag(e) {
        if (!textInput.value && bgImage) return; // nothing to drag
        const pos = getMousePos(e);
        
        // Simple hit detection logic could go here, but for 1 element we just let them drag anywhere
        isDragging = true;
        dragStartX = pos.x - textX;
        dragStartY = pos.y - textY;
    }

    function drag(e) {
        if (!isDragging) return;
        const pos = getMousePos(e);
        
        textX = pos.x - dragStartX;
        textY = pos.y - dragStartY;
        render();
    }

    function handleTouch(e) {
        if(e.type === 'touchstart') {
            e.preventDefault(); // prevents scrolling while dragging
            startDrag(e);
        } else if (e.type === 'touchmove') {
            e.preventDefault();
            drag(e);
        }
    }

    function endDrag() {
        isDragging = false;
    }

    // Download Handler
    downloadBtn.addEventListener('click', () => {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'freetoolkit-thumbnail.png';
        link.href = dataUrl;
        link.click();
        
        if (window.trackToolUsage) window.trackToolUsage('Thumbnail Maker');
    });
}

function initMemeGenerator() {
    const canvas = document.getElementById('memeCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const bgInput = document.getElementById('memeBgInput');
    const topTextInput = document.getElementById('topTextInput');
    const bottomTextInput = document.getElementById('bottomTextInput');
    const downloadBtn = document.getElementById('downloadMemeBtn');
    const prompt = document.getElementById('memePrompt');

    let bgImage = null;

    bgInput.addEventListener('change', handleBgUpload);
    topTextInput.addEventListener('input', renderMeme);
    bottomTextInput.addEventListener('input', renderMeme);

    function handleBgUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (window.validateFileType && !window.validateFileType(file, ['image/jpeg', 'image/png', 'image/webp'])) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = () => {
                bgImage = img;
                canvas.width = img.width;
                canvas.height = img.height;
                prompt.style.display = 'none';
                downloadBtn.disabled = false;
                renderMeme();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function renderMeme() {
        if (!bgImage) return;

        // Draw Image
        ctx.drawImage(bgImage, 0, 0);

        const topText = topTextInput.value.toUpperCase();
        const bottomText = bottomTextInput.value.toUpperCase();
        
        // Base Font size is 1/8th of image height or at least 40px
        const baseFontSize = Math.max(Math.floor(canvas.height / 8), 40);

        // Core font styling
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';

        drawTextWithWrapping(topText, canvas.width / 2, baseFontSize + 10, baseFontSize, true);
        drawTextWithWrapping(bottomText, canvas.width / 2, canvas.height - 20, baseFontSize, false);
    }

    function drawTextWithWrapping(text, x, y, initialFontSize, isTop) {
        if (!text) return;
        
        ctx.font = `900 ${initialFontSize}px 'Impact', 'Inter', sans-serif`;
        ctx.lineWidth = Math.max(initialFontSize * 0.1, 4);
        
        const maxLineWidth = canvas.width * 0.9;
        
        // Scale down if single word is too long
        let fontSize = initialFontSize;
        while (ctx.measureText(text).width > maxLineWidth && fontSize > 20) {
            fontSize -= 2;
            ctx.font = `900 ${fontSize}px 'Impact', 'Inter', sans-serif`;
            ctx.lineWidth = Math.max(fontSize * 0.1, 4);
        }

        // Extremely simple wrapping for memes
        const words = text.split(' ');
        let line = '';
        let lines = [];

        for(let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = ctx.measureText(testLine);
            let testWidth = metrics.width;
            if (testWidth > maxLineWidth && n > 0) {
                lines.push(line.trim());
                line = words[n] + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line.trim());

        // Adjust Y calculation based on top or bottom
        let startY = y;
        const lineHeight = fontSize * 1.2;
        
        if (!isTop) {
            // If bottom text, shift Y up based on total number of lines
            startY = y - ((lines.length - 1) * lineHeight);
        }

        for (let i = 0; i < lines.length; i++) {
            ctx.strokeText(lines[i], x, startY + (i * lineHeight));
            ctx.fillText(lines[i], x, startY + (i * lineHeight));
        }
    }

    downloadBtn.addEventListener('click', () => {
        if (!bgImage) return;
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'freetoolkit-meme.png';
        link.href = dataUrl;
        link.click();
        
        if (window.trackToolUsage) window.trackToolUsage('Meme Generator');
    });
}

function initPosterMaker() {
    const canvas = document.getElementById('posterCanvas');
    if (!canvas) return;
    
    // Default A4 portrait resolution
    canvas.width = 1200;
    canvas.height = 1700;
    
    const ctx = canvas.getContext('2d');
    
    const bgColor = document.getElementById('bgColor');
    const bgImageInput = document.getElementById('bgImageInput');
    const mainText = document.getElementById('mainText');
    const mainTextColor = document.getElementById('mainTextColor');
    const mainTextSize = document.getElementById('mainTextSize');
    const mainTextFont = document.getElementById('mainTextFont');
    
    const subText = document.getElementById('subText');
    const subTextColor = document.getElementById('subTextColor');
    const subTextSize = document.getElementById('subTextSize');
    
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');

    let bgImage = null;

    bgImageInput.addEventListener('change', handleBgUpload);
    
    const elements = [bgColor, mainText, mainTextColor, mainTextSize, mainTextFont, subText, subTextColor, subTextSize];
    elements.forEach(el => {
        el.addEventListener('input', renderPoster);
        el.addEventListener('change', renderPoster);
    });

    renderPoster(); // Initial paint

    function handleBgUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (window.validateFileType && !window.validateFileType(file, ['image/jpeg', 'image/png', 'image/webp'])) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = () => {
                bgImage = img;
                renderPoster();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    function renderPoster() {
        // Clear & Background
        ctx.fillStyle = bgColor.value;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (bgImage) {
            drawCoverImage(bgImage);
            // Apply a slight overlay so text stays readable
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Render Main Text
        if (mainText.value) {
            const fontName = mainTextFont.value;
            const size = parseInt(mainTextSize.value) || 120;
            
            ctx.font = `900 ${size}px "${fontName}", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            ctx.fillStyle = mainTextColor.value;
            
            // Simple word wrap
            const maxWidth = canvas.width * 0.9;
            drawWrappedText(ctx, mainText.value.toUpperCase(), canvas.width/2, size * 2, maxWidth, size * 1.2);
        }

        // Render Sub Text
        if (subText.value) {
            const size = parseInt(subTextSize.value) || 40;
            ctx.font = `500 ${size}px "Arial", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = subTextColor.value;
            
            const maxWidth = canvas.width * 0.8;
            drawWrappedText(ctx, subText.value, canvas.width/2, canvas.height - (size * 4), maxWidth, size * 1.5);
        }
    }

    function drawWrappedText(context, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
            let testLine = line + words[n] + ' ';
            let metrics = context.measureText(testLine);
            let testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                context.fillText(line.trim(), x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        context.fillText(line.trim(), x, currentY);
    }

    function drawCoverImage(img) {
        const canvasRatio = canvas.width / canvas.height;
        const imgRatio = img.width / img.height;
        let drawWidth, drawHeight, offsetX, offsetY;

        if (canvasRatio > imgRatio) {
            drawWidth = canvas.width;
            drawHeight = canvas.width / imgRatio;
            offsetX = 0;
            offsetY = (canvas.height - drawHeight) / 2;
        } else {
            drawHeight = canvas.height;
            drawWidth = canvas.height * imgRatio;
            offsetX = (canvas.width - drawWidth) / 2;
            offsetY = 0;
        }
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    }

    resetBtn.addEventListener('click', () => {
        bgImage = null;
        bgColor.value = '#4f46e5';
        mainText.value = 'GRAND OPENING';
        mainTextColor.value = '#ffffff';
        mainTextSize.value = '120';
        subText.value = 'Join us this Saturday for exclusive deals and giveaways!';
        subTextColor.value = '#ffffff';
        subTextSize.value = '40';
        renderPoster();
    });

    downloadBtn.addEventListener('click', () => {
        const dataUrl = canvas.toDataURL('image/png', 0.95);
        const link = document.createElement('a');
        link.download = 'poster-design.png';
        link.href = dataUrl;
        link.click();
        
        if (window.trackToolUsage) window.trackToolUsage('Poster Maker');
    });
}

function initProfilePictureMaker() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const editorWorkspace = document.getElementById('editorWorkspace');
    const canvasContainer = document.getElementById('canvasContainer');
    const imageTarget = document.getElementById('imageTarget');
    const generateBtn = document.getElementById('generateBtn');
    
    const resultWorkspace = document.getElementById('resultWorkspace');
    const resultImage = document.getElementById('resultImage');
    const downloadBtn = document.getElementById('downloadBtn');
    
    let currentFileName = "";
    let cropperInstance = null;
    let finalDataUrl = null;

    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, e => {
                e.preventDefault(); e.stopPropagation();
            }, false);
        });
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('active'), false);
        });
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('active'), false);
        });
        dropZone.addEventListener('drop', (e) => handleFile(e.dataTransfer.files[0]), false);
        fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    }

    function handleFile(file) {
        if (!file) return;
        if (window.validateFileType && !window.validateFileType(file, ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])) return;

        currentFileName = file.name.split('.')[0];
        dropZone.style.display = 'none';
        
        if (window.toggleLoader) window.toggleLoader(true, 'Loading Image...');

        const reader = new FileReader();
        reader.onload = function(event) {
            imageTarget.src = event.target.result;
            
            imageTarget.onload = () => {
                editorWorkspace.style.display = 'block';
                canvasContainer.style.display = 'block';
                
                if (cropperInstance) cropperInstance.destroy();
                
                cropperInstance = new Cropper(imageTarget, {
                    aspectRatio: 1, // Enforce square which will become a perfect circle
                    viewMode: 1,
                    dragMode: 'move',
                    autoCropArea: 0.8,
                    guides: false, // Turn off guides to reduce UI clutter for the circle
                    center: false,
                    highlight: false,
                    cropBoxMovable: true,
                    cropBoxResizable: true,
                    toggleDragModeOnDblclick: false,
                });

                if (window.toggleLoader) window.toggleLoader(false);
            };
        };
        reader.readAsDataURL(file);
    }

    generateBtn.addEventListener('click', () => {
        if (!cropperInstance) return;
        
        const squareCanvas = cropperInstance.getCroppedCanvas({
            width: 800, // Enforce a solid resolution
            height: 800,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });
        
        if (!squareCanvas) {
            alert('Selection failed. Please adjust the crop window.');
            return;
        }

        // Apply circular clipping
        const circleCanvas = document.createElement('canvas');
        circleCanvas.width = squareCanvas.width;
        circleCanvas.height = squareCanvas.height;
        const ctx = circleCanvas.getContext('2d');
        
        ctx.beginPath();
        ctx.arc(circleCanvas.width / 2, circleCanvas.height / 2, circleCanvas.width / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        ctx.drawImage(squareCanvas, 0, 0);
        
        finalDataUrl = circleCanvas.toDataURL('image/png'); // Must be PNG for transparent bounds
        
        resultImage.src = finalDataUrl;
        
        editorWorkspace.style.display = 'none';
        resultWorkspace.style.display = 'block';
    });
    
    downloadBtn.addEventListener('click', () => {
        if (!finalDataUrl) return;
        const link = document.createElement('a');
        link.download = `${currentFileName}-avatar.png`;
        link.href = finalDataUrl;
        link.click();
        
        if (window.trackToolUsage) window.trackToolUsage('Profile Picture Maker');
    });
}
