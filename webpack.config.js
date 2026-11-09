const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const contact = require('./src/contact.json');

const CONTACT_PATH = path.resolve(__dirname, 'src/contact.json');
const PHOTO_PATH = path.resolve(__dirname, 'src', contact.photo);
const SW_PATH = path.resolve(__dirname, 'src/sw.js');
const VCARD_FILE = `${contact.firstName}-${contact.lastName}.vcf`.toLowerCase();

// vCard escaping and 75-char line folding.
const esc = (value) => String(value).replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
const fold = (line) => line.match(/.{1,74}/g).join('\r\n ');

function buildVCard(info, photoBase64) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${esc(info.lastName)};${esc(info.firstName)};;;${esc(info.credentials)}`,
    `FN:${esc(`${info.name}, ${info.credentials}`)}`,
    `ORG:${esc(info.university)};${esc(info.org)}`,
    `TITLE:${esc(info.role)}`,
    `EMAIL;TYPE=INTERNET,WORK:${info.email}`,
    `URL:${info.siteUrl}`,
    `item1.URL:${info.linkedin}`,
    'item1.X-ABLabel:LinkedIn',
    `item2.URL:${info.github}`,
    'item2.X-ABLabel:GitHub',
    `PHOTO;ENCODING=b;TYPE=JPEG:${photoBase64}`,
    'END:VCARD',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

// Emits the Save contact vCard.
class VCardPlugin {
  apply(compiler) {
    const { Compilation, sources } = compiler.webpack;
    compiler.hooks.thisCompilation.tap('VCardPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        { name: 'VCardPlugin', stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL },
        () => {
          compilation.fileDependencies.add(CONTACT_PATH);
          compilation.fileDependencies.add(PHOTO_PATH);
          const info = JSON.parse(fs.readFileSync(CONTACT_PATH, 'utf8'));
          const photo = fs.readFileSync(PHOTO_PATH).toString('base64');
          compilation.emitAsset(VCARD_FILE, new sources.RawSource(buildVCard(info, photo)));
        },
      );
    });
  }
}

// Emits sw.js with every file in the build and a hash of their contents.
class ServiceWorkerPlugin {
  apply(compiler) {
    const { Compilation, sources } = compiler.webpack;
    compiler.hooks.thisCompilation.tap('ServiceWorkerPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        { name: 'ServiceWorkerPlugin', stage: Compilation.PROCESS_ASSETS_STAGE_REPORT },
        () => {
          compilation.fileDependencies.add(SW_PATH);
          const files = Object.keys(compilation.assets).filter((file) => !file.endsWith('.map')).sort();
          const hash = crypto.createHash('sha256');
          files.forEach((file) => hash.update(file).update(compilation.assets[file].buffer()));
          const sw = fs.readFileSync(SW_PATH, 'utf8')
            .replace('__BUILD__', hash.digest('hex').slice(0, 8))
            .replace('__FILES__', JSON.stringify(files));
          compilation.emitAsset('sw.js', new sources.RawSource(sw));
        },
      );
    });
  }
}

module.exports = (env, argv) => {
  const isProd = argv && argv.mode === 'production';

  return {
    mode: isProd ? 'production' : 'development',
    devtool: isProd ? 'source-map' : 'inline-source-map',
    performance: { hints: false },
    devServer: {
      static: { directory: path.resolve(__dirname, 'build') },
      historyApiFallback: true,
      port: 8080,
      open: true,
    },
    entry: './src/index.js',
    module: {
      rules: [
        { test: /\.css$/, use: ['style-loader', 'css-loader'] },
        {
          test: /\.(png|svg|jpe?g|gif|woff2?|eot|ttf|otf)$/i,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'src/index.html'),
        inject: 'body',
        // Re-read so contact.json edits show without a restart.
        templateParameters: () => ({
          contact: JSON.parse(fs.readFileSync(CONTACT_PATH, 'utf8')),
          vcardFile: VCARD_FILE,
        }),
      }),
      new VCardPlugin(),
      new CopyWebpackPlugin({
        patterns: [
          { from: path.resolve(__dirname, 'src/assets'), to: path.resolve(__dirname, 'build/assets'), noErrorOnMissing: true },
          { from: path.resolve(__dirname, 'src/manifest.json'), to: path.resolve(__dirname, 'build') },
        ],
      }),
      new ServiceWorkerPlugin(),
    ],
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: 'bundle.js',
      assetModuleFilename: 'assets/[name][contenthash][ext][query]',
    },
  };
};
