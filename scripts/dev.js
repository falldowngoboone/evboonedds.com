const { promisify } = require('util');
const fs = require('fs-extra');
const path = require('path');
const { render: renderTemplate } = require('mustache');
const glob = promisify(require('glob'));
const fm = require('front-matter');
const md = require('markdown-it')();
const config = require(path.join(__dirname, '..', 'config', 'data.json'));
const sassRender = promisify(require('node-sass').render);
const { each, mapAsync, reduce, ensureAndWrite, fileName } = require('./utils');

const dest = path.join(__dirname, '..', 'public');
const src = path.join(__dirname, '..', 'src');
const cssSrc = path.join(src, 'css');
const cssDest = path.join(dest, 'css');
const partialsSrc = path.join(src, 'partials');
const bs = require('browser-sync').create();

bs.watch(path.join(cssSrc, '**/*.scss'), (event, file) =>
  // handle differently depending on whether the file is a partial or a top level
  // scss file, whether it's a change, a new file, or a file is deleted
  glob('**/[!_]*.scss', { cwd: cssSrc })
    .then(
      each(file => {
        const outFile = path.join(cssDest, `${fileName(file)}.css`);
        return sassRender({ file: path.join(cssSrc, file) })
          .then(data => ensureAndWrite({ file: outFile, data: data.css }))
          .catch(console.error);
      })
    )
    .then(bs.reload)
    .catch(console.error)
);

const readPartials = () =>
  glob('**/*.mustache', { cwd: partialsSrc })
    .then(
      mapAsync(async file =>
        fs
          .readFile(path.join(partialsSrc, file), 'utf8')
          .then(content => ({
            name: fileName(file),
            content,
          }))
          .catch(console.error)
      )
    )
    .then(reduce((obj, { name, content }) => ({ ...obj, [name]: content }), {}))
    .catch(console.error);

const processPage = file =>
  fs.readFile(path.join(src, 'pages', file), 'utf8').then(contents => {
    const { attributes, body } = fm(contents);
    const templateConfig = { ...config, page: attributes };

    switch (path.extname(file)) {
      case '.mustache':
        return readPartials()
          .then(partials => renderTemplate(body, templateConfig, partials))
          .catch(console.error);
      case '.md': {
        const layout = templateConfig.page.layout || 'default';
        templateConfig.page.body = md.render(body);
        return Promise.all([
          fs.readFile(
            path.join(src, 'layouts', `${layout.toLowerCase()}.mustache`),
            'utf8'
          ),
          readPartials(),
        ])
          .then(([template, partials]) =>
            renderTemplate(template, templateConfig, partials)
          )
          .catch(console.error);
      }
      default:
        return body;
    }
  });

bs.watch(path.join(src, '**/*.@(html|mustache|md)'), (event, file) =>
  glob('**/*.@(html|mustache|md)', { cwd: path.join(src, 'pages') })
    .then(
      each(file => {
        const outFile = path.join(dest, `${fileName(file)}.html`);
        processPage(file)
          .then(data => ensureAndWrite({ file: outFile, data }))
          .catch(console.error);
      })
    )
    .then(bs.reload)
    .catch(console.error)
);

bs.init({ server: path.join(__dirname, '..', 'public') });
