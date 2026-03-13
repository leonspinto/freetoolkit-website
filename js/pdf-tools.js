/**
 * pdf-tools.js
 * Logic for Merge PDF and general PDF manipulation utilizing pdf-lib and pdf.js
 */

document.addEventListener('DOMContentLoaded', () => {
    // Determine which tool is currently active by URL
    const path = window.location.pathname;
    
    if (path.includes('merge-pdf')) {
        initMergePdfTool();
    }
    
    if (path.includes('split-pdf')) {
        initSplitPdfTool();
    }
    
    if (path.includes('reorder-pdf')) {
        initReorderPdfTool();
    }
    
    if (path.includes('rotate-pdf')) {
        initRotatePdfTool();
    }
    
    if (path.includes('compress-pdf')) {
        initCompressPdfTool();
    }
});

let selectedPdfFiles = []; // Store file objects

function initMergePdfTool() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const pdfList = document.getElementById('pdfList');
    const actionContainer = document.getElementById('actionContainer');
    const mergeBtn = document.getElementById('mergeBtn');
    
    // Initialize SortableJS for drag-and-drop reordering
    if (typeof Sortable !== 'undefined' && pdfList) {
        new Sortable(pdfList, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function (evt) {
                // Reorder our internal array when user drags in UI
                const temp = selectedPdfFiles[evt.oldIndex];
                selectedPdfFiles.splice(evt.oldIndex, 1);
                selectedPdfFiles.splice(evt.newIndex, 0, temp);
            }
        });
    }

    // Drag and Drop Events
    if (dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('active'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('active'), false);
        });

        dropZone.addEventListener('drop', handleDrop, false);
        fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    async function handleFiles(files) {
        const newFiles = Array.from(files).filter(file => {
            if(window.validateFileType) {
                return window.validateFileType(file, ['application/pdf']);
            }
            return file.type === 'application/pdf';
        });

        if (newFiles.length === 0) return;

        // Show Loader
        if (window.toggleLoader) window.toggleLoader(true, 'Generating previews...');
        dropZone.style.display = 'none';

        for (const file of newFiles) {
            selectedPdfFiles.push(file);
            await createPdfPreviewCard(file, selectedPdfFiles.length - 1);
        }

        if (window.toggleLoader) window.toggleLoader(false);
        pdfList.style.display = 'grid';
        actionContainer.style.display = 'block';
    }

    mergeBtn.addEventListener('click', async () => {
        if (selectedPdfFiles.length < 2) {
            alert("Please select at least 2 PDF files to merge.");
            return;
        }

        actionContainer.style.display = 'none';
        if (window.toggleLoader) window.toggleLoader(true, 'Merging PDF files...');

        try {
            const mergedPdf = await PDFLib.PDFDocument.create();

            for (const file of selectedPdfFiles) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => {
                    mergedPdf.addPage(page);
                });
            }

            const mergedPdfBytes = await mergedPdf.save();
            createDownloadLink(mergedPdfBytes, 'merged-document.pdf');
            
            // Track Usage
            if (window.trackToolUsage) window.trackToolUsage('Merge PDF');
            
        } catch (error) {
            console.error("Error merging PDFs:", error);
            alert("An error occurred while merging your PDFs. Please try again.");
            actionContainer.style.display = 'block';
        } finally {
            if (window.toggleLoader) window.toggleLoader(false);
        }
    });
}

function createDownloadLink(bytes, filename) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const downloadContainer = document.getElementById('downloadContainer');
    const downloadLink = document.getElementById('downloadLink');
    
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadContainer.style.display = 'block';
}

/**
 * Generates a thumbnail preview using PDF.js
 */
async function createPdfPreviewCard(file, index) {
    const pdfList = document.getElementById('pdfList');
    
    const item = document.createElement('div');
    item.className = 'pdf-item';
    item.innerHTML = `
        <button class="remove-btn" data-index="${index}" aria-label="Remove file">×</button>
        <canvas class="pdf-preview"></canvas>
        <div class="pdf-name" title="${file.name}">${file.name}</div>
    `;
    
    pdfList.appendChild(item);

    // Setup remove button
    const removeBtn = item.querySelector('.remove-btn');
    removeBtn.addEventListener('click', (e) => {
        const itemToRemove = e.target.closest('.pdf-item');
        // Find current index in UI (it might have changed due to sortable dragging)
        const allItems = Array.from(pdfList.children);
        const currentIndex = allItems.indexOf(itemToRemove);
        
        selectedPdfFiles.splice(currentIndex, 1);
        itemToRemove.remove();
        
        if (selectedPdfFiles.length === 0) {
            document.getElementById('actionContainer').style.display = 'none';
            document.getElementById('dropZone').style.display = 'block';
        }
    });

    // Generate Preview using PDF.js
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        
        const canvas = item.querySelector('canvas');
        const context = canvas.getContext('2d');
        
        // Output scale
        const viewport = page.getViewport({ scale: 0.5 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;
        
    } catch (e) {
        console.error("Preview generation failed", e);
        // Fallback if PDF.js fails to render an encrypted or complex first page
        const canvas = item.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0,0, canvas.width, canvas.height);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px Arial';
        ctx.fillText('Preview Unavailable', 10, 50);
    }
}

function initSplitPdfTool() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const editorWorkspace = document.getElementById('editorWorkspace');
    const pageGrid = document.getElementById('pageGrid');
    const pdfTitle = document.getElementById('pdfTitle');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const splitBtn = document.getElementById('splitBtn');
    
    let currentFile = null;
    let originalPdfDoc = null; // pdf-lib document
    let selectedPages = new Set();
    let totalPages = 0;

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

    async function handleFile(file) {
        if (!file) return;
        if (window.validateFileType && !window.validateFileType(file, ['application/pdf'])) return;

        currentFile = file;
        dropZone.style.display = 'none';
        
        if (window.toggleLoader) window.toggleLoader(true, 'Scanning pages sequence...');

        try {
            const arrayBuffer = await file.arrayBuffer();
            originalPdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            totalPages = originalPdfDoc.getPageCount();
            
            pdfTitle.innerText = `Document: ${file.name} (${totalPages} pages)`;
            
            // Read via pdf.js to generate thumbnails visually
            const pdfjsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            pageGrid.innerHTML = '';
            selectedPages.clear();

            for (let i = 1; i <= totalPages; i++) {
                const item = document.createElement('div');
                item.className = 'page-item';
                item.dataset.page = i - 1; // 0-indexed for pdf-lib

                const page = await pdfjsDoc.getPage(i);
                const viewport = page.getViewport({ scale: 0.3 }); // small thumbnail
                
                const canvas = document.createElement('canvas');
                canvas.className = 'page-preview';
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                const ctx = canvas.getContext('2d');
                await page.render({ canvasContext: ctx, viewport: viewport }).promise;
                
                item.appendChild(canvas);
                
                const label = document.createElement('div');
                label.innerText = `Page ${i}`;
                label.style.fontSize = '0.8rem';
                item.appendChild(label);
                
                // Toggle selection logic
                item.addEventListener('click', () => {
                    const pageIndex = parseInt(item.dataset.page);
                    if (selectedPages.has(pageIndex)) {
                        selectedPages.delete(pageIndex);
                        item.classList.remove('selected');
                    } else {
                        selectedPages.add(pageIndex);
                        item.classList.add('selected');
                    }
                });
                
                pageGrid.appendChild(item);
            }
            
            if (window.toggleLoader) window.toggleLoader(false);
            editorWorkspace.style.display = 'block';

        } catch (e) {
            console.error("Error reading PDF:", e);
            alert("Failed to read PDF. It might be encrypted or corrupted.");
            if (window.toggleLoader) window.toggleLoader(false);
            dropZone.style.display = 'block';
        }
    }

    selectAllBtn.addEventListener('click', () => {
        document.querySelectorAll('.page-item').forEach(item => {
            const pageIndex = parseInt(item.dataset.page);
            selectedPages.add(pageIndex);
            item.classList.add('selected');
        });
    });

    clearAllBtn.addEventListener('click', () => {
        selectedPages.clear();
        document.querySelectorAll('.page-item').forEach(item => {
            item.classList.remove('selected');
        });
    });

    splitBtn.addEventListener('click', async () => {
        if (selectedPages.size === 0) {
            alert("Please select at least one page to extract.");
            return;
        }

        editorWorkspace.style.display = 'none';
        if (window.toggleLoader) window.toggleLoader(true, 'Extracting selected pages...');

        try {
            const newPdf = await PDFLib.PDFDocument.create();
            // Sort indices to maintain sequential order
            const indicesToExtract = Array.from(selectedPages).sort((a,b) => a - b);
            
            const copiedPages = await newPdf.copyPages(originalPdfDoc, indicesToExtract);
            copiedPages.forEach((page) => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            const baseName = currentFile.name.split('.')[0];
            createDownloadLink(pdfBytes, `${baseName}-extracted.pdf`);
            
            if (window.trackToolUsage) window.trackToolUsage('Split PDF');

        } catch (error) {
            console.error("Split Error:", error);
            alert("Failed to split PDF.");
            editorWorkspace.style.display = 'block';
        } finally {
            if (window.toggleLoader) window.toggleLoader(false);
        }
    });

    function createDownloadLink(bytes, filename) {
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const downloadContainer = document.getElementById('downloadContainer');
        const downloadLink = document.getElementById('downloadLink');
        downloadLink.href = url;
        downloadLink.download = filename;
        downloadContainer.style.display = 'block';
    }
}

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function initCompressPdfTool() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const resultContainer = document.getElementById('resultContainer');
    const originalSizeSpan = document.getElementById('originalSize');
    const compressedSizeSpan = document.getElementById('compressedSize');
    const downloadLink = document.getElementById('downloadLink');

    if (!dropZone) return;

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

    async function handleFile(file) {
        if (!file) return;
        if (window.validateFileType && !window.validateFileType(file, ['application/pdf'])) return;

        dropZone.style.display = 'none';
        if (window.toggleLoader) window.toggleLoader(true, 'Optimizing structural objects...');

        try {
            const arrayBuffer = await file.arrayBuffer();
            
            // Client-side 'compression' strips metadata and recreates the Object Streams via PDF-lib rewriting mechanics.
            // This is equivalent to "Basic Compression" on standard tooling.
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
            
            // Setting meta fields to null wipes them saving minor space
            pdfDoc.setTitle('');
            pdfDoc.setAuthor('');
            pdfDoc.setSubject('');
            pdfDoc.setKeywords([]);
            pdfDoc.setProducer('');
            pdfDoc.setCreator('');
            
            const pdfBytes = await pdfDoc.save({ useObjectStreams: true });

            originalSizeSpan.innerText = formatBytes(file.size);
            compressedSizeSpan.innerText = formatBytes(pdfBytes.length);

            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            const baseName = file.name.split('.')[0];
            downloadLink.href = url;
            downloadLink.download = `${baseName}-compressed.pdf`;
            
            if (window.trackToolUsage) window.trackToolUsage('Compress PDF');
            
            if (window.toggleLoader) window.toggleLoader(false);
            resultContainer.style.display = 'block';

        } catch (e) {
            console.error("Compression Error:", e);
            alert("Failed to compress PDF. It might be heavily encrypted or damaged.");
            if (window.toggleLoader) window.toggleLoader(false);
            dropZone.style.display = 'block';
        }
    }
}

function initReorderPdfTool() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const editorWorkspace = document.getElementById('editorWorkspace');
    const pageGrid = document.getElementById('pageGrid');
    const pdfTitle = document.getElementById('pdfTitle');
    const reorderBtn = document.getElementById('reorderBtn');
    
    let currentFile = null;
    let originalPdfDoc = null; // pdf-lib document
    let totalPages = 0;
    
    if (!dropZone) return;

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

    async function handleFile(file) {
        if (!file) return;
        if (window.validateFileType && !window.validateFileType(file, ['application/pdf'])) return;

        currentFile = file;
        dropZone.style.display = 'none';
        
        if (window.toggleLoader) window.toggleLoader(true, 'Scanning pages sequence...');

        try {
            const arrayBuffer = await file.arrayBuffer();
            originalPdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            totalPages = originalPdfDoc.getPageCount();
            
            pdfTitle.innerText = `Document: ${file.name} (Drag to Reorder)`;
            
            // Read via pdf.js to generate thumbnails
            const pdfjsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            pageGrid.innerHTML = '';

            for (let i = 1; i <= totalPages; i++) {
                const item = document.createElement('div');
                item.className = 'page-item';
                item.dataset.page = i - 1; // 0-indexed for pdf-lib

                const page = await pdfjsDoc.getPage(i);
                const viewport = page.getViewport({ scale: 0.3 }); 
                
                const canvas = document.createElement('canvas');
                canvas.className = 'page-preview';
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                const ctx = canvas.getContext('2d');
                await page.render({ canvasContext: ctx, viewport: viewport }).promise;
                
                item.appendChild(canvas);
                
                const label = document.createElement('div');
                label.className = 'page-number-label';
                label.innerText = i;
                item.appendChild(label);
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-page-btn';
                deleteBtn.innerText = '✕';
                deleteBtn.title = 'Remove Page';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    item.remove();
                };
                item.appendChild(deleteBtn);
                
                pageGrid.appendChild(item);
            }
            
            // Enable SortableJS
            new Sortable(pageGrid, {
                animation: 150,
                ghostClass: 'sortable-ghost',
                onEnd: function() {
                    // Update labels
                    const items = pageGrid.querySelectorAll('.page-item');
                    items.forEach((item, index) => {
                        item.querySelector('.page-number-label').innerText = index + 1;
                    });
                }
            });
            
            if (window.toggleLoader) window.toggleLoader(false);
            editorWorkspace.style.display = 'block';

        } catch (e) {
            console.error("Error reading PDF:", e);
            alert("Failed to read PDF. It might be encrypted or corrupted.");
            if (window.toggleLoader) window.toggleLoader(false);
            dropZone.style.display = 'block';
        }
    }

    reorderBtn.addEventListener('click', async () => {
        const items = pageGrid.querySelectorAll('.page-item');
        if (items.length === 0) {
            alert("No pages left to save.");
            return;
        }

        editorWorkspace.style.display = 'none';
        if (window.toggleLoader) window.toggleLoader(true, 'Building new PDF...');

        try {
            const newPdf = await PDFLib.PDFDocument.create();
            
            const indicesToExtract = Array.from(items).map(item => parseInt(item.dataset.page));
            
            const copiedPages = await newPdf.copyPages(originalPdfDoc, indicesToExtract);
            copiedPages.forEach((page) => newPdf.addPage(page));

            const pdfBytes = await newPdf.save();
            const baseName = currentFile.name.split('.')[0];
            createDownloadLink(pdfBytes, `${baseName}-reordered.pdf`);
            
            if (window.trackToolUsage) window.trackToolUsage('Reorder PDF');

        } catch (error) {
            console.error("Reorder Error:", error);
            alert("Failed to reorder PDF.");
            editorWorkspace.style.display = 'block';
        } finally {
            if (window.toggleLoader) window.toggleLoader(false);
        }
    });

    function createDownloadLink(bytes, filename) {
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const downloadContainer = document.getElementById('downloadContainer');
        const downloadLink = document.getElementById('downloadLink');
        downloadLink.href = url;
        downloadLink.download = filename;
        downloadContainer.style.display = 'block';
    }
}
