const fs = require('fs');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const contact = require('./src/contact.json');

const CONTACT_PATH = path.resolve(__dirname, 'src/contact.json');
const PHOTO_PATH = path.resolve(__dirname, 'src', contact.photo);
const VCARD_FILE = `${contact.firstName}-${contact.lastName}.vcf`.toLowerCase();

// vCard text values escape backslashes, commas, semicolons and newlines.
const esc = (value) => String(value).replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

// Lines longer than 75 characters continue on the next line after a space.
const fold = (line) => line.match(/.{1,74}/g).join('\r\n ');

function buildVCard(info, photoBase64) {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${esc(info.lastName)};${esc(info.firstName)};;;`,
    `FN:${esc(info.name)}`,
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

// Emits the "Save contact" vCard from src/contact.json and the photo, in dev and in the build.
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
      // index.html is a template filled in from src/contact.json.
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'src/index.html'),
        inject: 'body',
        templateParameters: { contact, vcardFile: VCARD_FILE },
      }),
      new VCardPlugin(),
      new CopyWebpackPlugin({
        patterns: [
          { from: path.resolve(__dirname, 'src/assets'), to: path.resolve(__dirname, 'build/assets'), noErrorOnMissing: true },
        ],
      }),
    ],
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: 'bundle.js',
      assetModuleFilename: 'assets/[name][contenthash][ext][query]',
    },
  };
};
