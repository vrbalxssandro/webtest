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
    musicPlayerContainer: document.getElementById('music-player-container'),
    waveformContainer: document.getElementById('waveform'),
    waveformLoading: document.getElementById('waveform-loading'),
    playBtn: document.getElementById('play-btn'),
    volumeSlider: document.getElementById('volume-slider'),
    volumeIcon: document.getElementById('volume-icon'),
    audioUpload: document.getElementById('audio-upload'),
    trackTitle: document.getElementById('track-title'),
    timeCurrent: document.getElementById('time-current'),
    timeTotal: document.getElementById('time-total'),
    // New elements for physics balls
    physicsContainer: document.getElementById('physics-container'),
    addBallBtn: document.getElementById('add-ball-btn')
};

// -------------------
// API CALLS
// -------------------
const api = {
    async pingVisit() {
        try {
            const response = await fetch(config.API_ENDPOINTS.pingVisit, { method: 'POST' });
            if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
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
// BOUNCY BALLS
// -------------------
const physics = {
    balls: [],
    gravity: 0.6,
    drag: 0.999,
    bounceFactor: 0.85,
    mouse: { x: 0, y: 0, vx: 0, vy: 0, down: false },
    lastMousePos: { x: 0, y: 0 },
    
    init() {
        this.addEventListeners();
        this.createBall(); // Start with one ball
        this.createBall(); // And another one
        this.animate();
    },

    createBall(x, y) {
        const radius = Math.random() * 20 + 25; // Size between 25px and 45px
        const ball = {
            el: document.createElement('div'),
            radius: radius,
            x: x || Math.random() * (window.innerWidth - radius * 2) + radius,
            y: y || Math.random() * (window.innerHeight / 2),
            vx: Math.random() * 10 - 5,
            vy: Math.random() * 10 - 5,
            isDragging: false,
        };

        const hue = Math.random() * 360;
        ball.el.className = 'bouncy-ball';
        ball.el.style.width = `${radius * 2}px`;
        ball.el.style.height = `${radius * 2}px`;
        ball.el.style.background = `radial-gradient(circle at 35% 35%, hsl(${hue}, 100%, 80%), hsl(${hue}, 90%, 50%))`;
        
        ball.el.addEventListener('mousedown', (e) => this.handleMouseDown(e, ball));

        dom.physicsContainer.appendChild(ball.el);
        this.balls.push(ball);
    },
    
    animate() {
        this.balls.forEach(ball => {
            if (!ball.isDragging) {
                // Apply physics
                ball.vx *= this.drag;
                ball.vy *= this.drag;
                ball.vy += this.gravity;
                ball.x += ball.vx;
                ball.y += ball.vy;

                // Wall collisions
                if (ball.x + ball.radius > window.innerWidth) {
                    ball.x = window.innerWidth - ball.radius;
                    ball.vx *= -this.bounceFactor;
                } else if (ball.x - ball.radius < 0) {
                    ball.x = ball.radius;
                    ball.vx *= -this.bounceFactor;
                }
                if (ball.y + ball.radius > window.innerHeight) {
                    ball.y = window.innerHeight - ball.radius;
                    ball.vy *= -this.bounceFactor;
                } else if (ball.y - ball.radius < 0) {
                    ball.y = ball.radius;
                    ball.vy *= -this.bounceFactor;
                }
            }

            ball.el.style.transform = `translate3d(${ball.x - ball.radius}px, ${ball.y - ball.radius}px, 0)`;
        });

        requestAnimationFrame(() => this.animate());
    },

    addEventListeners() {
        window.addEventListener('mousemove', (e) => {
            this.mouse.vx = e.clientX - this.lastMousePos.x;
            this.mouse.vy = e.clientY - this.lastMousePos.y;
            this.lastMousePos = { x: e.clientX, y: e.clientY };
            
            this.balls.forEach(ball => {
                if (ball.isDragging) {
                    ball.x = this.lastMousePos.x + ball.dragOffsetX;
                    ball.y = this.lastMousePos.y + ball.dragOffsetY;
                }
            });
        });
        
        window.addEventListener('mouseup', () => {
            this.balls.forEach(ball => {
                if (ball.isDragging) {
                    ball.isDragging = false;
                    ball.vx = this.mouse.vx;
                    ball.vy = this.mouse.vy;
                }
            });
        });
        
        if (dom.addBallBtn) {
            dom.addBallBtn.addEventListener('click', () => {
                this.createBall(window.innerWidth / 2, window.innerHeight / 2);
            });
        }
    },
    
    handleMouseDown(e, ball) {
        e.preventDefault();
        ball.isDragging = true;
        ball.vx = 0;
        ball.vy = 0;
        ball.dragOffsetX = ball.x - e.clientX;
        ball.dragOffsetY = ball.y - e.clientY;
    }
};


// -------------------
// UI UPDATES
// -------------------
const ui = {
    activityChartInstance: null,

    setupKaomojiCursor() {
        if (!dom.kaomojiCursor) return;
        
        // This logic makes the cursor color change based on the background.
        const getLuminance = (color) => {
            const rgb = color.match(/\d+/g);
            if (!rgb) return 0;
            const a = rgb.slice(0, 3).map(v => {
                v = parseInt(v) / 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
        };
        const getEffectiveBackgroundColor = (element) => {
            let el = element;
            while (el) {
                const color = window.getComputedStyle(el).backgroundColor;
                if (color && color !== 'rgba(0, 0, 0, 0)') return color;
                el = el.parentElement;
            }
            return 'rgb(255, 255, 255)'; // Default to white
        };
        let lastCheckedElement = null;

        window.addEventListener('mousemove', e => {
            dom.kaomojiCursor.style.left = `${e.clientX}px`;
            dom.kaomojiCursor.style.top = `${e.clientY}px`;
            
            const elem = document.elementFromPoint(e.clientX, e.clientY);
            if(elem && elem !== lastCheckedElement) {
                lastCheckedElement = elem;
                const bgColor = getEffectiveBackgroundColor(elem);
                const luminance = getLuminance(bgColor);
                dom.kaomojiCursor.style.color = luminance > 0.5 ? '#2b2125' : '#f0e6e8';
            }
        });
        document.body.addEventListener('mousedown', () => { dom.kaomojiCursor.textContent = '(>ω<)'; });
        document.body.addEventListener('mouseup', () => { dom.kaomojiCursor.textContent = '(´• ω •`)'; });
    },

    renderProjects(projects) {
        if (!dom.projectGrid) return;
        dom.projectGrid.innerHTML = '';
        projects.forEach(project => {
            const card = document.createElement('a');
            card.href = project.url;
            card.className = 'project-card';
            card.innerHTML = `<img src="${project.image}" alt="${project.title} thumbnail"><div class="project-card-content"><h3>${escapeHTML(project.title)}</h3><p>${escapeHTML(project.description)}</p></div>`;
            dom.projectGrid.appendChild(card);
        });
    },

    renderComments(comments) {
        if (!dom.timeline || !dom.postsCountEl) return;
        dom.timeline.innerHTML = '';
        if (comments.length === 0) {
            dom.timeline.innerHTML = '<p class="loading-message">No comments yet. Be the first!</p>';
        } else {
            comments.forEach(c => {
                const el = document.createElement('div');
                el.className = 'comment';
                el.innerHTML = `<div class="comment-header"><span class="comment-user">${escapeHTML(c.username)}</span><span class="comment-time">${formatTimeAgo(c.timestamp)}</span></div><p class="comment-message">${escapeHTML(c.message)}</p>`;
                dom.timeline.appendChild(el);
            });
        }
        dom.postsCountEl.textContent = comments.length.toLocaleString();
    },

    drawActivityChart(timestamps) {
        if (!dom.activityChartCanvas) return;
        const now = Date.now();
        const numBuckets = 36;
        const bucketSize = 10 * 60 * 1000;
        const buckets = new Array(numBuckets).fill(0);
        const labels = new Array(numBuckets).fill('');
        labels[0] = '6h ago';
        labels[14] = '3h ago';
        labels[29] = 'Now';
        for (const ts of timestamps) {
            const timeAgo = now - new Date(ts).getTime();
            if (timeAgo >= 0 && timeAgo < numBuckets * bucketSize) {
                const bucketIndex = Math.floor(timeAgo / bucketSize);
                buckets[numBuckets - 1 - bucketIndex]++;
            }
        }
        if (this.activityChartInstance) this.activityChartInstance.destroy();
        const ctx = dom.activityChartCanvas.getContext('2d');
        this.activityChartInstance = new Chart(ctx, { type: 'bar', data: { labels: labels, datasets: [{ data: buckets, backgroundColor: 'rgba(211, 143, 186, 0.8)', borderWidth: 0, borderRadius: 2, barPercentage: 1.0, categoryPercentage: 1.0 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: true } }, scales: { y: { display: true, beginAtZero: true, ticks: { color: 'rgba(240, 230, 232, 0.5)', precision: 0 }, grid: { color: 'rgba(240, 230, 232, 0.1)' }, title: { display: true, text: 'Visits', color: 'rgba(240, 230, 232, 0.7)' }, suggestedMax: Math.max(...buckets, 5) }, x: { display: true, ticks: { color: 'rgba(240, 230, 232, 0.5)', autoSkip: false, maxRotation: 0, minRotation: 0 }, grid: { display: false } } } } });
    },

    showVisitorMap(visitData) {
        if (!dom.mapModal || !dom.mapContainer) return;
        document.body.classList.add('modal-open');
        dom.mapModal.classList.add('visible');
        dom.mapContainer.innerHTML = '';
        const countryData = visitData.countries || {};
        if (Object.keys(countryData).length === 0) {
            dom.mapContainer.innerHTML = '<p>No visitor data yet! Be the first.</p>';
            return;
        }
        const mapFills = { defaultFill: '#3a2e33' };
        const dataset = {};
        const counts = Object.values(countryData);
        const maxCount = Math.max(...counts, 1);
        const palette = chroma.scale(['#c979a8', '#f0e6e8']).domain([0, maxCount]);
        for (const [code2, count] of Object.entries(countryData)) {
            const code3 = countryCodeMap[code2];
            if (code3) {
                mapFills[code3] = palette(count).hex();
                dataset[code3] = { fillKey: code3, visitCount: count };
            }
        }
        new Datamap({
            element: dom.mapContainer, projection: 'mercator', fills: mapFills, data: dataset,
            geographyConfig: { borderColor: '#2b2125', highlightFillColor: '#d38fba', highlightBorderColor: 'rgba(0, 0, 0, 0.2)', popupTemplate: (geo, data) => `<div class="hoverinfo"><strong>${geo.properties.name}</strong><br>Visits: <span class="popup-visits-count">${data ? data.visitCount : 0}</span></div>` }
        });
    },

    updateVisitCount(count) {
        if (dom.visitsCountEl) dom.visitsCountEl.textContent = count.toLocaleString();
    }
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

function initializeMusicPlayer() {
    if (!dom.musicPlayerContainer) return;
    const playIcon = `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M8 5v14l11-7z"></path></svg>`;
    const pauseIcon = `<svg viewBox="0 0 24 24" width="24" height="24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>`;
    dom.playBtn.innerHTML = playIcon;

    const wavesurfer = WaveSurfer.create({
        container: '#waveform', waveColor: '#a09398', progressColor: '#d38fba',
        barWidth: 3, barRadius: 3, barGap: 2, height: 70, responsive: true, hideScrollbar: true,
    });

    const formatTime = (seconds) => { const m = Math.floor(seconds / 60); const s = Math.floor(seconds % 60); return `${m}:${s < 10 ? '0' : ''}${s}`; };
    wavesurfer.on('ready', () => { dom.waveformLoading.style.opacity = '0'; dom.timeTotal.textContent = formatTime(wavesurfer.getDuration()); wavesurfer.play(); });
    wavesurfer.on('audioprocess', () => { dom.timeCurrent.textContent = formatTime(wavesurfer.getCurrentTime()); });
    wavesurfer.on('play', () => { dom.playBtn.innerHTML = pauseIcon; });
    wavesurfer.on('pause', () => { dom.playBtn.innerHTML = playIcon; });
    wavesurfer.on('finish', () => { dom.playBtn.innerHTML = playIcon; wavesurfer.seekTo(0); dom.timeCurrent.textContent = "0:00"; });
    wavesurfer.on('error', (err) => { dom.waveformLoading.textContent = `Error: ${err}`; dom.waveformLoading.style.opacity = '1'; });
    dom.playBtn.onclick = () => wavesurfer.playPause();
    dom.volumeSlider.oninput = (e) => wavesurfer.setVolume(e.target.value);
    dom.volumeIcon.onclick = () => wavesurfer.toggleMute();
    wavesurfer.on('volume', (volume) => { dom.volumeIcon.textContent = wavesurfer.getMute() ? '🔇' : '🔊'; });

    const loadFile = (file) => { if (file) { dom.waveformLoading.textContent = 'Loading...'; dom.waveformLoading.style.opacity = '1'; dom.trackTitle.textContent = file.name; wavesurfer.load(URL.createObjectURL(file)); } };
    dom.audioUpload.onchange = (e) => loadFile(e.target.files[0]);
    dom.musicPlayerContainer.ondragover = (e) => e.preventDefault();
    dom.musicPlayerContainer.ondrop = (e) => { e.preventDefault(); loadFile(e.dataTransfer.files[0]); };
}

function bindEventListeners() {
    if (dom.postButton) {
        dom.postButton.addEventListener('click', async () => {
            const username = dom.usernameInput.value.trim() || 'Anonymous';
            const message = dom.commentInput.value.trim();
            if (!message) return alert('Message cannot be empty.');
            dom.postButton.disabled = true; dom.postButton.textContent = '...';
            try {
                await api.postComment(username, message);
                const comments = await api.fetchComments();
                ui.renderComments(comments);
                dom.commentInput.value = '';
            } catch (error) { console.error('Error posting comment:', error); alert('An error occurred.');
            } finally { dom.postButton.disabled = false; dom.postButton.textContent = 'Post'; }
        });
    }
    if (dom.commentInput) dom.commentInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); dom.postButton.click(); } });
    if (dom.visitsBox) dom.visitsBox.addEventListener('click', async () => ui.showVisitorMap(await api.fetchVisitSummary()));
    if (dom.closeModalButton) dom.closeModalButton.addEventListener('click', () => { dom.mapModal.classList.remove('visible'); document.body.classList.remove('modal-open'); });
    if (dom.mapModal) dom.mapModal.addEventListener('click', (e) => { if (e.target === dom.mapModal) { dom.mapModal.classList.remove('visible'); document.body.classList.remove('modal-open'); } });
}

async function main() {
    ui.setupKaomojiCursor();
    setupCursorToggle();
    bindEventListeners();
    initializeMusicPlayer();
    ui.renderProjects(config.PROJECTS);
    physics.init(); // Initialize the bouncy balls!
    
    const [comments, visitData, activityData] = await Promise.all([
        api.fetchComments(),
        api.fetchVisitSummary(),
        api.fetchActivityData()
    ]);
    
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

document.addEventListener('DOMContentLoaded', main);