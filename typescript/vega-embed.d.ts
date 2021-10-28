// This is an incomplete implementation of vega-embed.d.ts.

interface VlSpec {
    $schema: string,
    data?: object,
    mark?: string,
    encoding?: object,
    width?: number,
    height?: number,
    padding?: object
};

declare function vegaEmbed(
    el: HTMLElement | string,
    spec: VlSpec | string,
    opts?: {actions?: boolean}):
    Promise<Result>;
