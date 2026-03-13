/**
 * image-tools.js
 * Logic for HTML5 Canvas Image Manipulation (Compressor, Resizer, Converter)
 */

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    if (path.includes('image-compressor')) {
        initImageCompressor();
    }
    
    if (path.includes('image-resizer')) {
        initImageResizer();
    }
    
    if (path.includes('png-to-jpg')) {
        initPngToJpg();
    }
    
    if (path.includes('jpg-to-png')) {
        initJpgToPng();
    }
    
    if (path.includes('crop-image')) {
        initCropImage();
    }
});

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function initImageCompressor() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const workspaceEditor = document.getElementById('workspaceEditor');
    
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    
    const originalPreview = document.getElementById('originalPreview');
    const compressedPreview = document.getElementById('compressedPreview');
    
    const originalSizeLabel = document.getElementById('originalSize');
    const compressedSizeLabel = document.getElementById('compressedSize');
    const savingsBadge = document.getElementById('savingsBadge');
    
    const downloadBtn = document.getElementById('downloadBtn');

    let currentFile = null;
    let originalDataURL = null;
    let originalSize = 0;

    // Drag & Drop Handling
    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, e => {
                e.preventDefault();
                e.stopPropagation();
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

        if (window.validateFileType) {
            if (!window.validateFileType(file, ['image/jpeg', 'image/png', 'image/webp'])) return;
        }

        currentFile = file;
        originalSize = file.size;
        
        // Hide Dropzone, show loader
        dropZone.style.display = 'none';
        if (window.toggleLoader) window.toggleLoader(true, 'Reading image data...');

        const reader = new FileReader();
        reader.onload = function(event) {
            originalDataURL = event.target.result;
            
            originalPreview.src = originalDataURL;
            originalSizeLabel.innerText = formatBytes(originalSize);

            // Wait for image to naturally load to acquire dimensions
            originalPreview.onload = () => {
                workspaceEditor.style.display = 'block';
                if (window.toggleLoader) window.toggleLoader(false);
                processCompression(); // initial compression
            }
        };
        reader.readAsDataURL(file);
    }

    // Slider Event
    let debounceTimer;
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.innerText = `${e.target.value}%`;
    });
    
    qualitySlider.addEventListener('change', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            processCompression();
        }, 150); // slight debounce so it doesn't stutter on complex images
    });

    function processCompression() {
        if (!originalPreview.complete || originalPreview.naturalWidth === 0) return;

        const quality = parseInt(qualitySlider.value) / 100;
        
        // Canvas generation
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = originalPreview.naturalWidth;
        canvas.height = originalPreview.naturalHeight;
        
        // Draw image directly onto canvas
        ctx.drawImage(originalPreview, 0, 0, canvas.width, canvas.height);

        // Convert back to DataURL mapping out to WEBP or JPEG
        // WebP is optimal. If the original was jpeg, output jpeg.
        let outputFormat = 'image/jpeg';
        if (currentFile.type === 'image/webp') outputFormat = 'image/webp';
        
        // PNGs can't be "lossy" compressed natively using standard draw logic outputting "image/png".
        // To reduce PNG size we must convert it to a JPG or WebP. We will use JPEG for standard portability.
        // If they want transparent lossy PNG compression (like TinyPNG format), that requires quantization.
        // We will output WEBP or JPEG to maintain size benefits.
        
        const compressedDataUrl = canvas.toDataURL(outputFormat, quality);
        
        compressedPreview.src = compressedDataUrl;

        // Calculate size logic
        const byteString = atob(compressedDataUrl.split(',')[1]);
        const compressedSize = byteString.length;
        
        compressedSizeLabel.innerText = formatBytes(compressedSize);
        
        // Compute Savings
        const savings = originalSize - compressedSize;
        if (savings > 0) {
            const savingsPercent = ((savings / originalSize) * 100).toFixed(1);
            savingsBadge.innerText = `You saved ${formatBytes(savings)} (${savingsPercent}%)`;
            compressedSizeLabel.className = 'size-badge success';
        } else {
            savingsBadge.innerText = `File size increased. Standardize quality slider.`;
            compressedSizeLabel.className = 'size-badge warning';
        }

        // Setup Download Link
        downloadBtn.href = compressedDataUrl;
        
        const fileExt = outputFormat === 'image/webp' ? '.webp' : '.jpg';
        const baseName = currentFile.name.split('.')[0];
        downloadBtn.download = `${baseName}-compressed${fileExt}`;

        // Analytics tracking hook
        downloadBtn.onclick = () => {
            if (window.trackToolUsage) window.trackToolUsage('Image Compressor');
        }
    }
}

function initImageResizer() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const workspaceEditor = document.getElementById('workspaceEditor');
    
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const lockRatio = document.getElementById('lockRatio');
    
    const imagePreview = document.getElementById('imagePreview');
    const sizeIndicator = document.getElementById('sizeIndicator');
    const downloadBtn = document.getElementById('downloadBtn');

    let currentFile = null;
    let originalWidth = 0;
    let originalHeight = 0;
    let ratio = 1;

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
        if (window.validateFileType && !window.validateFileType(file, ['image/jpeg', 'image/png', 'image/webp'])) return;

        currentFile = file;
        dropZone.style.display = 'none';
        
        const reader = new FileReader();
        reader.onload = function(event) {
            imagePreview.src = event.target.result;
            imagePreview.onload = () => {
                originalWidth = imagePreview.naturalWidth;
                originalHeight = imagePreview.naturalHeight;
                ratio = originalWidth / originalHeight;
                
                widthInput.value = originalWidth;
                heightInput.value = originalHeight;
                sizeIndicator.innerText = `Original Size: ${originalWidth} x ${originalHeight} px`;
                
                workspaceEditor.style.display = 'grid';
            }
        };
        reader.readAsDataURL(file);
    }

    // Input handlers
    widthInput.addEventListener('input', () => {
        if (lockRatio.checked && widthInput.value) {
            heightInput.value = Math.round(parseInt(widthInput.value) / ratio);
        }
    });

    heightInput.addEventListener('input', () => {
        if (lockRatio.checked && heightInput.value) {
            widthInput.value = Math.round(parseInt(heightInput.value) * ratio);
        }
    });

    downloadBtn.addEventListener('click', () => {
        const targetWidth = parseInt(widthInput.value);
        const targetHeight = parseInt(heightInput.value);
        
        if (!targetWidth || !targetHeight) {
            alert('Please enter valid dimensions');
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        // Smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(imagePreview, 0, 0, canvas.width, canvas.height);

        let outputType = currentFile.type;
        const dataUrl = canvas.toDataURL(outputType, 0.92);

        const link = document.createElement('a');
        link.download = `resized-${targetWidth}x${targetHeight}-${currentFile.name}`;
        link.href = dataUrl;
        link.click();
        
        if (window.trackToolUsage) window.trackToolUsage('Image Resizer');
    });
}

function initPngToJpg() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const converterWorkspace = document.getElementById('converterWorkspace');
    const downloadBtn = document.getElementById('downloadBtn');
    
    let currentDataUrl = null;
    let currentFileName = "";

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
        if (window.validateFileType && !window.validateFileType(file, ['image/png'])) {
            alert("Please select a valid PNG file.");
            return;
        }

        currentFileName = file.name.split('.')[0];
        dropZone.style.display = 'none';
        
        if (window.toggleLoader) window.toggleLoader(true, 'Converting to JPG...');

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                
                // Fill white background for transparency
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);

                currentDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                
                if (window.toggleLoader) window.toggleLoader(false);
                converterWorkspace.style.display = 'block';
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    downloadBtn.addEventListener('click', () => {
        if (!currentDataUrl) return;
        const link = document.createElement('a');
        link.download = `${currentFileName}-converted.jpg`;
        link.href = currentDataUrl;
        link.click();
        
        if (window.trackToolUsage) window.trackToolUsage('PNG to JPG Converter');
    });
}

function initJpgToPng() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const previewArea = document.getElementById('previewArea');
    const imagePreview = document.getElementById('imagePreview');
    const fileInfo = document.getElementById('fileInfo');
    const downloadBtn = document.getElementById('downloadBtn');
    
    let currentDataUrl = null;
    let currentFileName = "";

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
        if (window.validateFileType && !window.validateFileType(file, ['image/jpeg', 'image/jpg'])) {
            alert("Please select a valid JPG file.");
            return;
        }

        currentFileName = file.name.split('.')[0];
        dropZone.style.display = 'none';
        
        if (window.toggleLoader) window.toggleLoader(true, 'Converting to PNG...');

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                
                // Draw image naturally
                ctx.drawImage(img, 0, 0);

                currentDataUrl = canvas.toDataURL('image/png'); // Standard PNG
                
                imagePreview.src = currentDataUrl;
                
                // calculate output size
                const byteString = atob(currentDataUrl.split(',')[1]);
                fileInfo.innerHTML = `Original: <strong>${formatBytes(file.size)}</strong> <br> Converted PNG: <strong>${formatBytes(byteString.length)}</strong> <br><br> <span style="font-size:0.8rem">Note: PNG files are generally larger as they are lossless.</span>`;

                if (window.toggleLoader) window.toggleLoader(false);
                previewArea.style.display = 'block';
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }

    downloadBtn.addEventListener('click', () => {
        if (!currentDataUrl) return;
        const link = document.createElement('a');
        link.download = `${currentFileName}-converted.png`;
        link.href = currentDataUrl;
        link.click();
        
        if (window.trackToolUsage) window.trackToolUsage('JPG to PNG Converter');
    });
}

function initCropImage() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const editorWorkspace = document.getElementById('editorWorkspace');
    const canvasContainer = document.getElementById('canvasContainer');
    const imageTarget = document.getElementById('imageTarget');
    const performCropBtn = document.getElementById('performCropBtn');
    const ratioBtns = document.querySelectorAll('.aspect-ratio-btn');
    
    let currentFileName = "";
    let currentFileType = "";
    let cropperInstance = null;

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
        if (window.validateFileType && !window.validateFileType(file, ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])) {
            return;
        }

        currentFileName = file.name.split('.')[0];
        currentFileType = file.type;
        dropZone.style.display = 'none';
        
        if (window.toggleLoader) window.toggleLoader(true, 'Initializing Cropper Engine...');

        const reader = new FileReader();
        reader.onload = function(event) {
            imageTarget.src = event.target.result;
            
            // Wait for image to load before attaching cropper
            imageTarget.onload = () => {
                editorWorkspace.style.display = 'block';
                canvasContainer.style.display = 'block';
                
                if (cropperInstance) cropperInstance.destroy();
                
                cropperInstance = new Cropper(imageTarget, {
                    viewMode: 1, // Restrict box to canvas
                    dragMode: 'move', // Allow moving the image itself
                    aspectRatio: NaN, // Freeform by default
                    autoCropArea: 0.8,
                    guides: true,
                    center: true,
                    highlight: true,
                    cropBoxMovable: true,
                    cropBoxResizable: true,
                    toggleDragModeOnDblclick: false
                });

                if (window.toggleLoader) window.toggleLoader(false);
            };
        };
        reader.readAsDataURL(file);
    }
    
    // Wire up dimension ratio shortcuts
    ratioBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!cropperInstance) return;
            
            // Update active state
            ratioBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const ratioValue = parseFloat(btn.dataset.ratio);
            cropperInstance.setAspectRatio(ratioValue);
        });
    });

    performCropBtn.addEventListener('click', () => {
        if (!cropperInstance) return;
        
        // Output format mapping
        let outFormat = 'image/jpeg';
        let ext = '.jpg';
        if (currentFileType === 'image/png') { outFormat = 'image/png'; ext = '.png'; }
        if (currentFileType === 'image/webp') { outFormat = 'image/webp'; ext = '.webp'; }
        
        // Grab final canvas clip
        const croppedCanvas = cropperInstance.getCroppedCanvas({
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });
        
        if (!croppedCanvas) {
            alert('Could not compute crop. Try adjusting boundaries.');
            return;
        }
        
        const dataUrl = croppedCanvas.toDataURL(outFormat, 0.95);
        
        const link = document.createElement('a');
        link.download = `${currentFileName}-cropped${ext}`;
        link.href = dataUrl;
        link.click();
        
        if (window.trackToolUsage) window.trackToolUsage('Crop Image');
    });
}

