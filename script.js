document.addEventListener('DOMContentLoaded', () => {
    // =======================================================
    // ==  PROJECTS CONFIGURATION                           ==
    // =======================================================
    const PROJECTS = [
        {
            title: 'Test',
            description: 'Test',
            image: './images/project-a-thumb.png',
            url: './my-cool-game/'
        },
        {
            title: 'Another Project',
            description: 'This is another test',
            image: './images/placeholder.png',
            url: '#'
        }
    ];

    // --- Element Selectors ---
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

    // =======================================================
    // ==  FEATURE: Kaomoji Cursor                          ==
    // =======================================================
    function setupKaomojiCursor() {
        if (!kaomojiCursor) return;
        window.addEventListener('mousemove', e => {
            kaomojiCursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        });
        document.body.addEventListener('mousedown', () => {
            kaomojiCursor.textContent = '(>ω<)';
        });
        document.body.addEventListener('mouseup', () => {
            kaomojiCursor.textContent = '(´• ω •`)';
        });
    }

    // =======================================================
    // ==  FEATURE: Draggable Windows                       ==
    // =======================================================
    function makeDraggable(element) {
        if (!element) return;
        const header = element.querySelector('.window-header');
        if (!header) return;

        let offsetX, offsetY;
        
        const parent = element.parentElement;
        if (window.getComputedStyle(parent).position === 'static') {
            parent.style.position = 'relative';
        }
        element.style.position = 'absolute';

        const move = (e) => {
            e.preventDefault();
            element.style.left = `${e.clientX - offsetX}px`;
            element.style.top = `${e.clientY - offsetY}px`;
        };

        header.addEventListener('mousedown', (e) => {
            offsetX = e.clientX - element.offsetLeft;
            offsetY = e.clientY - element.offsetTop;
            document.addEventListener('mousemove', move);
            header.style.cursor = 'grabbing';
        });

        document.addEventListener('mouseup', () => {
            document.removeEventListener('mousemove', move);
            header.style.cursor = 'grab';
        });
    }

    // =======================================================
    // ==  FEATURE: Last.fm "Now Playing" (SECURE VERSION)  ==
    // =======================================================
    async function fetchNowPlaying() {
        if (!nowPlayingContainer) return;

        try {
            // Call our own secure backend endpoint instead of Last.fm directly
            const response = await fetch('/api/now-playing');
            if (!response.ok) throw new Error('API response not OK');
            
            const data = await response.json();

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
            nowPlayingContainer.innerHTML = `<p>Could not load track.</p>`;
        }
    }
    
    // =======================================================
    // ==  FEATURE: Visitor Map                             ==
    // =======================================================
    async function pingVisit() {
        if (sessionStorage.getItem('visit_pinged')) return;
        try {
            await fetch('/api/visit', { method: 'POST' });
            sessionStorage.setItem('visit_pinged', 'true');
        } catch (error) {
            console.error("Could not ping visit:", error);
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
            
            mapContainer.innerHTML = '';

            if (Object.keys(visitData).length === 0) {
                 mapContainer.innerHTML = '<p>No visitor data yet!</p>';
                 return;
            }
            
            const mapFills = { defaultFill: '#3a2e33' };
            const dataset = {};
            const counts = Object.values(visitData);
            const maxCount = Math.max(...counts, 1);
            
            const palette = chroma.scale(['#c979a8', '#f0e6e8']).domain([0, maxCount]);

            for (const [countryCode, count] of Object.entries(visitData)) {
                mapFills[countryCode] = palette(count).hex();
                dataset[countryCode] = { fillKey: countryCode, visitCount: count };
            }
            
            new Datamap({
                element: mapContainer,
                projection: 'mercator',
                fills: mapFills,
                data: dataset,
                geographyConfig: {
                    borderColor: '#2b2125',
                    highlightFillColor: '#d38fba',
                    highlightBorderColor: 'rgba(0, 0, 0, 0.2)',
                    popupTemplate: (geo, data) =>
                        `<div class="hoverinfo"><strong>${geo.properties.name}</strong><br>Visits: ${data ? data.visitCount : 0}</div>`
                }
            });

        } catch (error) {
            console.error("Error fetching visit data:", error);
            mapContainer.innerHTML = '<p>Could not load map data.</p>';
        }
    }

    // =======================================================
    // ==  FEATURE: Infographics Chart                      ==
    // =======================================================
    function initializeRecentActivityChart() {
        const ctx = document.getElementById('recent-activity-chart');
        if (!ctx) return;

        const labels = Array.from({ length: 18 }, (_, i) => `${(i + 1) * 30}s`);
        const data = Array.from({ length: 18 }, () => Math.floor(Math.random() * 20));

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: 'rgba(211, 143, 186, 0.8)',
                    borderColor: 'rgba(211, 143, 186, 1)',
                    borderWidth: 1,
                    borderRadius: 2
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: {
                    y: { display: false, beginAtZero: true },
                    x: { display: false }
                }
            }
        });
    }

    // =======================================================
    // ==  Core Functions (Projects, Comments, etc.)        ==
    // =======================================================
    function renderProjects() {
        if (!projectGrid) return;
        projectGrid.innerHTML = '';
        PROJECTS.forEach(project => {
            const projectCard = document.createElement('a');
            projectCard.href = project.url;
            projectCard.className = 'project-card';
            projectCard.innerHTML = `
                <img src="${project.image}" alt="${project.title} thumbnail">
                <div class="project-card-content">
                    <h3>${escapeHTML(project.title)}</h3>
                    <p>${escapeHTML(project.description)}</p>
                </div>
            `;
            projectGrid.appendChild(projectCard);
        });
    }

    async function fetchComments() {
        try {
            const response = await fetch('/api/comments');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching comments:', error);
            if (timeline) {
                timeline.querySelector('.loading-message').textContent = 'Could not load comments.';
            }
            return [];
        }
    }

    async function postComment() {
        const username = usernameInput.value.trim() || 'Anonymous';
        const message = commentInput.value.trim();
        if (!message) return alert('Please enter a message.');

        postButton.disabled = true;
        postButton.textContent = 'Posting...';
        try {
            const response = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, message })
            });
            if (!response.ok) throw new Error('Failed to post comment.');
            
            const updatedComments = await fetchComments();
            renderComments(updatedComments);
            commentInput.value = '';
        } catch (error) {
            console.error('Error posting comment:', error);
            alert('An error occurred. Please try again.');
        } finally {
            postButton.disabled = false;
            postButton.textContent = 'Post';
        }
    }
    
    const renderComments = (comments) => {
        if (!timeline) return;
        timeline.innerHTML = '';
        if (comments.length === 0) {
            timeline.innerHTML = '<p class="loading-message">No comments yet. Be the first!</p>';
        } else {
            comments.forEach(comment => {
                const commentElement = document.createElement('div');
                commentElement.className = 'comment';
                commentElement.innerHTML = `
                    <div class="comment-header">
                        <span class="comment-user">${escapeHTML(comment.username)}</span>
                        <span class="comment-time">${formatTimeAgo(comment.timestamp)}</span>
                    </div>
                    <p class="comment-message">${escapeHTML(comment.message)}</p>
                `;
                timeline.appendChild(commentElement);
            });
        }
        if (postsCountEl) {
            postsCountEl.textContent = comments.length.toLocaleString();
        }
    };

    function updateVisitCount() {
        let visits = Number(localStorage.getItem('siteVisits')) || 0;
        visits++;
        localStorage.setItem('siteVisits', visits);
        if (visitsCountEl) {
            visitsCountEl.textContent = visits.toLocaleString();
        }
    }

    function formatTimeAgo(isoString) {
        const date = new Date(isoString);
        const seconds = Math.round((Date.now() - date) / 1000);

        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.round(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.round(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.round(hours / 24);
        return `${days}d ago`;
    }

    function escapeHTML(str) {
        const p = document.createElement("p");
        p.appendChild(document.createTextNode(str));
        return p.innerHTML;
    }

    // =======================================================
    // ==  Initializations and Event Listeners              ==
    // =======================================================
    async function initializePage() {
        setupKaomojiCursor();
        makeDraggable(document.getElementById('stats-window'));
        
        pingVisit();
        renderProjects();
        updateVisitCount();
        initializeRecentActivityChart();

        const comments = await fetchComments();
        renderComments(comments);
        
        fetchNowPlaying();
        setInterval(fetchNowPlaying, 30000);
    }
    
    // Event Listeners
    if (postButton) {
        postButton.addEventListener('click', postComment);
    }
    if (commentInput) {
        commentInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postComment(); }
        });
    }
    if (visitsBox) {
        visitsBox.addEventListener('click', showVisitorMap);
    }
    if (closeModalButton) {
        closeModalButton.addEventListener('click', () => mapModal.classList.remove('visible'));
    }
    if (mapModal) {
        mapModal.addEventListener('click', (e) => {
            if (e.target === mapModal) { mapModal.classList.remove('visible'); }
        });
    }

    initializePage();
});