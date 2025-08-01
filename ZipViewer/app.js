document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT REFERENCES ---
    const zipInput = document.getElementById('zip-input');
    const zipContentsContainer = document.getElementById('zip-contents');
    const fileTreeContainer = document.getElementById('file-tree-container');
    const fileContentDisplay = document.getElementById('file-content-display');
    const previewControls = document.getElementById('preview-controls');
    const supportedTypesList = document.getElementById('supported-types-list');
    const hexRowTemplate = document.getElementById('hex-row-template');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    const downloadSelectedBtn = document.getElementById('download-selected-btn');

    // --- STATE & CONSTANTS ---
    let activeFileElement = null;
    let currentObjectUrl = null;
    let currentZip = null;

    // --- DATA & DEFINITIONS ---
    const fileTypeGroups = {
        'Image': ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'bmp', 'tif', 'tiff'],
        'Audio': ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'],
        'Video': ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'],
        'Document': ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp'],
        'Text': ['txt', 'md', 'json', 'xml', 'log', 'csv', 'tsv'],
        'Code': ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'less', 'py', 'rb', 'java', 'c', 'h', 'cpp', 'cs', 'go', 'php', 'rs', 'swift', 'kt'],
        'Config': ['yml', 'yaml', 'ini', 'toml', 'env', 'conf', 'cfg'],
        'Data': ['sql', 'db', 'sqlite', 'jsonl']
    };

    const mimeTypes = {
        'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'gif': 'image/gif', 'webp': 'image/webp', 'svg': 'image/svg+xml', 'ico': 'image/x-icon', 'bmp': 'image/bmp', 'tif': 'image/tiff',
        'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'ogg': 'audio/ogg', 'm4a': 'audio/mp4', 'flac': 'audio/flac', 'aac': 'audio/aac',
        'mp4': 'video/mp4', 'webm': 'video/webm', 'mov': 'video/quicktime',
        'pdf': 'application/pdf',
        'txt': 'text/plain', 'md': 'text/markdown', 'json': 'application/json', 'js': 'application/javascript', 'html': 'text/html', 'css': 'text/css', 'py': 'text/x-python'
    };
    
    const getAllTextExtensions = () => [].concat(...[fileTypeGroups.Text, fileTypeGroups.Code, fileTypeGroups.Config, fileTypeGroups.Data]);
    const getMimeType = (ext) => mimeTypes[ext] || 'application/octet-stream';

    // --- HELPER FUNCTIONS ---
    const getFileCategory = (ext) => {
        if (fileTypeGroups.Image.includes(ext)) return 'image';
        if (fileTypeGroups.Audio.includes(ext)) return 'audio';
        if (fileTypeGroups.Video.includes(ext)) return 'video';
        if (fileTypeGroups.Document.includes(ext) && ext === 'pdf') return 'pdf';
        if (getAllTextExtensions().includes(ext)) return 'text';
        return 'unknown';
    };

    const getFileIcon = (ext) => {
        const category = getFileCategory(ext);
        return ({
            'image': 'image',
            'audio': 'audiotrack',
            'video': 'videocam',
            'pdf': 'picture_as_pdf',
            'text': 'article'
        })[category] || 'insert_drive_file';
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (!bytes || bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    const triggerDownload = (fileName, blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
    
    // --- UI INITIALIZATION & EVENT LISTENERS ---
    const populateSupportedTypes = () => {
        for (const groupName in fileTypeGroups) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'type-category';
            const heading = document.createElement('h4');
            heading.textContent = groupName;
            const list = document.createElement('ul');
            
            fileTypeGroups[groupName].sort().forEach(ext => {
                const item = document.createElement('li');
                item.textContent = `.${ext}`;
                list.appendChild(item);
            });
            categoryDiv.append(heading, list);
            supportedTypesList.appendChild(categoryDiv);
        }
    };
    
    zipInput.addEventListener('change', handleFileSelect);
    selectAllCheckbox.addEventListener('change', handleSelectAll);
    downloadSelectedBtn.addEventListener('click', handleDownloadSelected);
    populateSupportedTypes();

    // --- DOWNLOAD AND SELECTION LOGIC ---
    function updateDownloadButtonState() {
        const anySelected = fileTreeContainer.querySelector('input[type="checkbox"]:checked');
        downloadSelectedBtn.disabled = !anySelected;
    }

    function handleSelectAll(event) {
        const checkboxes = fileTreeContainer.querySelectorAll('.tree-item input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = event.target.checked;
        });
        updateDownloadButtonState();
    }

    async function handleDownloadSelected() {
        downloadSelectedBtn.disabled = true;
        downloadSelectedBtn.querySelector('.material-icons').textContent = 'hourglass_top';
        const newZip = new JSZip();
        const selectedCheckboxes = fileTreeContainer.querySelectorAll('.tree-item.is-file input[type="checkbox"]:checked');
        
        for (const checkbox of selectedCheckboxes) {
            const path = checkbox.dataset.path;
            if (path && currentZip && currentZip.files[path]) {
                const file = currentZip.files[path];
                if (!file.dir) {
                    const data = await file.async('blob');
                    newZip.file(path, data);
                }
            }
        }

        newZip.generateAsync({ type: 'blob' })
            .then(blob => {
                triggerDownload('selection.zip', blob);
                downloadSelectedBtn.disabled = false;
                downloadSelectedBtn.querySelector('.material-icons').textContent = 'archive';
            });
    }

    function handleSingleDownload(path) {
        if (currentZip && currentZip.files[path]) {
            currentZip.files[path].async('blob').then(blob => {
                triggerDownload(path.split('/').pop(), blob);
            });
        }
    }

    // --- FILE PREVIEW AND RENDERING LOGIC ---
    const renderHexDump = (arrayBuffer) => {
        fileContentDisplay.innerHTML = '';
        const hexViewer = document.createElement('div');
        hexViewer.className = 'hex-viewer';
        const bytes = new Uint8Array(arrayBuffer);
        for (let i = 0; i < bytes.length; i += 16) {
            const row = hexRowTemplate.content.cloneNode(true).firstElementChild;
            const chunk = bytes.slice(i, i + 16);
            row.querySelector('.hex-offset').textContent = i.toString(16).padStart(8, '0');
            let hex = [];
            let ascii = '';
            for (let j = 0; j < 16; j++) {
                if (j < chunk.length) {
                    const byte = chunk[j];
                    hex.push(byte.toString(16).padStart(2, '0'));
                    ascii += (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.';
                } else {
                    hex.push('  ');
                }
                if (j === 7) hex.push('');
            }
            row.querySelector('.hex-data').textContent = hex.join(' ');
            row.querySelector('.hex-ascii').textContent = ascii;
            hexViewer.appendChild(row);
        }
        fileContentDisplay.appendChild(hexViewer);
    };

    const showSourceCode = (fileEntry) => {
        fileEntry.async('string').then(content => {
            previewControls.innerHTML = '';
            previewControls.classList.remove('hidden');
            const renderBtn = document.createElement('button');
            renderBtn.className = 'preview-btn';
            renderBtn.innerHTML = `<i class="material-icons">visibility</i> Render HTML (Sandboxed)`;
            renderBtn.onclick = () => renderHtmlPreview(content, fileEntry);
            previewControls.appendChild(renderBtn);

            const pre = document.createElement('pre');
            pre.textContent = content;
            fileContentDisplay.innerHTML = '';
            fileContentDisplay.appendChild(pre);
        });
    };

    const renderHtmlPreview = (content, fileEntry) => {
        if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
        previewControls.innerHTML = '';
        previewControls.classList.remove('hidden');
        const codeBtn = document.createElement('button');
        codeBtn.className = 'preview-btn';
        codeBtn.innerHTML = `<i class="material-icons">code</i> Show Code`;
        codeBtn.onclick = () => showSourceCode(fileEntry);
        previewControls.appendChild(codeBtn);

        const iframe = document.createElement('iframe');
        iframe.sandbox = 'allow-same-origin';
        const typedBlob = new Blob([content], { type: 'text/html' });
        currentObjectUrl = URL.createObjectURL(typedBlob);
        iframe.src = currentObjectUrl;
        fileContentDisplay.innerHTML = '';
        fileContentDisplay.appendChild(iframe);
    };

    const displayFileContent = (fileEntry) => {
        if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
        fileContentDisplay.innerHTML = `<span class="placeholder">Loading...</span>`;
        previewControls.innerHTML = '';
        previewControls.classList.add('hidden');
        const fileName = fileEntry.name;
        const extension = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
        const category = getFileCategory(extension);
        const isLikelyText = category === 'text';

        if (extension === 'html') {
            showSourceCode(fileEntry);
        } else if (['image', 'audio', 'video', 'pdf'].includes(category)) {
            fileEntry.async('blob').then(blob => {
                const mimeType = getMimeType(extension);
                const typedBlob = new Blob([blob], { type: mimeType });
                currentObjectUrl = URL.createObjectURL(typedBlob);
                let element;
                switch (category) {
                    case 'image': element = document.createElement('img'); element.src = currentObjectUrl; break;
                    case 'audio': element = document.createElement('audio'); element.src = currentObjectUrl; element.controls = true; break;
                    case 'video': element = document.createElement('video'); element.src = currentObjectUrl; element.controls = true; break;
                    case 'pdf': fileContentDisplay.innerHTML = `<span class="placeholder">PDF preview is restricted by the security policy.<br><a href="${currentObjectUrl}" download="${fileName}">Download ${fileName}</a></span>`; return;
                }
                fileContentDisplay.innerHTML = '';
                fileContentDisplay.appendChild(element);
            }).catch(err => { fileContentDisplay.innerHTML = `<span class="placeholder">Error loading preview: ${err.message}</span>`; });
        } else if (isLikelyText) {
            fileEntry.async('string').then(content => { const pre = document.createElement('pre'); pre.textContent = content; fileContentDisplay.innerHTML = ''; fileContentDisplay.appendChild(pre); }).catch(err => { fileContentDisplay.innerHTML = `<span class="placeholder">Error reading file: ${err.message}</span>`; });
        } else {
            fileEntry.async('arraybuffer').then(renderHexDump).catch(err => { fileContentDisplay.innerHTML = `<span class="placeholder">Error reading file: ${err.message}</span>`; });
        }
    };
    
    const renderTree = (zip) => {
        fileTreeContainer.innerHTML = '';
        const root = document.createDocumentFragment();
        const directories = {};

        const sortedFilePaths = Object.keys(zip.files).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        for (const path of sortedFilePaths) {
            const file = zip.files[path];
            if (file.dir) continue;

            const pathParts = file.name.split('/').filter(p => p);
            const fileName = pathParts.pop();
            let currentPathPrefix = '';
            let parentNode = root;

            for (const part of pathParts) {
                currentPathPrefix += part + '/';
                if (!directories[currentPathPrefix]) {
                    const folderDiv = document.createElement('div');
                    folderDiv.className = 'tree-folder collapsed';
                    const header = document.createElement('div');
                    header.className = 'tree-folder-header tree-item';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.addEventListener('change', (e) => {
                        folderDiv.querySelectorAll('.tree-folder-content input[type="checkbox"]').forEach(child => child.checked = e.target.checked);
                        updateDownloadButtonState();
                    });

                    const nameContainer = document.createElement('div');
                    nameContainer.className = 'file-name-container';
                    const icon = document.createElement('i');
                    icon.className = 'material-icons icon';
                    icon.textContent = 'folder';
                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'file-name';
                    nameSpan.textContent = part;
                    nameContainer.append(icon, nameSpan);
                    nameContainer.onclick = () => {
                        folderDiv.classList.toggle('collapsed');
                        icon.textContent = folderDiv.classList.contains('collapsed') ? 'folder' : 'folder_open';
                    };
                    
                    header.append(checkbox, nameContainer);
                    const content = document.createElement('div');
                    content.className = 'tree-folder-content';
                    folderDiv.append(header, content);
                    parentNode.appendChild(folderDiv);
                    directories[currentPathPrefix] = content;
                }
                parentNode = directories[currentPathPrefix];
            }
            
            const extension = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
            const fileDiv = document.createElement('div');
            fileDiv.className = 'tree-item is-file';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.dataset.path = file.name;
            checkbox.addEventListener('change', updateDownloadButtonState);

            const nameContainer = document.createElement('div');
            nameContainer.className = 'file-name-container';
            const icon = document.createElement('i');
            icon.className = 'material-icons icon';
            icon.textContent = getFileIcon(extension);
            const nameSpan = document.createElement('span');
            nameSpan.className = 'file-name';
            nameSpan.textContent = fileName;
            nameContainer.onclick = () => {
                if (activeFileElement) activeFileElement.classList.remove('active');
                fileDiv.classList.add('active');
                activeFileElement = fileDiv;
                displayFileContent(file);
            };

            const sizeSpan = document.createElement('span');
            sizeSpan.className = 'file-size';
            sizeSpan.textContent = formatBytes(file._data.uncompressedSize);
            
            const downloadIcon = document.createElement('i');
            downloadIcon.className = 'material-icons download-icon';
            downloadIcon.textContent = 'file_download';
            downloadIcon.title = 'Download file';
            downloadIcon.onclick = (e) => {
                e.stopPropagation();
                handleSingleDownload(file.name);
            };
            
            nameContainer.append(icon, nameSpan);
            fileDiv.append(checkbox, nameContainer, sizeSpan, downloadIcon);
            parentNode.appendChild(fileDiv);
        }
        fileTreeContainer.appendChild(root);
    };

    function handleFileSelect(event) {
        const file = event.target.files && event.target.files.length > 0 ? event.target.files[0] : null;
        if (!file) { return; }
        
        zipContentsContainer.classList.remove('hidden');
        fileTreeContainer.innerHTML = '<i>Processing zip file...</i>';
        fileContentDisplay.innerHTML = '<span class="placeholder">Select a file from the tree above to view its content.</span>';
        previewControls.classList.add('hidden');
        selectAllCheckbox.checked = false;
        if (activeFileElement) activeFileElement.classList.remove('active');
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (typeof JSZip === 'undefined') { throw new Error('Zip library not loaded.'); }
                JSZip.loadAsync(e.target.result).then(zip => {
                    currentZip = zip;
                    renderTree(zip);
                    updateDownloadButtonState();
                }).catch(err => {
                    fileTreeContainer.textContent = `Error processing Zip: ${err.message}`;
                });
            } catch (err) {
                fileTreeContainer.textContent = `A critical error occurred: ${err.message}`;
            }
        };
        reader.onerror = () => {
            fileTreeContainer.textContent = 'Error reading the selected file.';
        };
        reader.readAsArrayBuffer(file);
    };
});