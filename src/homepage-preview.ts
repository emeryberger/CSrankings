/*
  CSRankings - Homepage Preview

  Shows a preview of faculty homepages on hover (desktop only).
*/

namespace CSRankings {

    let previewElement: HTMLElement | null = null;
    let currentUrl: string = '';
    let hoverTimeout: number | null = null;
    let isPreviewHovered: boolean = false;
    const HOVER_DELAY = 300; // ms before showing preview

    /**
     * Check if we're on a wide enough screen for previews.
     */
    function isWideScreen(): boolean {
        return window.innerWidth >= 1000;
    }

    /**
     * Create the preview element if it doesn't exist.
     */
    function ensurePreviewElement(): HTMLElement {
        if (!previewElement) {
            previewElement = document.createElement('div');
            previewElement.className = 'homepage-preview';
            previewElement.innerHTML = '<div class="homepage-preview-content"></div>';
            document.body.appendChild(previewElement);

            // Keep preview visible when hovering over it
            previewElement.addEventListener('mouseenter', () => {
                isPreviewHovered = true;
            });

            previewElement.addEventListener('mouseleave', () => {
                isPreviewHovered = false;
                hidePreview();
            });

            // Make the preview clickable to open the page
            previewElement.addEventListener('click', () => {
                if (currentUrl) {
                    window.open(currentUrl, '_blank');
                }
            });
        }
        return previewElement;
    }

    /**
     * Position the preview near the mouse/element.
     */
    function positionPreview(event: MouseEvent): void {
        if (!previewElement) return;

        const padding = 20;
        const previewWidth = 200;
        const previewHeight = 120;

        // Position next to the ranking window (to the left of the content)
        const rankingWindow = document.getElementById('ranking-window');
        let left = padding;

        if (rankingWindow) {
            const rect = rankingWindow.getBoundingClientRect();
            // Position at the left edge of ranking window, minus preview width
            left = rect.left - previewWidth - padding;
            // If not enough room, position at left edge of viewport
            if (left < padding) {
                left = padding;
            }
        }

        let top = event.clientY - previewHeight / 2;

        if (top < padding) {
            top = padding;
        }
        if (top + previewHeight > window.innerHeight - padding) {
            top = window.innerHeight - previewHeight - padding;
        }

        previewElement.style.left = left + 'px';
        previewElement.style.top = top + 'px';
    }

    /**
     * Show the homepage preview.
     */
    function showPreview(url: string, event: MouseEvent): void {
        if (!isWideScreen()) return;

        const preview = ensurePreviewElement();
        currentUrl = url;

        const content = preview.querySelector('.homepage-preview-content') as HTMLElement;
        if (content) {
            loadPreviewContent(url, content);
        }

        positionPreview(event);
        preview.classList.add('visible');
    }

    /**
     * Show a link card instead of iframe (more reliable).
     */
    function loadPreviewContent(url: string, container: HTMLElement): void {
        let hostname = url;
        try {
            hostname = new URL(url).hostname;
        } catch {
            // Use full URL if parsing fails
        }

        container.innerHTML = `
            <div class="homepage-preview-card">
                <div class="homepage-preview-card-icon">🏠</div>
                <div class="homepage-preview-card-url">${hostname}</div>
                <div class="homepage-preview-card-action">Click to open homepage</div>
            </div>
        `;
    }

    /**
     * Hide the preview.
     */
    function hidePreview(): void {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }

        // Don't hide if mouse is over the preview
        if (isPreviewHovered) return;

        if (previewElement) {
            previewElement.classList.remove('visible');
            // Clear iframe to stop loading
            const content = previewElement.querySelector('.homepage-preview-content');
            if (content) {
                content.innerHTML = '';
            }
        }
        currentUrl = '';
    }

    /**
     * Handle mouseenter on faculty rows.
     */
    function handleFacultyMouseEnter(event: MouseEvent): void {
        const row = event.currentTarget as HTMLElement;
        const url = row.dataset.homepage;

        if (!url || !isWideScreen()) return;

        // Clear any existing timeout
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
        }

        // Delay before showing preview
        hoverTimeout = window.setTimeout(() => {
            showPreview(url, event);
        }, HOVER_DELAY);
    }

    /**
     * Handle mouseleave on faculty rows.
     */
    function handleFacultyMouseLeave(): void {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }

        // Small delay before hiding to allow moving to preview
        setTimeout(() => {
            if (!isPreviewHovered) {
                hidePreview();
            }
        }, 100);
    }

    /**
     * Attach preview handlers to a faculty row element.
     */
    export function attachPreviewHandlers(row: HTMLElement, homepageUrl: string): void {
        row.dataset.homepage = homepageUrl;
        row.addEventListener('mouseenter', handleFacultyMouseEnter);
        row.addEventListener('mouseleave', handleFacultyMouseLeave);
    }

    let currentRowElement: HTMLElement | null = null;
    let hideTimeout: number | null = null;

    /**
     * Schedule showing the preview for a row.
     */
    function scheduleShowPreview(row: HTMLElement, event: MouseEvent): void {
        const url = row.dataset.homepage;
        if (!url || !isWideScreen()) return;

        // Cancel any pending hide
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }

        // Cancel any pending show
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
        }

        currentRowElement = row;

        hoverTimeout = window.setTimeout(() => {
            if (currentRowElement === row) {
                showPreview(url, event);
            }
        }, HOVER_DELAY);
    }

    /**
     * Schedule hiding the preview.
     */
    function scheduleHidePreview(): void {
        // Cancel any pending show
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }

        currentRowElement = null;

        // Small delay before hiding to allow moving to preview
        hideTimeout = window.setTimeout(() => {
            if (!isPreviewHovered && !currentRowElement) {
                hidePreview();
            }
        }, 150);
    }

    /**
     * Initialize homepage preview functionality.
     * Uses mouseover/mouseout for event delegation since mouseenter doesn't bubble.
     */
    export function initHomepagePreview(): void {
        // Use mouseover for event delegation (it bubbles, unlike mouseenter)
        document.body.addEventListener('mouseover', (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const row = target.closest('.faculty-row[data-homepage]') as HTMLElement;

            if (row) {
                scheduleShowPreview(row, event);
            }
        });

        document.body.addEventListener('mouseout', (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const row = target.closest('.faculty-row[data-homepage]') as HTMLElement;
            const relatedTarget = event.relatedTarget as HTMLElement;

            if (row) {
                // Check if moving to another faculty row
                const newRow = relatedTarget?.closest('.faculty-row[data-homepage]') as HTMLElement;
                // Check if moving to the preview
                const toPreview = relatedTarget?.closest('.homepage-preview');

                if (!newRow && !toPreview && !row.contains(relatedTarget)) {
                    scheduleHidePreview();
                }
            }
        });
    }

}
