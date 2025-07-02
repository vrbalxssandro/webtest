// --- DOM Elements ---
const editor = document.getElementById('editor');
const themeBtn = document.getElementById('theme-btn');
const focusBtn = document.getElementById('focus-btn');
const newPageBtn = document.getElementById('new-page-btn');
const downloadBtn = document.getElementById('download-btn');
const wordCountEl = document.getElementById('word-count');
const charCountEl = document.getElementById('char-count');
const body = document.body;

// --- State ---
const LOCAL_STORAGE_KEY = 'paper.content';
const THEME_KEY = 'paper.theme';
const FOCUS_KEY = 'paper.focus';
const THEMES = ['theme-paper', 'theme-dusk', 'theme-blueprint'];
let currentThemeIndex = 0;
let isFocusMode = true;

const keySoundPaths = [
    './assets/key1.wav',
    './assets/key2.wav',
    './assets/key3.wav',
    './assets/key4.wav',
];
const keySounds = keySoundPaths.map(path => new Audio(path));
let lastSoundIndex = -1;

// --- Functions ---

/**
 * Saves content, theme, and focus mode state to local storage.
 */
function saveState() {
    localStorage.setItem(LOCAL_STORAGE_KEY, editor.innerHTML);
    localStorage.setItem(THEME_KEY, THEMES[currentThemeIndex]);
    localStorage.setItem(FOCUS_KEY, isFocusMode);
}

/**
 * Loads all state from local storage and applies it.
 */
function loadState() {
    // Load Content
    const savedContent = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedContent) {
        editor.innerHTML = savedContent;
    } else {
        editor.innerHTML = `<h1>Welcome to Paper</h1><p>This is your minimalist, distraction-free writing space. Your work is saved automatically in your browser.</p><p>Use the controls in the bottom-left corner to change the theme, toggle focus mode, or start a new page. Happy writing.</p>`;
    }

    // Load Theme
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme && THEMES.includes(savedTheme)) {
        currentThemeIndex = THEMES.indexOf(savedTheme);
        applyTheme();
    }

    // Load Focus Mode
    const savedFocus = localStorage.getItem(FOCUS_KEY);
    if (savedFocus !== null) {
        isFocusMode = JSON.parse(savedFocus);
        applyFocusMode();
    }
}

function playKeystrokeSound() {
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * keySounds.length);
    } while (randomIndex === lastSoundIndex && keySounds.length > 1);
    
    const sound = keySounds[randomIndex];
    sound.currentTime = 0;
    sound.play().catch(e => console.error("Error playing sound:", e)); // Prevent promise rejection errors
    
    lastSoundIndex = randomIndex;
}

function updateFocus() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    let currentNode = selection.anchorNode;
    let currentParagraph = null;

    while (currentNode && currentNode !== editor) {
        if (currentNode.nodeName === 'P' || /^H[1-6]$/.test(currentNode.nodeName)) {
            currentParagraph = currentNode;
            break;
        }
        currentNode = currentNode.parentNode;
    }
    
    const elements = editor.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
    elements.forEach(el => el.classList.remove('focused'));

    if (currentParagraph) {
        currentParagraph.classList.add('focused');
    }
}

/**
 * Calculates and displays the word and character count.
 */
function updateStats() {
    const text = editor.innerText;
    const charCount = text.length;
    // Match words (sequences of non-space characters)
    const words = text.trim().match(/\s+/g);
    const wordCount = words ? words.length + 1 : (text.trim().length > 0 ? 1 : 0);
    
    wordCountEl.textContent = `${wordCount} words`;
    charCountEl.textContent = `${charCount} characters`;
}

/**
 * Applies the current theme class to the body.
 */
function applyTheme() {
    body.className = ''; // Clear all classes
    body.classList.add(THEMES[currentThemeIndex]);
    if (isFocusMode) {
        body.classList.add('focus-active');
    }
}

/**
 * Applies or removes the focus mode class and updates the button state.
 */
function applyFocusMode() {
    if (isFocusMode) {
        body.classList.add('focus-active');
        focusBtn.classList.add('active');
    } else {
        body.classList.remove('focus-active');
        focusBtn.classList.remove('active');
    }
}

/**
 * Handles clearing the editor for a new page.
 */
function handleNewPage() {
    if (confirm('Are you sure you want to start a new page? Your current content will be deleted.')) {
        editor.innerHTML = '<p><br></p>'; // Start with an empty paragraph
        saveState();
        updateStats();
        editor.focus();
    }
}

/**
 * Handles downloading the content as a .txt file.
 */
function handleDownload() {
    const textContent = editor.innerText;
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paper-export-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}


// --- Event Listeners ---

editor.addEventListener('keydown', (e) => {
    if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
        playKeystrokeSound();
    }
});

// Use 'input' event for more reliable updates on paste, cut, etc.
editor.addEventListener('input', () => {
    updateFocus();
    updateStats();
    saveState();
});

editor.addEventListener('click', updateFocus);

themeBtn.addEventListener('click', () => {
    currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
    applyTheme();
    saveState();
});

focusBtn.addEventListener('click', () => {
    isFocusMode = !isFocusMode;
    applyFocusMode();
    saveState();
});

newPageBtn.addEventListener('click', handleNewPage);
downloadBtn.addEventListener('click', handleDownload);

// Keyboard shortcuts for controls
document.addEventListener('keydown', (e) => {
    if (e.altKey) {
        switch(e.key.toLowerCase()){
            case 't': e.preventDefault(); themeBtn.click(); break;
            case 'f': e.preventDefault(); focusBtn.click(); break;
            case 'n': e.preventDefault(); newPageBtn.click(); break;
            case 'd': e.preventDefault(); downloadBtn.click(); break;
        }
    }
});

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    updateFocus();
    updateStats();
});