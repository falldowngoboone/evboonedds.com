const fs = require('fs-extra');
const path = require('path');

const ensureAndWrite = ({ file, data }) =>
  fs
    .ensureFile(file)
    .then(_ => fs.writeFile(file, data))
    .catch(console.error);

const each = (fn = () => {}) => (items = []) => items.forEach(fn);

const map = (fn = () => {}) => (items = []) => items.map(fn);

const mapAsync = (fn = async () => {}) => (items = []) =>
  Promise.all(items.map(fn)).catch(console.error);

const reduce = (fn = () => {}, initial) => (items = []) =>
  items.reduce(fn, initial);

const fileName = file => path.basename(file, path.extname(file));

module.exports = { ensureAndWrite, each, map, mapAsync, reduce, fileName };
