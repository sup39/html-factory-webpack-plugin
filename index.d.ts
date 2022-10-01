export type Assets = {
    js: string[];
    css: string[];
};
export type HtmlFactory = (source: string, assets: Assets) => string | Promise<string>;
/**
 * @typedef {{
 *   js: string[]
 *   css: string[]
 * }} Assets
 *
 * @typedef {(source: string, assets: Assets)=>string|Promise<string>} HtmlFactory
 */
export class HtmlFactoryWebpackPlugin {
    /**
     * @param {HtmlFactory} parser
     * @param {{
     *   input: string
     *   output: string
     *   chunks?: string[]
     *   excludeChunks?: string[]
     *   jsAssetParser?: (url: string)=>string
     *   cssAssetParser?: (url: string)=>string
     *   noCheckDependencies?: boolean
     *   alwaysEmit?: boolean
     * }} options
     */
    constructor(parser: HtmlFactory, options: {
        input: string;
        output: string;
        chunks?: string[];
        excludeChunks?: string[];
        jsAssetParser?: (url: string) => string;
        cssAssetParser?: (url: string) => string;
        noCheckDependencies?: boolean;
        alwaysEmit?: boolean;
    });
    parser: HtmlFactory;
    options: {
        input: string;
        output: string;
        chunks?: string[];
        excludeChunks?: string[];
        jsAssetParser?: (url: string) => string;
        cssAssetParser?: (url: string) => string;
        noCheckDependencies?: boolean;
        alwaysEmit?: boolean;
    };
    /** @type {null|number} */
    prevTime: null | number;
    prevAssets: {
        js: any[];
        css: any[];
    };
    /** @param {import('webpack').Compiler} compiler */
    apply(compiler: import('webpack').Compiler): void;
}
export declare function makeJsAssetTag(url: string): string;
export declare function makeCssAssetTag(url: string): string;
