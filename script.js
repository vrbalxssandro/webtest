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
};

// -------------------
// API CALLS
// -------------------
const api = {
    async pingVisit() {
        try {
            const response = await fetch(config.API_ENDPOINTS.pingVisit, { method: 'POST' });
            if (!response.ok) { // Check if the server responded with an error
                throw new Error(`Server responded with status: ${response.status}`);
            }
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
    drawActivityChart(timestamps) { if (!dom.activityChartCanvas) return; const now = Date.now(); const numBuckets = 30; const bucketSize = 60 * 1000; const buckets = new Array(numBuckets).fill(0); const labels = new Array(numBuckets).fill(''); for (const ts of timestamps) { const timeAgo = now - new Date(ts).getTime(); if (timeAgo >= 0 && timeAgo < numBuckets * bucketSize) { const bucketIndex = Math.floor(timeAgo / bucketSize); buckets[numBuckets - 1 - bucketIndex]++; } } if (this.activityChartInstance) this.activityChartInstance.destroy(); const ctx = dom.activityChartCanvas.getContext('2d'); this.activityChartInstance = new Chart(ctx, { type: 'bar', data: { labels: labels, datasets: [{ data: buckets, backgroundColor: 'rgba(211, 143, 186, 0.8)', borderWidth: 0, borderRadius: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { y: { display: false, beginAtZero: true, suggestedMax: Math.max(...buckets, 5) }, x: { display: false } } } }); },
    showVisitorMap(visitData) { if (!dom.mapModal || !dom.mapContainer) return; dom.mapModal.classList.add('visible'); dom.mapContainer.innerHTML = ''; const countryData = visitData.countries || {}; if (Object.keys(countryData).length === 0) { dom.mapContainer.innerHTML = '<p>No visitor data yet! Be the first.</p>'; return; } const mapFills = { defaultFill: '#3a2e33' }; const dataset = {}; const counts = Object.values(countryData); const maxCount = Math.max(...counts, 1); const palette = chroma.scale(['#c979a8', '#f0e6e8']).domain([0, maxCount]); for (const [countryCode, count] of Object.entries(countryData)) { mapFills[countryCode] = palette(count).hex(); dataset[countryCode] = { fillKey: countryCode, visitCount: count }; } new Datamap({ element: dom.mapContainer, projection: 'mercator', fills: mapFills, data: dataset, geographyConfig: { borderColor: '#2b2125', highlightFillColor: '#d38fba', highlightBorderColor: 'rgba(0, 0, 0, 0.2)', popupTemplate: (geo, data) => `<div class="hoverinfo"><strong>${geo.properties.name}</strong><br>Visits: ${data ? data.visitCount : 0}</div>` } }); },
};

// -------------------
// HELPER FUNCTIONS
// -------------------
function formatTimeAgo(iso) { const s = Math.round((Date.now() - new Date(iso)) / 1000); if (s < 60) return `${s}s ago`; const m = Math.round(s/60); if (m < 60) return `${m}m ago`; const h = Math.round(m/60); if (h < 24) return `${h}h ago`; return `${Math.round(h/24)}d ago`; }
function escapeHTML(str) { const p = document.createElement("p"); p.appendChild(document.createTextNode(str)); return p.innerHTML; }

// -------------------
// MAIN LOGIC
// -------------------
function bindEventListeners() {
    if (dom.postButton) {
        dom.postButton.addEventListener('click', async () => {
            const username = dom.usernameInput.value.trim() || 'Anonymous';
            const message = dom.commentInput.value.trim();
            if (!message) return alert('Message cannot be empty.');
            
            dom.postButton.disabled = true;
            dom.postButton.textContent = '...';
            try {
                await api.postComment(username, message);
                const comments = await api.fetchComments();
                ui.renderComments(comments);
                dom.commentInput.value = '';
            } catch (error) {
                console.error('Error posting comment:', error);
                alert('An error occurred.');
            } finally {
                dom.postButton.disabled = false;
                dom.postButton.textContent = 'Post';
            }
        });
    }
    if (dom.commentInput) dom.commentInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); dom.postButton.click(); } });
    if (dom.visitsBox) dom.visitsBox.addEventListener('click', async () => ui.showVisitorMap(await api.fetchVisitSummary()));
    if (dom.closeModalButton) dom.closeModalButton.addEventListener('click', () => dom.mapModal.classList.remove('visible'));
    if (dom.mapModal) dom.mapModal.addEventListener('click', (e) => { if (e.target === dom.mapModal) dom.mapModal.classList.remove('visible'); });
}

async function main() {
    ui.setupKaomojiCursor();
    bindEventListeners();
    ui.renderProjects(config.PROJECTS);

    // Fetch initial data concurrently for a fast page load
    const [comments, visitData, activityData] = await Promise.all([
        api.fetchComments(),
        api.fetchVisitSummary(),
        api.fetchActivityData()
    ]);

    // Render the UI with the data we just fetched
    ui.renderComments(comments);
    ui.drawActivityChart(activityData);
    
    // Set the initial visit count from the server
    let totalVisits = visitData.total_visits || 0;
    dom.visitsCountEl.textContent = totalVisits.toLocaleString();

    // FIX: Check if this session has already logged a visit.
    if (!sessionStorage.getItem('visit_pinged')) {
        // Increment the counter visually for instant feedback.
        totalVisits++;
        dom.visitsCountEl.textContent = totalVisits.toLocaleString();
        
        // Now, tell the backend to log the visit. This happens in the background.
        api.pingVisit();
        
        // Set the flag so this session doesn't log another visit.
        sessionStorage.setItem('visit_pinged', 'true');
    }

    // Set up refresh intervals for dynamic data
    setInterval(async () => {
        const data = await api.fetchActivityData();
        ui.drawActivityChart(data);
    }, config.REFRESH_INTERVAL);
}

document.addEventListener('DOMContentLoaded', main);