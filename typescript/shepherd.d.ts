// Type definitions for shepherd.js 11.x
// Project: https://github.com/shepherd-pro/shepherd

declare namespace Shepherd {
    interface StepOptions {
        id?: string;
        title?: string;
        text?: string | HTMLElement | (() => string | HTMLElement);
        attachTo?: {
            element?: string | HTMLElement;
            on?: string;
        };
        buttons?: Button[];
        classes?: string;
        scrollTo?: boolean | ScrollIntoViewOptions;
        cancelIcon?: {
            enabled?: boolean;
            label?: string;
        };
        advanceOn?: {
            selector?: string;
            event?: string;
        };
        beforeShowPromise?: () => Promise<void>;
        when?: {
            show?: () => void;
            hide?: () => void;
            complete?: () => void;
            cancel?: () => void;
        };
        modalOverlayOpeningPadding?: number;
        modalOverlayOpeningRadius?: number;
        highlightClass?: string;
    }

    interface Button {
        text: string;
        action?: () => void;
        classes?: string;
        secondary?: boolean;
        disabled?: boolean;
        label?: string;
    }

    interface TourOptions {
        defaultStepOptions?: Partial<StepOptions>;
        useModalOverlay?: boolean;
        exitOnEsc?: boolean;
        keyboardNavigation?: boolean;
        tourName?: string;
        steps?: StepOptions[];
    }

    class Step {
        id: string;
        tour: Tour;
        show(): void;
        hide(): void;
        isOpen(): boolean;
        cancel(): void;
        complete(): void;
        destroy(): void;
        scrollTo(): void;
        updateStepOptions(options: StepOptions): void;
    }

    class Tour {
        constructor(options?: TourOptions);
        addStep(options: StepOptions): Step;
        addSteps(steps: StepOptions[]): Tour;
        getById(id: string): Step | undefined;
        getCurrentStep(): Step | undefined;
        start(): void;
        next(): void;
        back(): void;
        cancel(): void;
        complete(): void;
        hide(): void;
        show(id?: string): void;
        isActive(): boolean;
        on(event: string, handler: () => void): void;
        off(event: string, handler?: () => void): void;
        once(event: string, handler: () => void): void;
    }
}

declare var Shepherd: {
    Tour: typeof Shepherd.Tour;
    Step: typeof Shepherd.Step;
};

export = Shepherd;
export as namespace Shepherd;
