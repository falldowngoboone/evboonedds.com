const CopyPlugin = require('copy-webpack-plugin');
const Fiber = require('fibers');
const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const promisify = require('util').promisify;
const sass = require('sass');

const renderSass = promisify(sass.render);

module.exports = (env = {}) => {
  const isProduction = env.production;
  return {
    mode: isProduction ? 'production' : 'development',
    entry: './src/js/index.js',
    watch: !isProduction,
    output: {
      path: path.resolve(__dirname, '_site/js'),
      filename: 'bundle.js',
    },
    plugins: [
      new CopyPlugin([
        {
          from: 'src/sass',
          to: path.resolve(__dirname, '_site/css/[path][name].css'),
          ignore: ['_*'],
          async transform(content, file) {
            const result = await renderSass({
              file,
              fiber: Fiber,
              outputStyle: 'compressed',
              // TODO: sourcemaps
            });
            return result.css.toString();
          },
        },
      ]),
    ],
  };
};

/**
 * @param {string} path;
 * @param {Buffer} content;
 */
function writeMapFile(file, content) {
  mkdirp.sync(path.parse(file).dir);

  let writeStream = fs.createWriteStream(file);

  writeStream.write(content);
  writeStream.end();
}
