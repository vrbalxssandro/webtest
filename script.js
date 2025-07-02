document.addEventListener('DOMContentLoaded', () => {
    // =======================================================
    // ==  ADD YOUR PROJECTS HERE                           ==
    // =======================================================
    const PROJECTS = [
        {
            title: 'Test project',
            description: 'A fun platformer game built with JavaScript and HTML5 Canvas.',
            image: './images/project-a-thumb.png', // Path to your thumbnail image
            url: './test-project/'               // Path to the project's subfolder
        },
        {
            title: 'Another Project',
            description: 'This is another one of my awesome projects.',
            image: './images/placeholder.png', // Use a placeholder if you don't have one
            url: '#' // Use '#' if the folder isn't ready yet
        }
    ];

    // --- Element Selectors ---
    const projectGrid = document.getElementById('project-grid');
    const timeline = document.getElementById('timeline');
    const postButton = document.getElementById('post-button');
    const usernameInput = document.getElementById('username-input');
    const commentInput = document.getElementById('comment-input');
    const visitsCountEl = document.getElementById('visits-count');
    const postsCountEl = document.getElementById('posts-count');

    // --- API URL ---
    const API_URL = '/api/comments';

    // --- RENDER PROJECTS ---
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

    // --- COMMENTS & STATS LOGIC ---
    async function fetchComments() {
        try {
            const response = await fetch(API_URL);
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
        if (!message) {
            alert('Please enter a message.');
            return;
        }

        postButton.disabled = true;
        postButton.textContent = 'Posting...';
        try {
            const response = await fetch(API_URL, {
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
                    <p class="comment-message">${escapeHTML(comment.message)}</p>`;
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

    // --- Initializations ---
    async function initializePage() {
        renderProjects();
        updateVisitCount();
        const comments = await fetchComments();
        renderComments(comments);
    }
    
    if (postButton) {
        postButton.addEventListener('click', postComment);
    }
    if (commentInput) {
        commentInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { 
                e.preventDefault(); 
                postComment(); 
            }
        });
    }

    initializePage();
});