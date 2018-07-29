const path = require('path');
const bs = require('browser-sync').create();
const { render, parse } = require('mustache');

bs.watch('src/**/*', (event, file) => {
  if (event === 'init') {
    // compile mustache files
    // reload html
  }

  if (event === 'change') {
    handleFileChange.call(this, file);
  }
});

bs.init({ server: './src' });

function handleFileChange(file) {
  const ext = path.extname(file);

  if (ext === '.mustache') {
    // run mustache on that file, output to the output path
    // reload html from output path
  }

  bs.reload(file);
}
