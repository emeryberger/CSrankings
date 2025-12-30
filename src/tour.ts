/*
  CSRankings - Interactive Tour for Newcomers

  A friendly, step-by-step walkthrough oriented toward prospective
  graduate students looking for PhD advisors.
*/

/// <reference path="../typescript/shepherd.d.ts" />

namespace CSRankings {

    const TOUR_STORAGE_KEY = 'csrankings-tour-completed';

    let tourInstance: Shepherd.Tour | null = null;

    // Get current chart icon based on user's chart type selection
    function getChartIcon(): string {
        const chartType = (document.getElementById('charttype') as HTMLSelectElement)?.value || 'bar';
        return chartType === 'pie' ? 'png/piechart.png' : 'png/barchart.png';
    }

    // Generate a mock chart matching the actual Vega charts
    // Areas sorted alphabetically, colors by category (AI=#377eb8, Systems=#ff7f00, Theory=#4daf4a,Tic.=#984ea3)
    function getMockChart(): string {
        const chartType = (document.getElementById('charttype') as HTMLSelectElement)?.value || 'bar';

        // Simulated data: Jane Doe has pubs in ML (8), NLP (3),Tic. Vis. (1)
        // Areas sorted alphabetically, colors: AI=#377eb8, Systems=#ff7f00, Theory=#4daf4a,Tic.=#984ea3
        const areas = [
            { name: 'AI', value: 0, color: '#377eb8' },
            { name: 'Arch', value: 0, color: '#ff7f00' },
            { name: 'Comp. Bio', value: 0, color: '#984ea3' },
            { name: 'Crypto', value: 0, color: '#4daf4a' },
            { name: 'CSEd', value: 0, color: '#984ea3' },
            { name: 'DB', value: 0, color: '#ff7f00' },
            { name: 'ECom', value: 0, color: '#984ea3' },
            { name: 'EDA', value: 0, color: '#ff7f00' },
            { name: 'Embedded', value: 0, color: '#ff7f00' },
            { name: 'Graphics', value: 0, color: '#984ea3' },
            { name: 'HCI', value: 0, color: '#984ea3' },
            { name: 'HPC', value: 0, color: '#ff7f00' },
            { name: 'Logic', value: 0, color: '#4daf4a' },
            { name: 'Metrics', value: 0, color: '#ff7f00' },
            { name: 'ML', value: 8, color: '#377eb8' },
            { name: 'Mobile', value: 0, color: '#ff7f00' },
            { name: 'Networks', value: 0, color: '#ff7f00' },
            { name: 'NLP', value: 3, color: '#377eb8' },
            { name: 'OS', value: 0, color: '#ff7f00' },
            { name: 'PL', value: 0, color: '#ff7f00' },
            { name: 'Robotics', value: 0, color: '#984ea3' },
            { name: 'SE', value: 0, color: '#ff7f00' },
            { name: 'Security', value: 0, color: '#ff7f00' },
            { name: 'Theory', value: 0, color: '#4daf4a' },
            { name: 'Vision', value: 0, color: '#377eb8' },
            { name: 'Visualization', value: 1, color: '#984ea3' },
            { name: 'Web+IR', value: 0, color: '#377eb8' }
        ];

        if (chartType === 'pie') {
            // Pie chart - only show slices for non-zero values
            const total = areas.reduce((sum, a) => sum + a.value, 0);
            const withValues = areas.filter(a => a.value > 0);
            let cumulativeAngle = 0;
            let slices = '';

            withValues.forEach(area => {
                const angle = (area.value / total) * 360;
                const startAngle = cumulativeAngle;
                const endAngle = cumulativeAngle + angle;
                cumulativeAngle = endAngle;

                // SVG arc for pie slice
                const startRad = (startAngle - 90) * Math.PI / 180;
                const endRad = (endAngle - 90) * Math.PI / 180;
                const x1 = 40 + 35 * Math.cos(startRad);
                const y1 = 40 + 35 * Math.sin(startRad);
                const x2 = 40 + 35 * Math.cos(endRad);
                const y2 = 40 + 35 * Math.sin(endRad);
                const largeArc = angle > 180 ? 1 : 0;

                slices += `<path d="M40,40 L${x1},${y1} A35,35 0 ${largeArc},1 ${x2},${y2} Z" fill="${area.color}"/>`;
            });

            return `
                <div style="background:#fff; margin:10px 0; padding:8px; display:flex; align-items:center; gap:16px;">
                    <svg width="80" height="80" viewBox="0 0 80 80">${slices}</svg>
                    <div style="font-size:10px; color:#666;">
                        ${withValues.map(a => `<div><span style="display:inline-block;width:10px;height:10px;background:${a.color};margin-right:4px;"></span>${a.name}: ${a.value}</div>`).join('')}
                    </div>
                </div>
            `;
        } else {
            // Bar chart - show all areas, bars only for non-zero
            const maxVal = 8;
            const barWidth = 14;
            const gap = 1;

            return `
                <div style="background:#fff; margin:10px 0; padding:4px; overflow-x:auto;">
                    <div style="display:flex; align-items:flex-end; height:50px; gap:${gap}px; border-bottom:1px solid #ccc;">
                        ${areas.map(a => `<div style="background:${a.value > 0 ? a.color : 'transparent'}; width:${barWidth}px; height:${(a.value / maxVal) * 45}px; min-height:${a.value > 0 ? 2 : 0}px;"></div>`).join('')}
                    </div>
                    <div style="display:flex; gap:${gap}px; padding-top:2px;">
                        ${areas.map(a => `<div style="width:${barWidth}px; font-size:6px; text-align:center; color:#666; writing-mode:vertical-rl; transform:rotate(180deg); height:40px; overflow:hidden;">${a.name}</div>`).join('')}
                    </div>
                </div>
            `;
        }
    }

    // Mock faculty entry HTML for illustration
    // highlight: 'name' | 'areas' | 'home' | 'scholar' | 'dblp' | 'chart' | null
    function getMockFacultyEntry(highlight?: string): string {
        const chartIcon = getChartIcon();
        const hl = (part: string) => highlight === part ? 'background:#fff3cd; padding:2px 4px; border-radius:3px;' : '';
        return `
            <div style="background:#f9f9f9; border:1px solid #ddd; border-radius:4px; padding:10px; margin:10px 0; font-size:13px; line-height:1.8;">
                <span style="${hl('name')}"><a href="#" onclick="return false;" style="color:#337ab7; font-weight:500;">Jane Doe</a></span>
                <span style="font-variant:small-caps; color:#666; margin-left:6px; ${hl('areas')}">ml</span>
                <span style="margin-left:8px; ${hl('scholar')}"><img src="scholar-favicon.ico" alt="Google Scholar" style="height:12px;"></span>
                <span style="${hl('dblp')}"><img src="dblp.png" alt="DBLP" style="height:12px; margin-left:4px;"></span>
                <span style="${hl('chart')}"><img src="${chartIcon}" alt="chart" style="height:12px; margin-left:4px; cursor:pointer;"></span>
                <span style="color:#666; margin-left:12px;">12.3</span>
            </div>
        `;
    }

    function createTourSteps(): Shepherd.StepOptions[] {
        return [
            // Step 1: Welcome (centered)
            {
                id: 'welcome',
                title: 'Welcome to CSRankings',
                text: `
                    <p>Looking for a PhD in Computer Science? You're in the right place.</p>
                    <p>This site helps you find <strong>research-active faculty</strong> in your area of interest.</p>
                `,
                buttons: [
                    {
                        text: 'Skip',
                        action: function() { tourInstance?.cancel(); },
                        secondary: true
                    },
                    {
                        text: 'Show Me How',
                        action: function() { tourInstance?.next(); }
                    }
                ],
                classes: 'shepherd-centered'
            },
            // Step 2: Key Insight
            {
                id: 'key-insight',
                title: 'Think Labs, Not Schools',
                text: `
                    <p>For a PhD, you're really applying to work with a <strong>specific professor or lab</strong>, not just a department.</p>
                    <p>A school strong in one area may not be strong in yours. Focus on finding faculty whose research matches your interests.</p>
                `,
                attachTo: {
                    element: '.intro-panel',
                    on: 'bottom'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function() { tourInstance?.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function() { tourInstance?.next(); }
                    }
                ]
            },
            // Step 3: Pick Your Region (controls row - left)
            {
                id: 'region',
                title: 'Filter by Region',
                text: `
                    <p>Looking at specific countries? Use the region filter.</p>
                    <p>Or keep it on "World" to see global options.</p>
                `,
                attachTo: {
                    element: '#custom-region-dropdown',
                    on: 'bottom'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function() { tourInstance?.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function() { tourInstance?.next(); }
                    }
                ]
            },
            // Step 4: Year Range (controls row - middle)
            {
                id: 'year-range',
                title: 'Find Active Researchers',
                text: `
                    <p>Use the year range to focus on <strong>recent publications</strong>.</p>
                    <p>Professors who haven't published recently may be focusing on administration, startups, or other duties - and may not be taking new students.</p>
                `,
                attachTo: {
                    element: '.year-slider-container',
                    on: 'bottom'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function() { tourInstance?.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function() { tourInstance?.next(); }
                    }
                ]
            },
            // Step 5: Focus on YOUR Area (controls row - right)
            {
                id: 'focus-area',
                title: 'Focus on Your Area',
                text: `
                    <p>Focus on your specific areas of interest.</p>
                    <p>For example, if you want to do research in Systems, select just that area and deselect the others.</p>
                `,
                attachTo: {
                    element: '.area-indicators',
                    on: 'bottom'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function() { tourInstance?.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function() { tourInstance?.next(); }
                    }
                ]
            },
            // Step 6: Drill Down into Areas (left sidebar)
            {
                id: 'drill-down',
                title: 'Drill Down into Sub-Areas',
                text: `
                    <p>Instead of just looking at broad categories, these checkboxes let you drill down your search to researchers in specific sub-areas.</p>
                    <p>Click the <b>▶</b> arrow next to any area to expand it and see individual conferences. This lets you focus on exactly the venues that matter to you.</p>
                `,
                attachTo: {
                    element: '#ai_toggle',
                    on: 'right'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function() { tourInstance?.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function() { tourInstance?.next(); }
                    }
                ]
            },
            // Step 6: Faculty Name = Homepage Link
            {
                id: 'faculty-name',
                title: 'Faculty Names Are Links',
                text: function() {
                    return `
                    <p>Click any <strong>school name</strong> to expand and see its faculty.</p>
                    <p>Each faculty <strong>name</strong> is a link to their homepage. You can also click the <img src="png/house-logo.png" alt="home" style="height:14px;vertical-align:middle;"> icon:</p>
                    ${getMockFacultyEntry('name')}
                `;
                },
                attachTo: {
                    element: '#success',
                    on: 'top'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function() { tourInstance?.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function() { tourInstance?.next(); }
                    }
                ]
            },
            // Step 7: Research Areas
            {
                id: 'research-areas',
                title: 'Research Areas',
                text: function() {
                    return `
                    <p>Next to each name, you'll see their main <strong>research areas</strong> in small caps:</p>
                    ${getMockFacultyEntry('areas')}
                    <p>This gives you a quick sense of their focus and expertise.</p>
                `;
                },
                attachTo: {
                    element: '#success',
                    on: 'top'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function() { tourInstance?.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function() { tourInstance?.next(); }
                    }
                ]
            },
            // Step 8: Google Scholar
            {
                id: 'google-scholar',
                title: 'Google Scholar',
                text: function() {
                    return `
                    <p>The <img src="scholar-favicon.ico" alt="Google Scholar" style="height:14px;vertical-align:middle;"> icon links to their Google Scholar profile:</p>
                    ${getMockFacultyEntry('scholar')}
                    <p>Google Scholar shows all their papers, citation counts, and recent activity.</p>
                `;
                },
                attachTo: {
                    element: '#success',
                    on: 'top'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function() { tourInstance?.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function() { tourInstance?.next(); }
                    }
                ]
            },
            // Step 9: DBLP
            {
                id: 'dblp',
                title: 'DBLP',
                text: function() {
                    return `
                    <p>The <img src="dblp.png" alt="DBLP" style="height:14px;vertical-align:middle;"> icon links to DBLP, the CS bibliography:</p>
                    ${getMockFacultyEntry('dblp')}
                    <p>DBLP shows publication venues, co-authors, and collaborators.</p>
                `;
                },
                attachTo: {
                    element: '#success',
                    on: 'top'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function() { tourInstance?.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function() { tourInstance?.next(); }
                    }
                ]
            },
            // Step 10: Chart Icon
            {
                id: 'chart-icon',
                title: 'Publication Breakdown',
                text: function() {
                    const chartIcon = getChartIcon();
                    return `
                    <p>Click the <img src="${chartIcon}" alt="chart" style="height:14px;vertical-align:middle;"> icon to see a breakdown of their publications by research area:</p>
                    ${getMockFacultyEntry('chart')}
                    ${getMockChart()}
                `;
                },
                attachTo: {
                    element: '#success',
                    on: 'top'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function() { tourInstance?.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function() { tourInstance?.next(); }
                    }
                ]
            },
            // Step 10: Don't Obsess Over Scores
            {
                id: 'scores-warning',
                title: "Don't Compare Scores",
                text: `
                    <p>If two schools score 20.2 and 19.0, that doesn't mean one is "better."</p>
                    <p>Look at the <strong>actual faculty</strong> at both places. A student might thrive with professors at one school but not another - it's very personal.</p>
                `,
                attachTo: {
                    element: '#success',
                    on: 'top'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function() { tourInstance?.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function() { tourInstance?.next(); }
                    }
                ]
            },
            // Step 11: Do Your Homework
            {
                id: 'homework',
                title: 'Before You Reach Out',
                text: `
                    <p>Once you find interesting faculty:</p>
                    <ul>
                        <li>Read 2-3 of their recent papers</li>
                        <li>Check their homepage for "prospective students" info</li>
                        <li>Understand their research style and focus</li>
                    </ul>
                    <p>Send a <strong>personalized</strong> email showing you've done your homework - and always apply through the official system too.</p>
                `,
                attachTo: {
                    element: '.intro-panel',
                    on: 'bottom'
                },
                buttons: [
                    {
                        text: 'Back',
                        action: function() { tourInstance?.back(); },
                        secondary: true
                    },
                    {
                        text: 'Next',
                        action: function() { tourInstance?.next(); }
                    }
                ]
            },
            // Step 9: You're Ready (centered)
            {
                id: 'ready',
                title: "You're Ready",
                text: `
                    <p>Remember: the right advisor matters more than the school's ranking. You can have a great career at many excellent programs.</p>
                    <p>Focus on <strong>finding the right advisor</strong>, not the highest-ranked school.</p>
                    <p class="tour-keyboard-hint">Click "Tour" anytime to replay this guide.</p>
                `,
                buttons: [
                    {
                        text: 'Back',
                        action: function() { tourInstance?.back(); },
                        secondary: true
                    },
                    {
                        text: 'Get Started',
                        action: function() { tourInstance?.complete(); }
                    }
                ],
                classes: 'shepherd-centered'
            }
        ];
    }

    function createTour(): Shepherd.Tour {
        try {
            console.log('Creating Shepherd.Tour...');
            const tour = new Shepherd.Tour({
                useModalOverlay: true,
                exitOnEsc: true,
                keyboardNavigation: true,
                defaultStepOptions: {
                    cancelIcon: {
                        enabled: true
                    },
                    scrollTo: { behavior: 'smooth', block: 'center' },
                    modalOverlayOpeningPadding: 8,
                    modalOverlayOpeningRadius: 4
                }
            });
            console.log('Tour created, adding steps...');

            // Add all steps
            const steps = createTourSteps();
            tour.addSteps(steps);
            console.log('Steps added:', steps.length);

            // Mark tour as completed when finished or cancelled
            tour.on('complete', () => {
                localStorage.setItem(TOUR_STORAGE_KEY, 'true');
            });
            tour.on('cancel', () => {
                localStorage.setItem(TOUR_STORAGE_KEY, 'true');
            });

            return tour;
        } catch (e) {
            console.error('Error creating tour:', e);
            throw e;
        }
    }

    /**
     * Check if the tour has been completed before
     */
    function hasCompletedTour(): boolean {
        return localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
    }

    /**
     * Initialize the tour - called on page load.
     * Auto-starts on first visit, otherwise waits for user action.
     */
    export function initTour(): void {
        console.log('initTour called, Shepherd available:', typeof Shepherd !== 'undefined');

        // Only initialize if Shepherd is available
        if (typeof Shepherd === 'undefined') {
            console.warn('Shepherd.js not loaded - tour disabled');
            return;
        }

        tourInstance = createTour();

        // Auto-start on first visit (with a small delay for page to settle)
        if (!hasCompletedTour()) {
            setTimeout(() => {
                tourInstance?.start();
            }, 1000);
        }
    }

    /**
     * Start the tour manually (called from Help button)
     */
    export function startTour(): void {
        console.log('startTour called, tourInstance:', tourInstance, 'Shepherd:', typeof Shepherd);
        if (!tourInstance) {
            if (typeof Shepherd !== 'undefined') {
                tourInstance = createTour();
            } else {
                console.warn('Shepherd.js not loaded - tour disabled');
                return;
            }
        }
        console.log('Starting tour...');
        tourInstance.start();
    }

    /**
     * Reset tour completion status (for testing)
     */
    export function resetTourStatus(): void {
        localStorage.removeItem(TOUR_STORAGE_KEY);
        console.log('Tour status reset - will show on next page load');
    }

}
