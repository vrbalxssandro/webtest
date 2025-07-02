document.addEventListener('DOMContentLoaded', () => {
    const PROJECTS = [
        { title: 'Test', description: 'Test', image: './images/project-a-thumb.png', url: './my-cool-game/index.html' },
        { title: 'Another Test', description: 'This is another Test', image: './images/placeholder.png', url: '#' }
    ];

    const kaomojiCursor = document.getElementById('kaomoji-cursor');
    const projectGrid = document.getElementById('project-grid');
    const timeline = document.getElementById('timeline');
    const postButton = document.getElementById('post-button');
    const usernameInput = document.getElementById('username-input');
    const commentInput = document.getElementById('comment-input');
    const visitsCountEl = document.getElementById('visits-count');
    const postsCountEl = document.getElementById('posts-count');
    const nowPlayingContainer = document.querySelector('#now-playing .now-playing-content');
    const visitsBox = document.getElementById('visits-box');
    const mapModal = document.getElementById('map-modal');
    const closeModalButton = document.querySelector('#map-modal .close-button');

    function setupKaomojiCursor() {
        if (!kaomojiCursor) return;
        window.addEventListener('mousemove', e => {
            // We now update top and left, and let CSS handle the transform.
            kaomojiCursor.style.left = `${e.clientX}px`;
            kaomojiCursor.style.top = `${e.clientY}px`;
        });
        document.body.addEventListener('mousedown', () => { kaomojiCursor.textContent = '(>ω<)'; });
        document.body.addEventListener('mouseup', () => { kaomojiCursor.textContent = '(´• ω •`)'; });
    }

    async function fetchNowPlaying() {
        if (!nowPlayingContainer) return;
        try {
            const response = await fetch('/api/now-playing');
            const data = await response.json();
            
            if (response.status !== 200 || data.error) {
                // FIX: Better error handling for API key/user issues
                throw new Error(data.message || 'Invalid API Key or Username.');
            }

            if (!data.recenttracks || !data.recenttracks.track || data.recenttracks.track.length === 0) {
                 nowPlayingContainer.innerHTML = `<p>Not listening to anything.</p>`;
                 return;
            }
            const track = data.recenttracks.track[0];
            const isPlaying = track['@attr'] && track['@attr'].nowplaying === 'true';

            nowPlayingContainer.innerHTML = `
                <img src="${track.image[2]['#text'] || './images/placeholder.png'}" alt="Album Art">
                <div class="now-playing-info">
                    <strong>${track.name}</strong>
                    <span>${track.artist['#text']}</span>
                    ${isPlaying ? '<span style="color: var(--accent-color);">Listening now...</span>' : ''}
                </div>
            `;
        } catch (error) {
            console.error("Error fetching now playing data:", error);
            nowPlayingContainer.innerHTML = `<p style="color: #ff8b8b;">${error.message}</p>`;
        }
    }
    
    async function pingVisit() {
        if (sessionStorage.getItem('visit_pinged')) return;
        try {
            await fetch('/api/visit', { method: 'POST' });
            sessionStorage.setItem('visit_pinged', 'true');
        } catch (error) { console.error("Could not ping visit:", error); }
    }

    // FIX: Function to fetch the REAL total visit count
    async function fetchTotalVisits() {
        try {
            const response = await fetch('/api/visits/summary');
            const data = await response.json();
            const totalVisits = data.total_visits || 0;
            if (visitsCountEl) {
                visitsCountEl.textContent = totalVisits.toLocaleString();
            }
        } catch (error) {
            console.error("Could not fetch total visits:", error);
            if (visitsCountEl) visitsCountEl.textContent = 'N/A';
        }
    }

    async function showVisitorMap() {
        if (!mapModal) return;
        mapModal.classList.add('visible');
        const mapContainer = document.getElementById('map-container');
        mapContainer.innerHTML = '<p>Loading map data...</p>';
        try {
            const response = await fetch('/api/visits/summary');
            if (!response.ok) throw new Error('Could not fetch visit summary');
            const visitData = await response.json();
            const countryData = visitData.countries || {};
            
            mapContainer.innerHTML = '';
            if (Object.keys(countryData).length === 0) {
                 mapContainer.innerHTML = '<p>No visitor data yet! Be the first.</p>';
                 return;
            }
            const mapFills = { defaultFill: '#3a2e33' };
            const dataset = {};
            const counts = Object.values(countryData);
            const maxCount = Math.max(...counts, 1);
            const palette = chroma.scale(['#c979a8', '#f0e6e8']).domain([0, maxCount]);
            for (const [countryCode, count] of Object.entries(countryData)) {
                mapFills[countryCode] = palette(count).hex();
                dataset[countryCode] = { fillKey: countryCode, visitCount: count };
            }
            new Datamap({ element: mapContainer, projection: 'mercator', fills: mapFills, data: dataset, geographyConfig: { borderColor: '#2b2125', highlightFillColor: '#d38fba', highlightBorderColor: 'rgba(0, 0, 0, 0.2)', popupTemplate: (geo, data) => `<div class="hoverinfo"><strong>${geo.properties.name}</strong><br>Visits: ${data ? data.visitCount : 0}</div>` } });
        } catch (error) {
            console.error("Error fetching visit data:", error);
            mapContainer.innerHTML = '<p>Could not load map data.</p>';
        }
    }

    function initializeRecentActivityChart() {
        const ctx = document.getElementById('recent-activity-chart');
        if (!ctx) return;
        const labels = Array.from({ length: 18 }, (_, i) => `${(i + 1) * 30}s`);
        const data = Array.from({ length: 18 }, () => Math.floor(Math.random() * 20));
        new Chart(ctx, { type: 'bar', data: { labels: labels, datasets: [{ data: data, backgroundColor: 'rgba(211, 143, 186, 0.8)', borderColor: 'rgba(211, 143, 186, 1)', borderWidth: 1, borderRadius: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { y: { display: false, beginAtZero: true }, x: { display: false } } } });
    }

    function renderProjects() { if (!projectGrid) return; projectGrid.innerHTML = ''; PROJECTS.forEach(project => { const card = document.createElement('a'); card.href = project.url; card.className = 'project-card'; card.innerHTML = `<img src="${project.image}" alt="${project.title} thumbnail"><div class="project-card-content"><h3>${escapeHTML(project.title)}</h3><p>${escapeHTML(project.description)}</p></div>`; projectGrid.appendChild(card); }); }
    async function fetchComments() { try { const r = await fetch('/api/comments'); if (!r.ok) throw new Error(`E:${r.status}`); return await r.json(); } catch (e) { console.error('E fetch comments:', e); if(timeline) timeline.querySelector('.loading-message').textContent='Could not load.'; return []; } }
    async function postComment() { const u = usernameInput.value.trim()||'Anonymous', m = commentInput.value.trim(); if (!m) return alert('Msg missing.'); postButton.disabled = true; postButton.textContent = '...'; try { const r = await fetch('/api/comments', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:u, message:m}) }); if (!r.ok) throw new Error('E post.'); const c = await fetchComments(); renderComments(c); commentInput.value = ''; } catch(e){ console.error('E post comment:', e); alert('Error.'); } finally { postButton.disabled=false; postButton.textContent='Post'; } }
    const renderComments = (comments) => { if (!timeline) return; timeline.innerHTML = ''; if (comments.length === 0) { timeline.innerHTML = '<p class="loading-message">No comments yet.</p>'; } else { comments.forEach(c => { const el = document.createElement('div'); el.className='comment'; el.innerHTML = `<div class="comment-header"><span class="comment-user">${escapeHTML(c.username)}</span><span class="comment-time">${formatTimeAgo(c.timestamp)}</span></div><p class="comment-message">${escapeHTML(c.message)}</p>`; timeline.appendChild(el); }); } if (postsCountEl) postsCountEl.textContent = comments.length.toLocaleString(); };
    function formatTimeAgo(iso) { const s = Math.round((Date.now() - new Date(iso)) / 1000); if (s < 60) return `${s}s ago`; const m = Math.round(s/60); if (m < 60) return `${m}m ago`; const h = Math.round(m/60); if (h < 24) return `${h}h ago`; return `${Math.round(h/24)}d ago`; }
    function escapeHTML(str) { const p = document.createElement("p"); p.appendChild(document.createTextNode(str)); return p.innerHTML; }

    async function initializePage() {
        setupKaomojiCursor();
        pingVisit();
        renderProjects();
        fetchTotalVisits(); // Fetch the real total
        initializeRecentActivityChart();
        const comments = await fetchComments();
        renderComments(comments);
        fetchNowPlaying();
        setInterval(fetchNowPlaying, 60000); // Refresh every minute
    }
    
    if (postButton) postButton.addEventListener('click', postComment);
    if (commentInput) commentInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment(); } });
    if (visitsBox) visitsBox.addEventListener('click', showVisitorMap);
    if (closeModalButton) closeModalButton.addEventListener('click', () => mapModal.classList.remove('visible'));
    if (mapModal) mapModal.addEventListener('click', (e) => { if (e.target === mapModal) mapModal.classList.remove('visible'); });

    initializePage();
});