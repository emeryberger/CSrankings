/*
  CSRankings - Sponsors Banner

  Fetches and displays GitHub sponsors dynamically.
*/

namespace CSRankings {

    interface GitHubUser {
        login: string;
        avatar_url: string;
        html_url: string;
    }

    const SPONSORS_CONTAINER_ID = 'sponsors-avatars';
    const GITHUB_ORG = 'CSrankings';

    // Cache sponsors in localStorage for 24 hours to reduce API calls
    const CACHE_KEY = 'csrankings-sponsors';
    const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

    interface SponsorsCache {
        timestamp: number;
        sponsors: GitHubUser[];
    }

    /**
     * Load sponsors from localStorage cache if valid.
     */
    function loadCachedSponsors(): GitHubUser[] | null {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;

            const data: SponsorsCache = JSON.parse(cached);
            if (Date.now() - data.timestamp > CACHE_DURATION_MS) {
                localStorage.removeItem(CACHE_KEY);
                return null;
            }
            return data.sponsors;
        } catch {
            return null;
        }
    }

    /**
     * Save sponsors to localStorage cache.
     */
    function cacheSponsors(sponsors: GitHubUser[]): void {
        try {
            const data: SponsorsCache = {
                timestamp: Date.now(),
                sponsors: sponsors
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch {
            // localStorage may be unavailable
        }
    }

    /**
     * Fetch sponsors from GitHub API.
     * Note: GitHub doesn't have a public API for sponsors, so we scrape the sponsors page
     * or use a static list. For now, we'll use the GitHub org members as a fallback.
     */
    async function fetchSponsorsFromPage(): Promise<GitHubUser[]> {
        // GitHub sponsors page doesn't have a public API
        // We'll fetch from a JSON file that can be periodically updated
        try {
            const response = await fetch('sponsors.json');
            if (response.ok) {
                const data = await response.json();
                return data.sponsors || [];
            }
        } catch {
            // Fall back to empty if file doesn't exist
        }
        return [];
    }

    /**
     * Render sponsors to the container.
     */
    function renderSponsors(sponsors: GitHubUser[]): void {
        const container = document.getElementById(SPONSORS_CONTAINER_ID);
        if (!container) return;

        if (sponsors.length === 0) {
            // Hide the container if no sponsors
            container.style.display = 'none';
            return;
        }

        container.innerHTML = sponsors.map(sponsor =>
            `<a href="${sponsor.html_url}" target="_blank" title="${sponsor.login}">` +
            `<img src="${sponsor.avatar_url}" alt="${sponsor.login}"></a>`
        ).join('');
    }

    /**
     * Initialize the sponsors banner.
     */
    export async function initSponsors(): Promise<void> {
        // Try cache first
        const cached = loadCachedSponsors();
        if (cached && cached.length > 0) {
            renderSponsors(cached);
            return;
        }

        // Fetch fresh data
        const sponsors = await fetchSponsorsFromPage();
        if (sponsors.length > 0) {
            cacheSponsors(sponsors);
        }
        renderSponsors(sponsors);
    }

}
