// @ts-check
const webpack = require('webpack');
const path = require('path');
const fs = require('fs/promises');

/**
 * @typedef {{
 *   js: string[]
 *   css: string[]
 * }} Assets
 *
 * @typedef {(source: string, assets: Assets)=>string|Promise<string>} HtmlFactory
 */

class HtmlFactoryWebpackPlugin {
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
  constructor(parser, options) {
    this.parser = parser;
    this.options = {
      input: path.resolve(options.input),
      ...options,
    };
    /** @type {null|number} */
    this.prevTime = null;
    this.prevAssets = {js: [], css: []};
  }

  /** @param {import('webpack').Compiler} compiler */
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('HtmlFactoryWebpackPlugin', compilation => {
      compilation.hooks.processAssets.tapAsync({
        name: 'HtmlFactoryWebpackPlugin',
        // after minification and dev tooling is done
        stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
      }, async (compilationAssets, callback) => {
        const {options, prevTime, prevAssets} = this;
        const {input, output, noCheckDependencies, alwaysEmit} = options;
        compilation.fileDependencies.add(this.options.input);

        // skip
        const tInfo = compiler.fileTimestamps?.get(input);
        const t = typeof tInfo === 'object' ? tInfo.timestamp : null;
        const sameTime = !alwaysEmit && prevTime != null && (t == null || t === prevTime);
        if (sameTime && noCheckDependencies) return callback();

        const chunks = options.chunks ?? compilation.entrypoints.keys();
        const excludeChunks = new Set(options.excludeChunks ?? []);

        const outdir = path.dirname(output);
        /** @type {Assets} */
        const assets = {
          js: [],
          css: [],
        };
        for (const entry of chunks) {
          if (excludeChunks.has(entry)) continue;
          const files = compilation.entrypoints.get(entry).getFiles();
          for (const file of files) {
            const ext = file.split('.').slice(-1)[0];
            if (assets[ext] == null) {
              console.warn(`Unsupported asset: ${file}`);
            } else {
              assets[ext].push(path.relative(outdir, file));
            }
          }
        }

        const sameAssets = Object.entries(assets).every(([k, arr1]) => {
          const arr2 = prevAssets[k];
          return arr2 && arr1.length === arr2.length && arr1.every((e, i) => e===arr2[i]);
        });
        if (sameTime && sameAssets) return callback();

        const source = (await fs.readFile(input)).toString();
        const html = await this.parser(source, assets);
        compilation.emitAsset(output, new webpack.sources.RawSource(html, false));

        // done
        if (t != null) this.prevTime = t;
        this.prevAssets = assets;
        callback();
      });
    });
  }
}

module.exports = {
  HtmlFactoryWebpackPlugin,
  makeJsAssetTag: (/**@type{string}*/url) =>
    `<script src="${encodeURI(url)}"></script>`,
  makeCssAssetTag: (/**@type{string}*/url) =>
    `<link rel="stylesheet" type="text/css" href="${encodeURI(url)}">`,
};
