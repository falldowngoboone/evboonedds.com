const { promisify } = require('util');
const fse = require('fs-extra');
const path = require('path');
const { render } = require('mustache');
const glob = promisify(require('glob'));
const fm = require('front-matter');
const md = require('markdown-it')();
const sass = require('node-sass');
const renderSass = promisify(sass.render);
const config = require(path.join(__dirname, '..', 'config', 'data.json'));

const distPath = path.join(__dirname, '..', 'public');
const srcPath = path.join(__dirname, '..', 'src');

// clean the public folder
fse.emptyDirSync(distPath);

// TODO: support custom page CSS
fse.mkdirpSync(path.join(distPath, 'css'));

glob('**/[!_]*.scss', { cwd: srcPath }).then(files => {
  files.forEach(file => {
    renderSass({ file: path.join(srcPath, file) }).then(sassData => {
      const name = path.basename(file, '.scss');
      fse.writeFileSync(
        path.join(distPath, 'css', `${name}.css`),
        sassData.css
      );
    });
  });
});

// build the pages
glob('**/*.mustache', { cwd: path.join(srcPath, 'partials') })
  .then(files =>
    Promise.resolve(
      files.reduce((obj, filePath) => {
        const name = path.basename(filePath, '.mustache');
        obj[name] = fse.readFileSync(
          path.join(srcPath, 'partials', filePath),
          'utf8'
        );
        return obj;
      }, {})
    )
  )
  .then(partials =>
    glob('**/*.@(html|mustache|md)', { cwd: path.join(srcPath, 'pages') })
      .then(pagePaths => {
        pagePaths.forEach(pagePath => {
          fse
            .readFile(path.join(srcPath, 'pages', pagePath), 'utf8')
            .then(page => {
              const ext = path.extname(pagePath);
              const pageData = fm(page);
              const templateConfig = Object.assign({}, config, {
                page: pageData.attributes,
              });
              let content;

              switch (ext) {
                case '.mustache':
                  content = render(pageData.body, templateConfig, partials);
                  break;
                case '.md': {
                  const layout = templateConfig.page.layout || 'default';
                  templateConfig.page.body = md.render(pageData.body);
                  // TODO: handle cases where the layout does not exist, default to default
                  const template = fse.readFileSync(
                    path.join(
                      srcPath,
                      'layouts',
                      `${layout.toLowerCase()}.mustache`
                    ),
                    'utf8'
                  );
                  content = render(template, templateConfig, partials);
                  break;
                }
                default:
                  content = pageData.body;
              }

              const name = path.basename(pagePath, ext);
              fse.writeFileSync(path.join(distPath, `${name}.html`), content);
            });
        });
      })
      .catch(err => {
        throw err;
      })
  );

// TODO: build the JS
// TODO: process any assets (e.g. images)
