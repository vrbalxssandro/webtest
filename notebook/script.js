// --- DOM Elements ---
const editor = document.getElementById('editor');
const toolbar = document.getElementById('toolbar');
const themeBtn = document.getElementById('theme-btn');
const focusBtn = document.getElementById('focus-btn');
const newPageBtn = document.getElementById('new-page-btn');
const downloadBtn = document.getElementById('download-btn');
const powerToolsBtn = document.getElementById('power-tools-btn');
const powerToolsMenu = document.getElementById('power-tools-menu');
const wordCountEl = document.getElementById('word-count');
const charCountEl = document.getElementById('char-count');
const paragraphCountEl = document.getElementById('paragraph-count');
const readingTimeEl = document.getElementById('reading-time');
const sessionTimerEl = document.getElementById('session-timer');
const body = document.body;

// --- State & Config ---
const LOCAL_STORAGE_KEY = 'paper.content';
const THEME_KEY = 'paper.theme';
const FOCUS_KEY = 'paper.focus';
const THEMES = ['theme-paper', 'theme-dusk', 'theme-blueprint'];
const COLORS = { text: ['#3a352f', '#c2beb8', '#e56d6d', '#6da2e5', '#6de58e'], highlight: ['#d9c8b3', '#4a4446', '#e6d6d44', '#6da2e544', '#6de58e44'] };
let currentThemeIndex = 0;
let isFocusMode = true;
let sessionStartTime = Date.now();
powerToolsBtn.innerHTML = `<img src="./assets/power-tools.svg" alt="Power Tools">`;


// --- FINAL, CORRECTED GDPR-Compliant Visit Logging for Notebook ---
const NOTEBOOK_VISIT_API_ENDPOINT = '/api/notebook/visit';
const NOTEBOOK_VISIT_SESSION_KEY = 'notebook_visit_pinged';
// CRUCIAL: Use the *same* key as the main homepage script to share consent.
const CONSENT_LOCALSTORAGE_KEY = 'gdpr_consent_choice_v1';

// This function sends the ping. It is only called if consent is given.
async function pingNotebookVisit() {
    if (sessionStorage.getItem(NOTEBOOK_VISIT_SESSION_KEY)) {
        console.log("Notebook visit already logged for this session.");
        return;
    }
    try {
        await fetch(NOTEBOOK_VISIT_API_ENDPOINT, { method: 'POST' });
        sessionStorage.setItem(NOTEBOOK_VISIT_SESSION_KEY, 'true');
        console.log("SUCCESS: Notebook visit ping sent.");
    } catch (error) {
        console.error("Could not ping notebook visit:", error);
    }
}

// This is the key function that checks for consent BEFORE deciding to ping.
function handleNotebookTracking() {
    const consent = localStorage.getItem(CONSENT_LOCALSTORAGE_KEY);

    // Added for debugging so you can see exactly what the script is doing.
    console.log(`Notebook Page: Checking consent. Value for '${CONSENT_LOCALSTORAGE_KEY}' is:`, consent);

    // This is the corrected, strict check.
    if (consent === 'accepted') {
        console.log("Consent is 'accepted'. Proceeding with visit ping.");
        pingNotebookVisit();
    } else {
        // This block will now correctly execute if consent is 'declined' or has not been set (null).
        console.log("Consent is not 'accepted'. Visit will not be logged.");
    }
}


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    initializeToolbar();
    setupEventListeners();
    updateAll();
    setInterval(updateSessionTimer, 1000);
    // This is the only tracking-related call in the initialization.
    handleNotebookTracking();
});

// --- Core Functions (No changes below this line) ---

function loadState() {
    const savedContent = localStorage.getItem(LOCAL_STORAGE_KEY);
    editor.innerHTML = savedContent || `<h1>Welcome to Paper</h1><p>Select text to see the formatting toolbar. Use Markdown-like shortcuts like ## or * to format as you type.</p>`;
    const savedTheme = localStorage.getItem(THEME_KEY);
    currentThemeIndex = savedTheme ? THEMES.indexOf(savedTheme) : 0;
    const savedFocus = localStorage.getItem(FOCUS_KEY);
    isFocusMode = savedFocus !== null ? JSON.parse(savedFocus) : true;
}
function saveState() {
    localStorage.setItem(LOCAL_STORAGE_KEY, editor.innerHTML);
    localStorage.setItem(THEME_KEY, THEMES[currentThemeIndex]);
    localStorage.setItem(FOCUS_KEY, isFocusMode);
}
function updateAll() {
    updateFocus();
    updateStats();
    applyTheme();
    applyFocusMode();
}
function initializeToolbar() {
    COLORS.text.forEach(color => createColorPicker(color, 'foreColor'));
    COLORS.highlight.forEach(color => createColorPicker(color, 'hiliteColor', true));
}
function createColorPicker(color, command, isHighlight = false) {
    const picker = document.createElement('button');
    picker.className = 'color-picker';
    picker.style.backgroundColor = color;
    picker.dataset.command = command;
    picker.dataset.value = color;
    toolbar.appendChild(picker);
}
function showToolbar() {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) {
        toolbar.classList.remove('visible');
        return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    toolbar.style.top = `${window.scrollY + rect.top - toolbar.offsetHeight - 10}px`;
    toolbar.style.left = `${window.scrollX + rect.left + (rect.width / 2) - (toolbar.offsetWidth / 2)}px`;
    toolbar.classList.add('visible');
    updateToolbarState();
}
function updateToolbarState() {
    const buttons = toolbar.querySelectorAll('button[data-command]');
    buttons.forEach(button => {
        const command = button.dataset.command;
        const value = button.dataset.value;
        if (document.queryCommandState(command) || (value && document.queryCommandValue(command).includes(value))) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}
function execCommand(command, value = null) {
    document.execCommand(command, false, value);
    editor.focus();
    showToolbar();
    saveState();
}
function updateStats() {
    const text = editor.innerText;
    const charCount = text.length;
    const words = text.trim().match(/\s+/g);
    const wordCount = words ? words.length + 1 : (text.trim().length > 0 ? 1 : 0);
    const paragraphs = editor.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
    wordCountEl.textContent = `${wordCount} words`;
    charCountEl.textContent = `${charCount} characters`;
    paragraphCountEl.textContent = `${paragraphs.length} paragraphs`;
    readingTimeEl.textContent = `~${Math.ceil(wordCount / 200)} min read`;
}
function updateSessionTimer() {
    if (document.visibilityState === 'visible') {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
        const seconds = String(elapsed % 60).padStart(2, '0');
        sessionTimerEl.textContent = `Focus: ${minutes}:${seconds}`;
    }
}
function applyTheme() {
    body.className = '';
    body.classList.add(THEMES[currentThemeIndex]);
    if (isFocusMode) body.classList.add('focus-active');
}
function applyFocusMode() {
    focusBtn.classList.toggle('active', isFocusMode);
    body.classList.toggle('focus-active', isFocusMode);
}
function updateFocus() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    let currentNode = selection.anchorNode;
    while (currentNode && currentNode !== editor) {
        if (['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(currentNode.nodeName)) {
            editor.querySelectorAll('.focused').forEach(el => el.classList.remove('focused'));
            currentNode.classList.add('focused');
            return;
        }
        currentNode = currentNode.parentNode;
    }
}
const powerTools = {
    removeNewlines: () => { editor.innerHTML = `<p>${editor.innerText.replace(/\n/g, ' ')}</p>`; },
    toLowerCase: () => { execCommand('insertHTML', document.getSelection().toString().toLowerCase()); },
    toUpperCase: () => { execCommand('insertHTML', document.getSelection().toString().toUpperCase()); },
    prettifyJson: () => { try { const selectedText = document.getSelection().toString(); const prettyJson = JSON.stringify(JSON.parse(selectedText), null, 2); execCommand('insertHTML', `<pre><code>${prettyJson}</code></pre>`); } catch (e) { alert('Invalid JSON selected.'); } },
    sortLines: () => { const lines = editor.innerText.split('\n').filter(line => line.trim() !== ''); lines.sort(); editor.innerHTML = lines.map(line => `<p>${line}</p>`).join(''); }
};
function setupEventListeners() {
    editor.addEventListener('input', () => { handleMarkdownShortcuts(); updateAll(); saveState(); });
    document.addEventListener('selectionchange', showToolbar);
    editor.addEventListener('click', updateFocus);
    editor.addEventListener('keyup', updateFocus);
    editor.addEventListener('paste', handlePaste);
    toolbar.addEventListener('click', e => { const button = e.target.closest('button[data-command]'); if (button) { execCommand(button.dataset.command, button.dataset.value || null); } });
    themeBtn.addEventListener('click', () => { currentThemeIndex = (currentThemeIndex + 1) % THEMES.length; applyTheme(); saveState(); });
    focusBtn.addEventListener('click', () => { isFocusMode = !isFocusMode; applyFocusMode(); saveState(); });
    newPageBtn.addEventListener('click', () => { if (confirm('Are you sure? This will delete all content.')) { editor.innerHTML = '<p><br></p>'; updateAll(); saveState(); } });
    downloadBtn.addEventListener('click', () => { const blob = new Blob([editor.innerText], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'paper-export.txt'; a.click(); URL.revokeObjectURL(url); });
    powerToolsBtn.addEventListener('click', () => powerToolsMenu.classList.toggle('hidden'));
    powerToolsMenu.addEventListener('click', e => { const button = e.target.closest('button[data-tool]'); if (button && powerTools[button.dataset.tool]) { powerTools[button.dataset.tool](); powerToolsMenu.classList.add('hidden'); saveState(); } });
    document.addEventListener('click', e => { if (!powerToolsBtn.contains(e.target) && !powerToolsMenu.contains(e.target)) { powerToolsMenu.classList.add('hidden'); } if (!toolbar.contains(e.target) && window.getSelection().isCollapsed) { toolbar.classList.remove('visible'); } });
    document.addEventListener('keydown', e => { if (e.altKey) { e.preventDefault(); switch (e.key.toLowerCase()) { case 't': themeBtn.click(); break; case 'f': focusBtn.click(); break; case 'n': newPageBtn.click(); break; case 'd': downloadBtn.click(); break; case 'p': powerToolsBtn.click(); break; } } });
}
function handlePaste(e) {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    const selection = window.getSelection();
    if (!selection.isCollapsed && /^(https?:\/\/|www\.)/.test(text)) { execCommand('createLink', text); } else { execCommand('insertText', text); }
}
function handleMarkdownShortcuts() {
    const selection = window.getSelection();
    if (!selection.rangeCount || !selection.isCollapsed) return;
    const node = selection.focusNode;
    if (node.nodeType !== Node.TEXT_NODE) return;
    const text = node.textContent;
    const patterns = { '## ': 'h2', '### ': 'h3', '> ': 'blockquote', '* ': 'insertUnorderedList', '```': 'insertHTML', };
    for (const pattern in patterns) { if (text.startsWith(pattern)) { const command = patterns[pattern]; const range = document.createRange(); range.setStart(node, 0); range.setEnd(node, pattern.length); selection.removeAllRanges(); selection.addRange(range); if (command === 'insertHTML') { execCommand(command, '<pre><code></code></pre>'); } else { execCommand('formatBlock', command); } return; } }
}