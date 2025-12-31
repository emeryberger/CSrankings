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
            previewElement.innerHTML = `
                <div class="homepage-preview-header">
                    <span class="homepage-preview-url"></span>
                    <a class="homepage-preview-open" href="#" target="_blank">Open</a>
                </div>
                <div class="homepage-preview-content">
                    <div class="homepage-preview-loading">Loading preview...</div>
                </div>
            `;
            document.body.appendChild(previewElement);

            // Keep preview visible when hovering over it
            previewElement.addEventListener('mouseenter', () => {
                isPreviewHovered = true;
            });

            previewElement.addEventListener('mouseleave', () => {
                isPreviewHovered = false;
                hidePreview();
            });

            // Make the preview itself clickable to open the page
            previewElement.addEventListener('click', (e) => {
                if (currentUrl && !(e.target as HTMLElement).closest('.homepage-preview-open')) {
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
        const previewWidth = 400;
        const previewHeight = 300;

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

        // Update URL display and open link
        const urlDisplay = preview.querySelector('.homepage-preview-url') as HTMLElement;
        const openLink = preview.querySelector('.homepage-preview-open') as HTMLAnchorElement;

        if (urlDisplay) {
            try {
                urlDisplay.textContent = new URL(url).hostname;
            } catch {
                urlDisplay.textContent = url;
            }
        }
        if (openLink) {
            openLink.href = url;
        }

        // Show loading state first
        const content = preview.querySelector('.homepage-preview-content') as HTMLElement;
        if (content) {
            content.innerHTML = '<div class="homepage-preview-loading">Loading preview...</div>';
        }

        positionPreview(event);
        preview.classList.add('visible');

        // Try to load iframe
        loadPreviewContent(url, content);
    }

    /**
     * Load the preview content (iframe or error message).
     */
    function loadPreviewContent(url: string, container: HTMLElement): void {
        const iframe = document.createElement('iframe');
        iframe.sandbox.add('allow-scripts', 'allow-same-origin');

        let loaded = false;

        iframe.onload = () => {
            loaded = true;
            // Check if iframe actually loaded content
            try {
                // This will throw if blocked by X-Frame-Options
                const doc = iframe.contentDocument || iframe.contentWindow?.document;
                if (!doc || !doc.body || doc.body.innerHTML === '') {
                    showPreviewError(container, url);
                }
            } catch {
                // Cross-origin, can't check but iframe might still render
            }
        };

        iframe.onerror = () => {
            showPreviewError(container, url);
        };

        // Timeout for slow loads or blocked frames
        setTimeout(() => {
            if (!loaded && container.querySelector('.homepage-preview-loading')) {
                showPreviewError(container, url);
            }
        }, 3000);

        iframe.src = url;
        container.innerHTML = '';
        container.appendChild(iframe);
    }

    /**
     * Show error message when iframe can't load.
     */
    function showPreviewError(container: HTMLElement, url: string): void {
        container.innerHTML = `
            <div class="homepage-preview-error">
                <div>Preview not available</div>
                <a href="${url}" target="_blank">Click to open in new tab</a>
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
