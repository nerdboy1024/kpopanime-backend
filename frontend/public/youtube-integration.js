// ===========================
// YOUTUBE INTEGRATION
// ===========================

const YOUTUBE_CHANNEL_ID = 'UC6iQFHx8Lr2VCH7s25ifhDg';

async function checkForLiveStream() {
    // For now, we'll disable live stream auto-detection since it requires API
    // When you go live, the RSS feed will include the stream
    // To enable auto-detection, you'd need YouTube Data API v3
    return null;
}

async function loadYouTubeVideos() {
    // Fetch videos using PHP proxy to bypass CORS
    try {
        // First, check for live stream
        const liveStream = await checkForLiveStream();

        // Use PHP proxy to fetch YouTube RSS feed (works both locally and in production)
        const apiUrl = window.location.hostname === 'localhost'
            ? `http://localhost:8081/api/youtube-feed.php?channel_id=${YOUTUBE_CHANNEL_ID}`
            : `/api/youtube-feed.php?channel_id=${YOUTUBE_CHANNEL_ID}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch videos');
        }

        const videos = data.videos || [];

        if (videos.length === 0 && !liveStream) {
            console.log('No videos found on YouTube channel yet');

            // Show "coming soon" message for new channel
            const latestVideoDiv = document.querySelector('.latest-video');
            if (latestVideoDiv) {
                latestVideoDiv.innerHTML = `
                    <div class="video-wrapper">
                        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #2d0a1f 0%, #1a0a14 100%); border-radius: 10px; min-height: 400px;">
                            <div style="text-align: center; color: #FF69B4; padding: 2rem;">
                                <div style="font-size: 4rem; margin-bottom: 1rem;">🎬✨</div>
                                <h3 style="font-family: 'Cinzel', serif; font-size: 1.8rem; margin-bottom: 1rem; color: #f3f4f6;">Coming Soon!</h3>
                                <p style="font-size: 1.1rem; margin-bottom: 2rem; max-width: 400px; line-height: 1.6;">
                                    Mystical content is on the way! Subscribe to be notified when new videos drop.
                                </p>
                                <a href="https://youtube.com/@chordevacave?sub_confirmation=1" target="_blank"
                                   style="display: inline-block; padding: 1rem 2rem; background: linear-gradient(135deg, #FF1493, #C71585);
                                          color: white; text-decoration: none; border-radius: 10px; font-weight: 600;
                                          transition: transform 0.3s; font-family: 'Cinzel', serif;">
                                    🔔 Subscribe to Chordeva Cave
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="video-info">
                        <h3>Mystical Content Coming Soon</h3>
                        <p>The Chordeva Cave channel is brand new! Videos featuring crystals, tarot, occult wisdom, and feline familiars are coming soon.</p>
                        <div class="video-meta">
                            <span>📺 <a href="https://youtube.com/@chordevacave" target="_blank" style="color: #FF1493; text-decoration: none;">Visit Channel →</a></span>
                        </div>
                    </div>
                `;
            }

            return;
        }

        // Prioritize live stream, otherwise use latest video
        let videoToDisplay;
        let isLive = false;

        if (liveStream) {
            videoToDisplay = liveStream;
            isLive = true;
            console.log('🔴 Live stream detected!');
        } else if (videos.length > 0) {
            const latestVideo = videos[0];
            videoToDisplay = {
                videoId: latestVideo.videoId,
                title: latestVideo.title,
                published: new Date(latestVideo.published)
            };
        }

        // Update latest video/live stream embed
        const latestVideoDiv = document.querySelector('.latest-video');
        if (latestVideoDiv && videoToDisplay) {
            if (isLive) {
                // Display live stream
                latestVideoDiv.innerHTML = `
                    <div class="video-wrapper">
                        <iframe
                            width="100%"
                            height="100%"
                            src="${videoToDisplay.embedUrl}"
                            title="${videoToDisplay.title}"
                            frameborder="0"
                            allow="autoplay; encrypted-media; picture-in-picture; web-share"
                            allowfullscreen
                            referrerpolicy="strict-origin-when-cross-origin">
                        </iframe>
                    </div>
                    <div class="video-info">
                        <h3>
                            <span style="background: #ff0000; color: white; padding: 0.25rem 0.75rem; border-radius: 5px; font-size: 0.9rem; margin-right: 0.5rem;">
                                🔴 LIVE
                            </span>
                            ${videoToDisplay.title}
                        </h3>
                        <div class="video-meta">
                            <span style="color: #ff0000; font-weight: bold;">Currently streaming</span>
                        </div>
                        <a href="${videoToDisplay.watchUrl}" target="_blank" class="btn btn-secondary" style="margin-top: 1rem; background: #ff0000; border-color: #ff0000;">
                            Join Live Stream
                        </a>
                    </div>
                `;
            } else {
                // Display latest uploaded video
                const formattedDate = videoToDisplay.published.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                });

                latestVideoDiv.innerHTML = `
                    <div class="video-wrapper">
                        <iframe
                            width="100%"
                            height="100%"
                            src="https://www.youtube.com/embed/${videoToDisplay.videoId}"
                            title="${videoToDisplay.title}"
                            frameborder="0"
                            allow="autoplay; encrypted-media; picture-in-picture; web-share"
                            allowfullscreen
                            referrerpolicy="strict-origin-when-cross-origin">
                        </iframe>
                    </div>
                    <div class="video-info">
                        <h3>Latest: ${videoToDisplay.title}</h3>
                        <div class="video-meta">
                            <span>📅 ${formattedDate}</span>
                        </div>
                        <a href="https://www.youtube.com/watch?v=${videoToDisplay.videoId}" target="_blank" class="btn btn-secondary" style="margin-top: 1rem;">Watch on YouTube</a>
                    </div>
                `;
            }
        }

        // Update video grid with next 3 videos
        const videoGrid = document.querySelector('.video-grid');
        if (videoGrid && videos.length > 1) {
            videoGrid.innerHTML = '';

            // Show next 3 videos (skip the first one since it's the latest)
            for (let i = 1; i < Math.min(4, videos.length); i++) {
                const video = videos[i];
                const videoId = video.videoId;
                const title = video.title;
                const published = new Date(video.published);
                const thumbnail = video.thumbnail || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

                const formattedDate = published.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                });

                const videoCard = document.createElement('div');
                videoCard.className = 'video-card';
                videoCard.innerHTML = `
                    <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank">
                        <div class="video-thumbnail">
                            <img src="${thumbnail}" alt="${title}">
                            <div class="play-icon">▶</div>
                        </div>
                        <h4>${title}</h4>
                        <p class="video-date">${formattedDate}</p>
                    </a>
                `;

                videoGrid.appendChild(videoCard);
            }
        }

        if (isLive) {
            console.log(`✓ Displaying LIVE STREAM + ${videos.length} recent videos from channel`);
        } else {
            console.log(`✓ Loaded ${videos.length} YouTube videos from channel`);
        }

    } catch (error) {
        console.error('Error loading YouTube videos:', error);
        console.log('Keeping placeholder content');
    }
}

// Load YouTube videos on page load
document.addEventListener('DOMContentLoaded', () => {
    loadYouTubeVideos();
});
