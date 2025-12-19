/*
  CSRankings - Survey Module

  Handles display of user surveys with configurable frequency.
*/

namespace CSRankings {

    export interface SurveyConfig {
        frequency: number;        // One out of this many users gets the survey
        overlayId: string;        // DOM element ID for the survey overlay
        storageKey: string;       // localStorage key to track if shown
        cookieKey?: string;       // Optional cookie key for backwards compatibility
        disabled?: boolean;       // If true, survey is disabled
    }

    const DEFAULT_SURVEY_CONFIG: SurveyConfig = {
        frequency: 1000000,       // One out of this many users gets the survey (on average)
        overlayId: 'overlay-survey',
        storageKey: 'surveyDisplayed',
        cookieKey: 'surveyDisplayed',
        disabled: true            // Currently disabled
    };

    /**
     * Check if survey has already been shown to this user.
     * Checks both localStorage and cookies for backwards compatibility.
     */
    function hasBeenShown(config: SurveyConfig): boolean {
        // Check localStorage
        if (localStorage.getItem(config.storageKey)) {
            return true;
        }

        // Check cookie for backwards compatibility
        if (config.cookieKey) {
            const cookieMatch = document.cookie
                .split('; ')
                .find(row => row.startsWith(config.cookieKey + '='));
            if (cookieMatch) {
                return true;
            }
        }

        return false;
    }

    /**
     * Mark the survey as shown in localStorage.
     */
    function markAsShown(config: SurveyConfig): void {
        localStorage.setItem(config.storageKey, 'true');
    }

    /**
     * Show the survey overlay.
     */
    function showOverlay(config: SurveyConfig): void {
        const overlay = document.getElementById(config.overlayId);
        if (overlay) {
            overlay.style.display = 'block';
        }
    }

    /**
     * Attempt to display the survey to the user.
     * Returns true if the survey was displayed, false otherwise.
     */
    export function tryDisplaySurvey(config: Partial<SurveyConfig> = {}): boolean {
        const fullConfig = { ...DEFAULT_SURVEY_CONFIG, ...config };

        // Check if disabled
        if (fullConfig.disabled) {
            return false;
        }

        // Check if already shown
        if (hasBeenShown(fullConfig)) {
            return false;
        }

        // Random chance to show
        const randomValue = Math.floor(Math.random() * fullConfig.frequency);
        if (randomValue !== 0) {
            return false;
        }

        // Show the survey
        markAsShown(fullConfig);
        showOverlay(fullConfig);
        return true;
    }

}
