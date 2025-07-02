/**
 * Main script for the interactive homepage.
 * This script is structured into modules for clarity and maintainability.
 */

// -------------------
// CONFIGURATION
// -------------------
const config = {
    PROJECTS: [
        { title: 'My Cool Game', description: 'A fun platformer game built with JavaScript.', image: './images/project-a-thumb.png', url: './my-cool-game/' },
        { title: 'Another Project', description: 'This is another one of my awesome projects.', image: './images/placeholder.png', url: '#' }
    ],
    API_ENDPOINTS: {
        comments: '/api/comments',
        visitSummary: '/api/visits/summary',
        visitActivity: '/api/visits/activity',
        pingVisit: '/api/visit'
    },
    REFRESH_INTERVAL: 60000 // 1 minute in milliseconds
};

// -------------------
// DOM ELEMENTS
// -------------------
const dom = {
    kaomojiCursor: document.getElementById('kaomoji-cursor'),
    projectGrid: document.getElementById('project-grid'),
    timeline: document.getElementById('timeline'),
    postButton: document.getElementById('post-button'),
    usernameInput: document.getElementById('username-input'),
    commentInput: document.getElementById('comment-input'),
    visitsCountEl: document.getElementById('visits-count'),
    postsCountEl: document.getElementById('posts-count'),
    visitsBox: document.getElementById('visits-box'),
    mapModal: document.getElementById('map-modal'),
    closeModalButton: document.querySelector('#map-modal .close-button'),
    mapContainer: document.getElementById('map-container'),
    activityChartCanvas: document.getElementById('recent-activity-chart'),
    cursorToggleBtn: document.getElementById('cursor-toggle-btn'),
    // NEW Music Player Elements
    musicPlayerContainer: document.getElementById('music-player-container'),
    waveformContainer: document.getElementById('waveform'),
    waveformLoading: document.getElementById('waveform-loading'),
    playBtn: document.getElementById('play-btn'),
    volumeSlider: document.getElementById('volume-slider'),
    volumeIcon: document.getElementById('volume-icon'),
    audioUpload: document.getElementById('audio-upload'),
    trackTitle: document.getElementById('track-title'),
    timeCurrent: document.getElementById('time-current'),
    timeTotal: document.getElementById('time-total')
};

// -------------------
// API CALLS
// -------------------
const api = {
    async pingVisit() {
        try {
            await fetch(config.API_ENDPOINTS.pingVisit, { method: 'POST' });
        } catch (error) {
            console.error("Could not ping visit:", error);
        }
    },
    async fetchVisitSummary() {
        try {
            const response = await fetch(config.API_ENDPOINTS.visitSummary);
            if (!response.ok) throw new Error('Could not fetch visit summary');
            return await response.json();
        } catch (error) {
            console.error("Could not fetch total visits:", error);
            return { total_visits: 0, countries: {} };
        }
    },
    async fetchActivityData() {
        try {
            const response = await fetch(config.API_ENDPOINTS.visitActivity);
            if (!response.ok) throw new Error('Could not fetch activity');
            return await response.json();
        } catch (error) {
            console.error("Error fetching activity data:", error);
            return [];
        }
    },
    async fetchComments() {
        try {
            const response = await fetch(config.API_ENDPOINTS.comments);
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching comments:', error);
            if (dom.timeline) dom.timeline.innerHTML = '<p class="loading-message">Could not load comments.</p>';
            return [];
        }
    },
    async postComment(username, message) {
        const response = await fetch(config.API_ENDPOINTS.comments, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, message })
        });
        if (!response.ok) throw new Error('Failed to post comment.');
    }
};

// -------------------
// UI UPDATES
// -------------------
const ui = {
    activityChartInstance: null,
    setupKaomojiCursor() { if (!dom.kaomojiCursor) return; window.addEventListener('mousemove', e => { dom.kaomojiCursor.style.left = `${e.clientX}px`; dom.kaomojiCursor.style.top = `${e.clientY}px`; }); document.body.addEventListener('mousedown', () => { dom.kaomojiCursor.textContent = '(>ω<)'; }); document.body.addEventListener('mouseup', () => { dom.kaomojiCursor.textContent = '(´• ω •`)'; }); },
    renderProjects(projects) { if (!dom.projectGrid) return; dom.projectGrid.innerHTML = ''; projects.forEach(project => { const card = document.createElement('a'); card.href = project.url; card.className = 'project-card'; card.innerHTML = `<img src="${project.image}" alt="${project.title} thumbnail"><div class="project-card-content"><h3>${escapeHTML(project.title)}</h3><p>${escapeHTML(project.description)}</p></div>`; dom.projectGrid.appendChild(card); }); },
    renderComments(comments) { if (!dom.timeline || !dom.postsCountEl) return; dom.timeline.innerHTML = ''; if (comments.length === 0) { dom.timeline.innerHTML = '<p class="loading-message">No comments yet. Be the first!</p>'; } else { comments.forEach(c => { const el = document.createElement('div'); el.className = 'comment'; el.innerHTML = `<div class="comment-header"><span class="comment-user">${escapeHTML(c.username)}</span><span class="comment-time">${formatTimeAgo(c.timestamp)}</span></div><p class="comment-message">${escapeHTML(c.message)}</p>`; dom.timeline.appendChild(el); }); } dom.postsCountEl.textContent = comments.length.toLocaleString(); },
    drawActivityChart(timestamps) { if (!dom.activityChartCanvas) return; const now = Date.now(); const numBuckets = 30; const bucketSize = 60 * 1000; const buckets = new Array(numBuckets).fill(0); const labels = new Array(numBuckets).fill(''); labels[0] = '30m ago'; labels[14] = '15m ago'; labels[29] = 'Now'; for (const ts of timestamps) { const timeAgo = now - new Date(ts).getTime(); if (timeAgo >= 0 && timeAgo < numBuckets * bucketSize) { const bucketIndex = Math.floor(timeAgo / bucketSize); buckets[numBuckets - 1 - bucketIndex]++; } } if (this.activityChartInstance) this.activityChartInstance.destroy(); const ctx = dom.activityChartCanvas.getContext('2d'); this.activityChartInstance = new Chart(ctx, { type: 'bar', data: { labels: labels, datasets: [{ data: buckets, backgroundColor: 'rgba(211, 143, 186, 0.8)', borderWidth: 0, borderRadius: 2, barPercentage: 1.0, categoryPercentage: 1.0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: true } }, scales: { y: { display: true, beginAtZero: true, ticks: { color: 'rgba(240, 230, 232, 0.5)', precision: 0 }, grid: { color: 'rgba(240, 230, 232, 0.1)' }, title: { display: true, text: 'Visits', color: 'rgba(240, 230, 232, 0.7)' }, suggestedMax: Math.max(...buckets, 5) }, x: { display: true, ticks: { color: 'rgba(240, 230, 232, 0.5)', autoSkip: false, maxRotation: 0, minRotation: 0 }, grid: { display: false } } } } }); },
    showVisitorMap(visitData) { if (!dom.mapModal || !dom.mapContainer) return; document.body.classList.add('modal-open'); dom.mapModal.classList.add('visible'); dom.mapContainer.innerHTML = ''; const countryData = visitData.countries || {}; if (Object.keys(countryData).length === 0) { dom.mapContainer.innerHTML = '<p>No visitor data yet! Be the first.</p>'; return; } const mapFills = { defaultFill: '#3a2e33' }; const dataset = {}; const counts = Object.values(countryData); const maxCount = Math.max(...counts, 1); const palette = chroma.scale(['#c979a8', '#f0e6e8']).domain([0, maxCount]); for (const [code2, count] of Object.entries(countryData)) { const code3 = countryCodeMap[code2]; if (code3) { mapFills[code3] = palette(count).hex(); dataset[code3] = { fillKey: code3, visitCount: count }; } } new Datamap({ element: dom.mapContainer, projection: 'mercator', fills: mapFills, data: dataset, geographyConfig: { borderColor: '#2b2125', highlightFillColor: '#d38fba', highlightBorderColor: 'rgba(0, 0, 0, 0.2)', popupTemplate: (geo, data) => `<div class="hoverinfo"><strong>${geo.properties.name}</strong><br>Visits: <span class="popup-visits-count">${data ? data.visitCount : 0}</span></div>` } }); },
    updateVisitCount(count) { if (dom.visitsCountEl) dom.visitsCountEl.textContent = count.toLocaleString(); }
};

// -------------------
// HELPER FUNCTIONS
// -------------------
const countryCodeMap = { 'AF': 'AFG', 'AX': 'ALA', 'AL': 'ALB', 'DZ': 'DZA', 'AS': 'ASM', 'AD': 'AND', 'AO': 'AGO', 'AI': 'AIA', 'AQ': 'ATA', 'AG': 'ATG', 'AR': 'ARG', 'AM': 'ARM', 'AW': 'ABW', 'AU': 'AUS', 'AT': 'AUT', 'AZ': 'AZE', 'BS': 'BHS', 'BH': 'BHR', 'BD': 'BGD', 'BB': 'BRB', 'BY': 'BLR', 'BE': 'BEL', 'BZ': 'BLZ', 'BJ': 'BEN', 'BM': 'BMU', 'BT': 'BTN', 'BO': 'BOL', 'BQ': 'BES', 'BA': 'BIH', 'BW': 'BWA', 'BV': 'BVT', 'BR': 'BRA', 'IO': 'IOT', 'BN': 'BRN', 'BG': 'BGR', 'BF': 'BFA', 'BI': 'BDI', 'CV': 'CPV', 'KH': 'KHM', 'CM': 'CMR', 'CA': 'CAN', 'KY': 'CYM', 'CF': 'CAF', 'TD': 'TCD', 'CL': 'CHL', 'CN': 'CHN', 'CX': 'CXR', 'CC': 'CCK', 'CO': 'COL', 'KM': 'COM', 'CG': 'COG', 'CD': 'COD', 'CK': 'COK', 'CR': 'CRI', 'CI': 'CIV', 'HR': 'HRV', 'CU': 'CUB', 'CW': 'CUW', 'CY': 'CYP', 'CZ': 'CZE', 'DK': 'DNK', 'DJ': 'DJI', 'DM': 'DMA', 'DO': 'DOM', 'EC': 'ECU', 'EG': 'EGY', 'SV': 'SLV', 'GQ': 'GNQ', 'ER': 'ERI', 'EE': 'EST', 'SZ': 'SWZ', 'ET': 'ETH', 'FK': 'FLK', 'FO': 'FRO', 'FJ': 'FJI', 'FI': 'FIN', 'FR': 'FRA', 'GF': 'GUF', 'PF': 'PYF', 'TF': 'ATF', 'GA': 'GAB', 'GM': 'GMB', 'GE': 'GEO', 'DE': 'DEU', 'GH': 'GHA', 'GI': 'GIB', 'GR': 'GRC', 'GL': 'GRL', 'GD': 'GRD', 'GP': 'GLP', 'GU': 'GUM', 'GT': 'GTM', 'GG': 'GGY', 'GN': 'GIN', 'GW': 'GNB', 'GY': 'GUY', 'HT': 'HTI', 'HM': 'HMD', 'VA': 'VAT', 'HN': 'HND', 'HK': 'HKG', 'HU': 'HUN', 'IS': 'ISL', 'IN': 'IND', 'ID': 'IDN', 'IR': 'IRN', 'IQ': 'IRQ', 'IE': 'IRL', 'IM': 'IMN', 'IL': 'ISR', 'IT': 'ITA', 'JM': 'JAM', 'JP': 'JPN', 'JE': 'JEY', 'JO': 'JOR', 'KZ': 'KAZ', 'KE': 'KEN', 'KI': 'KIR', 'KP': 'PRK', 'KR': 'KOR', 'KW': 'KWT', 'KG': 'KGZ', 'LA': 'LAO', 'LV': 'LVA', 'LB': 'LBN', 'LS': 'LSO', 'LR': 'LBR', 'LY': 'LBY', 'LI': 'LIE', 'LT': 'LTU', 'LU': 'LUX', 'MO': 'MAC', 'MK': 'MKD', 'MG': 'MDG', 'MW': 'MWI', 'MY': 'MYS', 'MV': 'MDV', 'ML': 'MLI', 'MT': 'MLT', 'MH': 'MHL', 'MQ': 'MTQ', 'MR': 'MRT', 'MU': 'MUS', 'YT': 'MYT', 'MX': 'MEX', 'FM': 'FSM', 'MD': 'MDA', 'MC': 'MCO', 'MN': 'MNG', 'ME': 'MNE', 'MS': 'MSR', 'MA': 'MAR', 'MZ': 'MOZ', 'MM': 'MMR', 'NA': 'NAM', 'NR': 'NRU', 'NP': 'NPL', 'NL': 'NLD', 'NC': 'NCL', 'NZ': 'NZL', 'NI': 'NIC', 'NE': 'NER', 'NG': 'NGA', 'NU': 'NIU', 'NF': 'NFK', 'MP': 'MNP', 'NO': 'NOR', 'OM': 'OMN', 'PK': 'PAK', 'PW': 'PLW', 'PS': 'PSE', 'PA': 'PAN', 'PG': 'PNG', 'PY': 'PRY', 'PE': 'PER', 'PH': 'PHL', 'PN': 'PCN', 'PL': 'POL', 'PT': 'PRT', 'PR': 'PRI', 'QA': 'QAT', 'RE': 'REU', 'RO': 'ROU', 'RU': 'RUS', 'RW': 'RWA', 'BL': 'BLM', 'SH': 'SHN', 'KN': 'KNA', 'LC': 'LCA', 'MF': 'MAF', 'PM': 'SPM', 'VC': 'VCT', 'WS': 'WSM', 'SM': 'SMR', 'ST': 'STP', 'SA': 'SAU', 'SN': 'SEN', 'RS': 'SRB', 'SC': 'SYC', 'SL': 'SLE', 'SG': 'SGP', 'SX': 'SXM', 'SK': 'SVK', 'SI': 'SVN', 'SB': 'SLB', 'SO': 'SOM', 'ZA': 'ZAF', 'GS': 'SGS', 'SS': 'SSD', 'ES': 'ESP', 'LK': 'LKA', 'SD': 'SDN', 'SR': 'SUR', 'SJ': 'SJM', 'SE': 'SWE', 'CH': 'CHE', 'SY': 'SYR', 'TW': 'TWN', 'TJ': 'TJK', 'TZ': 'TZA', 'TH': 'THA', 'TL': 'TLS', 'TG': 'TGO', 'TK': 'TKL', 'TO': 'TON', 'TT': 'TTO', 'TN': 'TUN', 'TR': 'TUR', 'TM': 'TKM', 'TC': 'TCA', 'TV': 'TUV', 'UG': 'UGA', 'UA': 'UKR', 'AE': 'ARE', 'GB': 'GBR', 'US': 'USA', 'UM': 'UMI', 'UY': 'URY', 'UZ': 'UZB', 'VU': 'VUT', 'VE': 'VEN', 'VN': 'VNM', 'VG': 'VGB', 'VI': 'VIR', 'WF': 'WLF', 'EH': 'ESH', 'YE': 'YEM', 'ZM': 'ZMB', 'ZW': 'ZWE' };
function formatTimeAgo(iso) { const s = Math.round((Date.now() - new Date(iso)) / 1000); if (s < 60) return `${s}s ago`; const m = Math.round(s/60); if (m < 60) return `${m}m ago`; const h = Math.round(m/60); if (h < 24) return `${h}h ago`; return `${Math.round(h/24)}d ago`; }
function escapeHTML(str) { const p = document.createElement("p"); p.appendChild(document.createTextNode(str)); return p.innerHTML; }

// -------------------
// INITIALIZATION
// -------------------
function setupCursorToggle() {
    if (!dom.cursorToggleBtn || !dom.kaomojiCursor) return;
    const ALIGNMENT_KEY = 'cursorAlignment';
    let currentAlignment = localStorage.getItem(ALIGNMENT_KEY) || 'center-mouth';
    const applyAlignment = (alignment) => {
        dom.kaomojiCursor.classList.remove('center-mouth', 'top-left');
        dom.kaomojiCursor.classList.add(alignment);
        localStorage.setItem(ALIGNMENT_KEY, alignment);
    };
    applyAlignment(currentAlignment);
    dom.cursorToggleBtn.addEventListener('click', () => {
        const newAlignment = dom.kaomojiCursor.classList.contains('center-mouth') ? 'top-left' : 'center-mouth';
        applyAlignment(newAlignment);
    });
}

// -------------------
// NEW: MUSIC PLAYER LOGIC
// -------------------
function initializeMusicPlayer() {
    if (!dom.waveformContainer) return;

    const playIcon = `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M8 5v14l11-7z"></path></svg>`;
    const pauseIcon = `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>`;
    dom.playBtn.innerHTML = playIcon;

    const wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: '#a09398',
        progressColor: '#d38fba',
        barWidth: 3,
        barRadius: 3,
        barGap: 2,
        height: 70,
        responsive: true,
        hideScrollbar: true,
    });

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    wavesurfer.on('ready', () => {
        dom.waveformLoading.style.opacity = '0';
        dom.timeTotal.textContent = formatTime(wavesurfer.getDuration());
        wavesurfer.play();
    });

    wavesurfer.on('audioprocess', () => {
        dom.timeCurrent.textContent = formatTime(wavesurfer.getCurrentTime());
    });

    wavesurfer.on('play', () => { dom.playBtn.innerHTML = pauseIcon; });
    wavesurfer.on('pause', () => { dom.playBtn.innerHTML = playIcon; });
    wavesurfer.on('finish', () => { dom.playBtn.innerHTML = playIcon; wavesurfer.seekTo(0); });
    wavesurfer.on('error', (err) => { dom.waveformLoading.textContent = `Error: ${err}`; dom.waveformLoading.style.opacity = '1'; });

    dom.playBtn.onclick = () => wavesurfer.playPause();
    dom.volumeSlider.oninput = (e) => wavesurfer.setVolume(e.target.value);
    dom.volumeIcon.onclick = () => wavesurfer.toggleMute();
    wavesurfer.on('volume', (volume) => { dom.volumeIcon.textContent = volume > 0 ? '🔊' : '🔇'; });

    const loadFile = (file) => {
        if (file) {
            dom.waveformLoading.textContent = 'Loading waveform...';
            dom.waveformLoading.style.opacity = '1';
            dom.trackTitle.textContent = file.name;
            wavesurfer.load(URL.createObjectURL(file));
        }
    };
    dom.audioUpload.onchange = (e) => loadFile(e.target.files[0]);
    dom.musicPlayerContainer.ondragover = (e) => e.preventDefault();
    dom.musicPlayerContainer.ondrop = (e) => { e.preventDefault(); loadFile(e.dataTransfer.files[0]); };
}

// -------------------
// INITIALIZATION LOGIC
// -------------------
function setupCursorToggle() { if (!dom.cursorToggleBtn || !dom.kaomojiCursor) return; const KEY = 'cursorAlignment'; let alignment = localStorage.getItem(KEY) || 'center-mouth'; const apply = (align) => { dom.kaomojiCursor.classList.remove('center-mouth', 'top-left'); dom.kaomojiCursor.classList.add(align); localStorage.setItem(KEY, align); }; apply(alignment); dom.cursorToggleBtn.addEventListener('click', () => { const newAlign = dom.kaomojiCursor.classList.contains('center-mouth') ? 'top-left' : 'center-mouth'; apply(newAlign); }); }
function bindEventListeners() { if (dom.postButton) { dom.postButton.addEventListener('click', async () => { const u = dom.usernameInput.value.trim() || 'Anonymous', m = dom.commentInput.value.trim(); if (!m) return alert('Message cannot be empty.'); dom.postButton.disabled = true; dom.postButton.textContent = '...'; try { await api.postComment(u, m); const c = await api.fetchComments(); ui.renderComments(c); dom.commentInput.value = ''; } catch (e) { console.error('Error posting comment:', e); alert('An error occurred.'); } finally { dom.postButton.disabled = false; dom.postButton.textContent = 'Post'; } }); } if (dom.commentInput) dom.commentInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); dom.postButton.click(); } }); if (dom.visitsBox) dom.visitsBox.addEventListener('click', async () => ui.showVisitorMap(await api.fetchVisitSummary())); if (dom.closeModalButton) dom.closeModalButton.addEventListener('click', () => { dom.mapModal.classList.remove('visible'); document.body.classList.remove('modal-open'); }); if (dom.mapModal) dom.mapModal.addEventListener('click', (e) => { if (e.target === dom.mapModal) { dom.mapModal.classList.remove('visible'); document.body.classList.remove('modal-open'); } }); }
async function main() {
    ui.setupKaomojiCursor();
    setupCursorToggle();
    bindEventListeners();
    initializeMusicPlayer(); // Initialize the new player
    ui.renderProjects(config.PROJECTS);
    const [comments, visitData, activityData] = await Promise.all([api.fetchComments(), api.fetchVisitSummary(), api.fetchActivityData()]);
    ui.renderComments(comments);
    ui.drawActivityChart(activityData);
    ui.updateVisitCount(visitData.total_visits);
    if (!sessionStorage.getItem('visit_pinged')) {
        await api.pingVisit();
        const updatedVisitData = await api.fetchVisitSummary();
        ui.updateVisitCount(updatedVisitData.total_visits);
        sessionStorage.setItem('visit_pinged', 'true');
    }
    setInterval(() => api.fetchActivityData().then(ui.drawActivityChart), config.REFRESH_INTERVAL);
}