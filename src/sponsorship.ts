/*
  CSRankings - Sponsorship Module

  Handles display of sponsorship requests with usage-based triggering.
  Tracks user visits and interactions over time to show sponsorship
  requests to engaged users (similar to Wikipedia's approach).
*/

namespace CSRankings {

    export interface UsageStats {
        visitCount: number;         // Total number of visits/sessions
        firstVisit: number;         // Timestamp of first visit
        lastVisit: number;          // Timestamp of most recent visit
        interactionCount: number;   // Number of checkbox/filter interactions
        sponsorshipShown: boolean;  // Whether sponsorship has been shown
    }

    export interface SponsorshipConfig {
        minVisits: number;           // Minimum visits before showing sponsorship
        minInteractions: number;     // Minimum interactions before showing
        randomChance: number;        // 1 in N chance after thresholds met
        overlayId: string;           // DOM element ID for sponsorship overlay
        storageKey: string;          // localStorage key for usage stats
    }

    const DEFAULT_SPONSORSHIP_CONFIG: SponsorshipConfig = {
        minVisits: 3,                // Show after at least 3 visits
        minInteractions: 10,         // And at least 10 interactions
        randomChance: 3,             // 1 in 3 chance once thresholds met
        overlayId: 'overlay-sponsor',
        storageKey: 'csrankings-usage'
    };

    const DEFAULT_USAGE_STATS: UsageStats = {
        visitCount: 0,
        firstVisit: 0,
        lastVisit: 0,
        interactionCount: 0,
        sponsorshipShown: false
    };

    /**
     * Load usage stats from localStorage.
     */
    function loadUsageStats(storageKey: string): UsageStats {
        const stored = localStorage.getItem(storageKey);
        if (!stored) {
            return { ...DEFAULT_USAGE_STATS };
        }
        try {
            const parsed = JSON.parse(stored);
            return { ...DEFAULT_USAGE_STATS, ...parsed };
        } catch {
            return { ...DEFAULT_USAGE_STATS };
        }
    }

    /**
     * Save usage stats to localStorage.
     */
    function saveUsageStats(storageKey: string, stats: UsageStats): void {
        localStorage.setItem(storageKey, JSON.stringify(stats));
    }

    /**
     * Show the sponsorship overlay.
     */
    function showOverlay(overlayId: string): void {
        const overlay = document.getElementById(overlayId);
        if (overlay) {
            overlay.style.display = 'block';
        }
    }

    /**
     * UsageTracker class to manage usage statistics and sponsorship display.
     * Use the singleton instance via UsageTracker.getInstance().
     */
    export class UsageTracker {
        private static instance: UsageTracker | null = null;
        private config: SponsorshipConfig;
        private stats: UsageStats;

        private constructor(config: Partial<SponsorshipConfig> = {}) {
            this.config = { ...DEFAULT_SPONSORSHIP_CONFIG, ...config };
            this.stats = loadUsageStats(this.config.storageKey);
        }

        /**
         * Get or create the singleton UsageTracker instance.
         */
        public static getInstance(config?: Partial<SponsorshipConfig>): UsageTracker {
            if (!UsageTracker.instance) {
                UsageTracker.instance = new UsageTracker(config);
            }
            return UsageTracker.instance;
        }

        /**
         * Record a new visit/session.
         * Should be called once when the page loads.
         */
        public recordVisit(): void {
            const now = Date.now();
            this.stats.visitCount += 1;
            if (this.stats.firstVisit === 0) {
                this.stats.firstVisit = now;
            }
            this.stats.lastVisit = now;
            this.save();
            console.log(`CSRankings usage: Visit #${this.stats.visitCount}`);
        }

        /**
         * Record a user interaction (checkbox click, filter change, etc.).
         * Call this when the user interacts with the rankings.
         */
        public recordInteraction(): void {
            this.stats.interactionCount += 1;
            this.save();
        }

        /**
         * Get current usage statistics.
         */
        public getStats(): UsageStats {
            return { ...this.stats };
        }

        /**
         * Get a human-readable summary of usage.
         */
        public getUsageSummary(): string {
            const visits = this.stats.visitCount;
            const firstVisit = this.stats.firstVisit
                ? new Date(this.stats.firstVisit).toLocaleDateString()
                : 'never';
            return `You've visited CSRankings ${visits} time${visits !== 1 ? 's' : ''} ` +
                   `since ${firstVisit}.`;
        }

        /**
         * Check if sponsorship thresholds have been met.
         */
        private meetsThresholds(): boolean {
            return this.stats.visitCount >= this.config.minVisits &&
                   this.stats.interactionCount >= this.config.minInteractions;
        }

        /**
         * Attempt to display the sponsorship request.
         * Returns true if displayed, false otherwise.
         *
         * @param skipIfSurveyShown - If true, won't show if survey was just displayed
         */
        public tryDisplaySponsorship(skipIfSurveyShown: boolean = false): boolean {
            // Already shown this session via localStorage flag
            if (this.stats.sponsorshipShown) {
                return false;
            }

            // Skip if survey was just shown
            if (skipIfSurveyShown) {
                return false;
            }

            // Check if usage thresholds are met
            if (!this.meetsThresholds()) {
                console.log(`CSRankings: Sponsorship thresholds not met. ` +
                           `Visits: ${this.stats.visitCount}/${this.config.minVisits}, ` +
                           `Interactions: ${this.stats.interactionCount}/${this.config.minInteractions}`);
                return false;
            }

            // Random chance
            const randomValue = Math.floor(Math.random() * this.config.randomChance);
            if (randomValue !== 0) {
                return false;
            }

            // Show sponsorship
            this.stats.sponsorshipShown = true;
            this.save();
            showOverlay(this.config.overlayId);
            console.log(`CSRankings: Showing sponsorship request. ${this.getUsageSummary()}`);
            return true;
        }

        /**
         * Reset the sponsorship shown flag (e.g., for a new session/year).
         * This allows the sponsorship to be shown again.
         */
        public resetSponsorshipShown(): void {
            this.stats.sponsorshipShown = false;
            this.save();
        }

        /**
         * Save current stats to localStorage.
         */
        private save(): void {
            saveUsageStats(this.config.storageKey, this.stats);
        }

        /**
         * Clear all usage data (for testing/debugging).
         */
        public clearUsageData(): void {
            this.stats = { ...DEFAULT_USAGE_STATS };
            localStorage.removeItem(this.config.storageKey);
            console.log('CSRankings: Usage data cleared.');
        }
    }

    // Convenience functions for common operations

    /**
     * Record a visit and attempt to display sponsorship.
     * Call this once when the app initializes.
     *
     * @param surveyWasShown - Whether a survey was just displayed
     * @returns true if sponsorship was displayed
     */
    export function initSponsorshipTracking(surveyWasShown: boolean = false): boolean {
        const tracker = UsageTracker.getInstance();
        tracker.recordVisit();
        return tracker.tryDisplaySponsorship(surveyWasShown);
    }

    /**
     * Record a user interaction.
     * Call this when user clicks checkboxes, changes filters, etc.
     */
    export function recordUserInteraction(): void {
        UsageTracker.getInstance().recordInteraction();
    }

    /**
     * Get usage statistics summary.
     */
    export function getUsageSummary(): string {
        return UsageTracker.getInstance().getUsageSummary();
    }

}
